import express from 'express';
import db from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { logSecurityEvent } from '../services/auditLogger.js';

const router = express.Router();

// Middleware: All routes require ADMIN role
router.use(authenticateToken, requireRole('ADMIN'));

// Helper to update user rank based on direct active count and network earnings
const updateSponsorRank = (sponsorId) => {
  const sponsor = db.prepare('SELECT id, my_referral_code, network_earnings FROM users WHERE id = ?').get(sponsorId);
  if (!sponsor) return;

  const directActiveCount = db.prepare(`
    SELECT COUNT(*) as count FROM users
    WHERE sponsor_code = ? AND status = 'ACTIF'
  `).get(sponsor.my_referral_code).count;

  let newRank = 'Apprenti';
  if (directActiveCount >= 30 || sponsor.network_earnings >= 2000000) {
    newRank = 'Grand Maître';
  } else if (directActiveCount >= 15 || sponsor.network_earnings >= 500000) {
    newRank = 'Maître';
  } else if (directActiveCount >= 5 || sponsor.network_earnings >= 100000) {
    newRank = 'Compagnon';
  }

  db.prepare('UPDATE users SET rank = ? WHERE id = ?').run(newRank, sponsorId);
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
    SELECT t.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.balance as user_balance
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

  const user = db.prepare('SELECT id, name, sponsor_code FROM users WHERE id = ?').get(txn.user_id);

  // Execute database transaction atomically
  const executeApproval = db.transaction(() => {
    // 1. Update Transaction
    db.prepare(`
      UPDATE transactions
      SET status = 'VALIDÉ', note = 'Approuvé par l''administrateur', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, id);

    // 2. Update User Balance & Status
    const isActivation = txn.type === 'DEPOT_ACTIVATION';
    if (isActivation) {
      db.prepare('UPDATE users SET balance = balance + ?, status = \'ACTIF\' WHERE id = ?').run(txn.amount, txn.user_id);
    } else {
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(txn.amount, txn.user_id);
    }

    // 3. Automated MLM Referral Commission (10% on activation / deposit)
    if (user && user.sponsor_code) {
      const sponsor = db.prepare('SELECT id, name, balance, network_earnings FROM users WHERE my_referral_code = ?').get(user.sponsor_code);
      if (sponsor) {
        const commissionRate = 0.10; // 10% commission
        const commissionAmount = Math.round(txn.amount * commissionRate);

        if (commissionAmount > 0) {
          // Credit Sponsor Balance & Network Earnings
          db.prepare(`
            UPDATE users
            SET balance = balance + ?, network_earnings = network_earnings + ?
            WHERE id = ?
          `).run(commissionAmount, commissionAmount, sponsor.id);

          // Insert Commission Transaction for Sponsor
          const commTxnId = `COMM-${Math.floor(1000 + Math.random() * 9000)}`;
          db.prepare(`
            INSERT INTO transactions (id, user_id, type, label, amount, date_time, status, note)
            VALUES (?, ?, 'COMMISSION_RESEAU', ?, ?, CURRENT_TIMESTAMP, 'VALIDÉ', ?)
          `).run(
            commTxnId,
            sponsor.id,
            `Commission Parrainage (10% de ${user.name})`,
            commissionAmount,
            `Commission automatique générée par le dépôt ${txn.id}`
          );

          // Update Sponsor Rank dynamically
          updateSponsorRank(sponsor.id);
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

  res.json({ message: `Dépôt ${id} validé avec succès. Solde membre et commission parrain crédités.` });
});

// 4. REJECT DEPOSIT (ADMIN)
router.post('/reject-deposit/:id', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const txn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  if (!txn || txn.status !== 'EN_ATTENTE') {
    return res.status(400).json({ error: 'Transaction introuvable ou déjà traitée.' });
  }

  db.prepare(`
    UPDATE transactions
    SET status = 'REJETÉ', note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reason || 'Référence non valide ou non reçue', req.user.id, id);

  logSecurityEvent('DEPOSIT_REJECTED', {
    userId: req.user.id,
    ip: req.ip,
    details: { txnId: id, reason },
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

  // Refund the user balance if rejected
  const executeRejection = db.transaction(() => {
    db.prepare(`
      UPDATE transactions
      SET status = 'REJETÉ', note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reason || 'Demande de retrait rejetée', req.user.id, id);

    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(txn.amount, txn.user_id);
  });

  executeRejection();

  logSecurityEvent('WITHDRAWAL_REJECTED', {
    userId: req.user.id,
    ip: req.ip,
    details: { txnId: id, reason },
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
