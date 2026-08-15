import express from 'express';
import bcrypt from 'bcryptjs';
import db, { checkpointDb, saveUserToStore, removeUserFromStore } from '../db/database.js';
import { config } from '../config/security.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { logSecurityEvent } from '../services/auditLogger.js';
import { createNotification } from '../services/notificationService.js';
import { calculateRankAndRate, getRankDetails } from '../services/rankService.js';

const router = express.Router();

// Middleware: All routes require ADMIN role
router.use(authenticateToken, requireRole('ADMIN'));

// Helper to update user rank based on activation_balance
const updateUserRankFromActivation = (userId) => {
  const user = db.prepare('SELECT id, activation_balance FROM users WHERE id = ?').get(userId);
  if (!user) return;

  const { rank } = calculateRankAndRate(user.activation_balance);
  db.prepare('UPDATE users SET rank = ? WHERE id = ?').run(rank, userId);
  return rank;
};

// 1. GET ALL USERS WITH COMPLETE STATISTICS (ADMIN)
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT 
      u.id, u.name, u.email, u.phone, u.role, u.status, u.rank,
      COALESCE(u.activation_balance, 0) as activation_balance,
      COALESCE(u.commission_balance, u.balance, 0) as commission_balance,
      COALESCE(u.network_earnings, 0) as network_earnings,
      u.my_referral_code, u.sponsor_code, u.created_at,
      (SELECT COUNT(*) FROM users f WHERE f.sponsor_code = u.my_referral_code) as direct_referrals_count,
      (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id) as total_transactions
    FROM users u
    ORDER BY u.created_at DESC
  `).all();

  res.json(users);
});

// 2. GET ALL PENDING DEPOSITS
router.get('/pending-deposits', (req, res) => {
  const pending = db.prepare(`
    SELECT t.*, u.name as user_name, u.email as user_email, u.phone as user_phone
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    WHERE t.type IN ('DEPOT_ACTIVATION', 'DEPOT_FONDS') AND t.status = 'EN_ATTENTE'
    ORDER BY t.date_time DESC
  `).all();

  res.json(pending);
});

// 2. GET ALL PENDING WITHDRAWALS
router.get('/pending-withdrawals', (req, res) => {
  const pending = db.prepare(`
    SELECT t.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.commission_balance as user_balance, u.activation_balance
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    WHERE t.type = 'RETRAIT_FONDS' AND t.status = 'EN_ATTENTE'
    ORDER BY t.date_time DESC
  `).all();

  res.json(pending);
});

// 3. APPROVE DEPOSIT & DISTRIBUTE MLM COMMISSIONS (ADMIN)
router.post('/approve-deposit/:id', (req, res) => {
  const { id } = req.params;

  const txn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  if (!txn || txn.status !== 'EN_ATTENTE') {
    return res.status(400).json({ error: 'Transaction introuvable ou déjà traitée.' });
  }

  const user = db.prepare('SELECT id, name, sponsor_code, activation_balance FROM users WHERE id = ?').get(txn.user_id);

  // Execute database transaction atomically
  const executeApproval = db.transaction(() => {
    // 1. Update Transaction
    db.prepare(`
      UPDATE transactions
      SET status = 'VALIDÉ', note = 'Approuvé par l''administrateur', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, id);

    // 2. Update User Activation Balance & Status & Rank
    const newActivationBal = (user.activation_balance || 0) + txn.amount;
    const { rank: newRank } = calculateRankAndRate(newActivationBal);

    db.prepare(`
      UPDATE users
      SET activation_balance = ?, status = 'ACTIF', rank = ?
      WHERE id = ?
    `).run(newActivationBal, newRank, txn.user_id);

    // Notification pour le déposant
    createNotification(
      txn.user_id,
      'Compte Activé / Dépôt Valide 🎉',
      `Votre dépôt de ${txn.amount.toLocaleString()} FCFA a été validé. Votre Solde d'Activation est de ${newActivationBal.toLocaleString()} FCFA (Rang: ${newRank}).`,
      'SUCCESS'
    );

    // 3. Automated Direct Referral Commission (3% sur activation)
    if (user && user.sponsor_code) {
      const sponsorL1 = db.prepare('SELECT id, name, commission_balance, activation_balance, sponsor_code FROM users WHERE my_referral_code = ?').get(user.sponsor_code);
      if (sponsorL1) {
        const directComm = Math.round(txn.amount * 0.03); // 3% Commission Parrainage Direct
        if (directComm > 0) {
          db.prepare(`
            UPDATE users
            SET commission_balance = commission_balance + ?, balance = commission_balance + ?, network_earnings = network_earnings + ?
            WHERE id = ?
          `).run(directComm, directComm, directComm, sponsorL1.id);

          const commTxnId = `COMM-DIR-${Math.floor(1000 + Math.random() * 9000)}`;
          db.prepare(`
            INSERT INTO transactions (id, user_id, type, label, amount, date_time, status, note)
            VALUES (?, ?, 'COMMISSION_RESEAU', ?, ?, CURRENT_TIMESTAMP, 'VALIDÉ', ?)
          `).run(
            commTxnId,
            sponsorL1.id,
            `Commission Directe Parrainage (3% de ${user.name})`,
            directComm,
            `Commission directe 3% générée par l'activation de ${user.name}`
          );

          createNotification(
            sponsorL1.id,
            'Commission Directe Received 💰',
            `Vous avez reçu une commission de parrainage de ${directComm.toLocaleString()} FCFA (3%) suite à l'activation de ${user.name}.`,
            'SUCCESS'
          );
        }

        // 4. Upline Network Branch Distribution (Jusqu'au Grand Maître dans la branche directe)
        let currentSponsorCode = user.sponsor_code;
        let depth = 0;
        const maxDepth = 20; // Protection contre les boucles infinies

        while (currentSponsorCode && depth < maxDepth) {
          depth++;
          const currentSponsor = db.prepare('SELECT id, name, rank, activation_balance, sponsor_code FROM users WHERE my_referral_code = ?').get(currentSponsorCode);
          if (!currentSponsor) break;

          const sponsorRank = getRankDetails(currentSponsor.rank || calculateRankAndRate(currentSponsor.activation_balance).rank);
          const rank = sponsorRank.name;
          const rate = sponsorRank.rate;
          const label = sponsorRank.label;
          const networkComm = Math.round(txn.amount * rate);

          if (networkComm > 0) {
            db.prepare(`
              UPDATE users
              SET commission_balance = commission_balance + ?, balance = commission_balance + ?, network_earnings = network_earnings + ?
              WHERE id = ?
            `).run(networkComm, networkComm, networkComm, currentSponsor.id);

            const commNetTxnId = `COMM-NET-${Math.floor(10000 + Math.random() * 90000)}`;
            db.prepare(`
              INSERT INTO transactions (id, user_id, type, label, amount, date_time, status, note)
              VALUES (?, ?, 'COMMISSION_RESEAU', ?, ?, CURRENT_TIMESTAMP, 'VALIDÉ', ?)
            `).run(
              commNetTxnId,
              currentSponsor.id,
              `Commission Réseau (${label} de ${user.name})`,
              networkComm,
              `Distribution réseau (${(rate * 100).toFixed(0)}%) générée par ${user.name}`
            );

            createNotification(
              currentSponsor.id,
              'Gain Réseau Crédité 🚀',
              `Vous avez reçu un gain réseau de ${networkComm.toLocaleString()} FCFA (${label}) suite au dépôt de ${user.name}.`,
              'SUCCESS'
            );
          }

          // Si on a atteint un Grand Maître, la branche supérieure directe est complètement servie
          if (rank === 'Grand Maître') break;

          currentSponsorCode = currentSponsor.sponsor_code;
        }
      }
    }
  });

  executeApproval();

  logSecurityEvent('DEPOSIT_APPROVED', {
    userId: req.user.id,
    ip: req.ip,
    details: { txnId: id, targetUser: txn.user_id, amount: txn.amount },
    severity: 'HIGH',
  });

  res.json({ message: `Dépôt ${id} validé avec succès. Solde d'activation mis à jour et commissions distribuées.` });
});

