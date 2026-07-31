import express from 'express';
import db from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { logSecurityEvent } from '../services/auditLogger.js';
import { createNotification } from '../services/notificationService.js';
import { calculateRankAndRate } from '../services/rankService.js';

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

// 1. GET ALL PENDING DEPOSITS
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
          const currentSponsor = db.prepare('SELECT id, name, activation_balance, sponsor_code FROM users WHERE my_referral_code = ?').get(currentSponsorCode);
          if (!currentSponsor) break;

          const { rank, rate, label } = calculateRankAndRate(currentSponsor.activation_balance);
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

// 8. ADD NEW PAYMENT NUMBER
router.post('/payment-numbers', (req, res) => {
  const { provider, number, holder, icon } = req.body;
  if (!provider || !number || !holder) {
    return res.status(400).json({ error: 'Champs requis manquants.' });
  }

  const result = db.prepare(`
    INSERT INTO admin_payment_numbers (provider, number, holder, icon) VALUES (?, ?, ?, ?)
  `).run(provider, number, holder, icon || '📱');

  res.status(201).json({ message: 'Numéro d\'encaissement ajouté', id: result.lastInsertRowid });
});

export default router;