// 4. REJECT DEPOSIT (ADMIN)
router.post('/reject-deposit/:id', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const txn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  if (!txn || txn.status !== 'EN_ATTENTE') {
    return res.status(400).json({ error: 'Transaction introuvable ou déjà traitée.' });
  }

  const rejectedReason = reason || 'Référence non valide ou non reçue';

  db.prepare(`
    UPDATE transactions
    SET status = 'REJETÉ', note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(rejectedReason, req.user.id, id);

  createNotification(
    txn.user_id,
    'Dépôt Rejeté ⚠️',
    `Votre demande de dépôt de ${txn.amount.toLocaleString()} FCFA a été rejetée. Motif: ${rejectedReason}`,
    'WARNING'
  );

  logSecurityEvent('DEPOSIT_REJECTED', {
    userId: req.user.id,
    ip: req.ip,
    details: { txnId: id, reason: rejectedReason },
  });

  res.json({ message: `Dépôt ${id} rejeté.` });
});

// 5. APPROVE WITHDRAWAL (ADMIN)
router.post('/approve-withdrawal/:id', (req, res) => {
  const { id } = req.params;

  const txn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  if (!txn || txn.status !== 'EN_ATTENTE' || txn.type !== 'RETRAIT_FONDS') {
    return res.status(400).json({ error: 'Demande de retrait introuvable ou déjà traitée.' });
  }

  db.prepare(`
    UPDATE transactions
    SET status = 'VALIDÉ', note = 'Retrait approuvé et exécuté par l''administrateur', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, id);

  createNotification(
    txn.user_id,
    'Retrait Validé 💸',
    `Votre demande de retrait de ${txn.amount.toLocaleString()} FCFA a été approuvée et transférée vers votre compte Mobile Money.`,
    'SUCCESS'
  );

  logSecurityEvent('WITHDRAWAL_APPROVED', {
    userId: req.user.id,
    ip: req.ip,
    details: { txnId: id, targetUser: txn.user_id, amount: txn.amount },
  });

  res.json({ message: `Retrait ${id} approuvé et traité avec succès.` });
});

// 6. REJECT WITHDRAWAL (ADMIN)
router.post('/reject-withdrawal/:id', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const txn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  if (!txn || txn.status !== 'EN_ATTENTE' || txn.type !== 'RETRAIT_FONDS') {
    return res.status(400).json({ error: 'Demande de retrait introuvable ou déjà traitée.' });
  }

  const rejectedReason = reason || 'Demande de retrait rejetée';

  // Refund the user balance if rejected
  const executeRejection = db.transaction(() => {
    db.prepare(`
      UPDATE transactions
      SET status = 'REJETÉ', note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(rejectedReason, req.user.id, id);

    db.prepare('UPDATE users SET commission_balance = commission_balance + ?, balance = commission_balance + ? WHERE id = ?').run(txn.amount, txn.amount, txn.user_id);

    createNotification(
      txn.user_id,
      'Retrait Rejeté ⚠️',
      `Votre demande de retrait de ${txn.amount.toLocaleString()} FCFA a été rejetée. Le montant a été ré-crédité sur votre solde. Motif: ${rejectedReason}`,
      'WARNING'
    );
  });

  executeRejection();

  logSecurityEvent('WITHDRAWAL_REJECTED', {
    userId: req.user.id,
    ip: req.ip,
    details: { txnId: id, reason: rejectedReason },
  });

  res.json({ message: `Retrait ${id} rejeté. Montant remboursé sur le solde du membre.` });
});

// 7. GET AUDIT LOGS
router.get('/audit-logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50').all();
  res.json(logs);
});

// 8. GET ALL PAYMENT NUMBERS (ADMIN)
router.get('/payment-numbers', (req, res) => {
  const numbers = db.prepare('SELECT * FROM admin_payment_numbers ORDER BY created_at DESC').all();
  res.json(numbers);
});

// 8b. ADD NEW PAYMENT NUMBER (ADMIN)
router.post('/payment-numbers', (req, res) => {
  const { provider, number, holder, icon } = req.body;
  if (!provider || !number || !holder) {
    return res.status(400).json({ error: 'Champs requis manquants (Opérateur, Numéro, Titulaire).' });
  }

  let defaultIcon = icon;
  if (!defaultIcon) {
    if (provider.includes('Wave')) defaultIcon = '🌊';
    else if (provider.includes('Orange')) defaultIcon = '🟠';
    else if (provider.includes('MTN')) defaultIcon = '🟡';
    else if (provider.includes('Moov')) defaultIcon = '🟢';
    else defaultIcon = '📱';
  }

  const result = db.prepare(`
    INSERT INTO admin_payment_numbers (provider, number, holder, icon, active) VALUES (?, ?, ?, ?, 1)
  `).run(provider.trim(), number.trim(), holder.trim(), defaultIcon);

  logSecurityEvent('PAYMENT_NUMBER_ADDED', {
    userId: req.user.id,
    ip: req.ip,
    details: { provider, number, holder },
    severity: 'INFO',
  });

  res.status(201).json({
    message: 'Numéro d\'encaissement ajouté avec succès.',
    id: result.lastInsertRowid,
    paymentNumber: {
      id: result.lastInsertRowid,
      provider: provider.trim(),
      number: number.trim(),
      holder: holder.trim(),
      icon: defaultIcon,
      active: 1,
    },
  });
});

// 8c. UPDATE PAYMENT NUMBER (ADMIN)
router.put('/payment-numbers/:id', (req, res) => {
  const { id } = req.params;
  const { provider, number, holder, icon, active } = req.body;

  const existing = db.prepare('SELECT * FROM admin_payment_numbers WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Numéro d\'encaissement introuvable.' });
  }

  if (!provider || !number || !holder) {
    return res.status(400).json({ error: 'Champs requis manquants.' });
  }

  let finalIcon = icon || existing.icon;
  if (!finalIcon) {
    if (provider.includes('Wave')) finalIcon = '🌊';
    else if (provider.includes('Orange')) finalIcon = '🟠';
    else if (provider.includes('MTN')) finalIcon = '🟡';
    else if (provider.includes('Moov')) finalIcon = '🟢';
    else finalIcon = '📱';
  }

  const isActive = active !== undefined ? (active ? 1 : 0) : existing.active;

  db.prepare(`
    UPDATE admin_payment_numbers
    SET provider = ?, number = ?, holder = ?, icon = ?, active = ?
    WHERE id = ?
  `).run(provider.trim(), number.trim(), holder.trim(), finalIcon, isActive, id);

  logSecurityEvent('PAYMENT_NUMBER_UPDATED', {
    userId: req.user.id,
    ip: req.ip,
    details: { id, provider, number, holder, active: isActive },
    severity: 'INFO',
  });

  res.json({
    message: 'Numéro d\'encaissement mis à jour avec succès.',
    paymentNumber: {
      id: Number(id),
      provider: provider.trim(),
      number: number.trim(),
      holder: holder.trim(),
      icon: finalIcon,
      active: isActive,
    },
  });
});

// 8d. TOGGLE ACTIVE STATUS (ADMIN)
router.patch('/payment-numbers/:id/toggle', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM admin_payment_numbers WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Numéro d\'encaissement introuvable.' });
  }

  const newActive = existing.active === 1 ? 0 : 1;
  db.prepare('UPDATE admin_payment_numbers SET active = ? WHERE id = ?').run(newActive, id);

  res.json({
    message: `Numéro ${newActive === 1 ? 'activé' : 'désactivé'} avec succès.`,
    active: newActive,
  });
});

// 8e. DELETE PAYMENT NUMBER (ADMIN)
router.delete('/payment-numbers/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM admin_payment_numbers WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Numéro d\'encaissement introuvable.' });
  }

  db.prepare('DELETE FROM admin_payment_numbers WHERE id = ?').run(id);

  logSecurityEvent('PAYMENT_NUMBER_DELETED', {
    userId: req.user.id,
    ip: req.ip,
    details: { id, provider: existing.provider, number: existing.number },
    severity: 'WARNING',
  });

  res.json({ message: 'Numéro d\'encaissement supprimé avec succès.' });
});

// 9. DELETE USER (ADMIN)
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  if (id === req.user.id) {
    return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte administrateur.' });
  }

  const targetUser = db.prepare('SELECT id, name, email, phone, role FROM users WHERE id = ?').get(id);
  if (!targetUser) {
    return res.status(404).json({ error: 'Utilisateur introuvable.' });
  }

  if (targetUser.role === 'ADMIN') {
    return res.status(403).json({ error: 'La suppression d\'un compte administrateur est interdite.' });
  }

  // Delete related data in atomic transaction
  const executeDelete = db.transaction(() => {
    db.prepare('DELETE FROM transactions WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  });

  executeDelete();
  removeUserFromStore(id);
  checkpointDb();

  logSecurityEvent('USER_DELETED_BY_ADMIN', {
    userId: req.user.id,
    ip: req.ip,
    details: { targetUserId: id, targetEmail: targetUser.email, targetName: targetUser.name, targetPhone: targetUser.phone },
    severity: 'HIGH',
  });

  res.json({
    message: `Compte utilisateur (${targetUser.name} - ${targetUser.email}) supprimé avec succès.`,
  });
});

// 10. RESET USER PASSWORD (ADMIN)
router.post('/users/:id/reset-password', (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  const targetUser = db.prepare('SELECT id, name, email, phone FROM users WHERE id = ?').get(id);
  if (!targetUser) {
    return res.status(404).json({ error: 'Utilisateur introuvable.' });
  }

  const finalPassword = newPassword && newPassword.trim().length >= 8 ? newPassword.trim() : 'EcoFinance@2026';
  const passwordHash = bcrypt.hashSync(finalPassword, config.saltRounds);

  db.prepare('UPDATE users SET password_hash = ?, failed_attempts = 0, lockout_until = NULL WHERE id = ?').run(passwordHash, id);
  saveUserToStore({ id, password_hash: passwordHash });
  checkpointDb();

  logSecurityEvent('USER_PASSWORD_RESET_BY_ADMIN', {
    userId: req.user.id,
    ip: req.ip,
    details: { targetUserId: id, targetEmail: targetUser.email },
    severity: 'HIGH',
  });

  res.json({
    message: `Mot de passe réinitialisé avec succès pour ${targetUser.name}.`,
    temporaryPassword: finalPassword,
  });
});

export default router;
