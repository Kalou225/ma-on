import express from 'express';
import { z } from 'zod';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validate.js';
import { logSecurityEvent } from '../services/auditLogger.js';

const router = express.Router();

const withdrawalSchema = z.object({
  body: z.object({
    amount: z.number().min(1000, { message: 'Le montant minimum de retrait est de 1000 FCFA' }),
    provider: z.string().min(2, { message: 'Moyen de paiement requis' }),
    recipientNumber: z.string().min(8, { message: 'Numéro de réception requis' }),
  }),
});

// 1. SUBMIT WITHDRAWAL REQUEST (USER)
router.post('/request', authenticateToken, validateRequest(withdrawalSchema), (req, res) => {
  const { amount, provider, recipientNumber } = req.validated.body;
  const userId = req.user.id;

  const user = db.prepare('SELECT balance, status, name FROM users WHERE id = ?').get(userId);

  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable.' });
  }

  if (user.status !== 'ACTIF') {
    return res.status(403).json({ error: 'Votre compte doit être ACTIF pour effectuer un retrait.' });
  }

  if (user.balance < amount) {
    return res.status(400).json({ error: `Solde insuffisant. Votre solde disponible est de ${user.balance.toLocaleString('fr-FR')} FCFA.` });
  }

  const id = `WTH-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateTime = new Date().toISOString();

  // Deduct balance temporarily or lock it until processed
  const executeWithdrawal = db.transaction(() => {
    db.prepare(`
      INSERT INTO transactions (id, user_id, type, label, amount, provider, recipient_number, date_time, status, note)
      VALUES (?, ?, 'RETRAIT_FONDS', ?, ?, ?, ?, ?, 'EN_ATTENTE', 'Demande de retrait en cours de traitement par l''administrateur')
    `).run(id, userId, `Retrait vers ${provider} (${recipientNumber})`, amount, provider, recipientNumber, dateTime);

    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, userId);
  });

  executeWithdrawal();

  logSecurityEvent('WITHDRAWAL_REQUESTED', { userId, ip: req.ip, details: { amount, provider, recipientNumber } });

  res.status(201).json({
    message: 'Demande de retrait soumise avec succès. En attente de validation administrateur.',
    transactionId: id,
    newBalance: user.balance - amount,
  });
});

// 2. GET USER WITHDRAWALS
router.get('/my-withdrawals', authenticateToken, (req, res) => {
  const withdrawals = db.prepare(`
    SELECT * FROM transactions
    WHERE user_id = ? AND type = 'RETRAIT_FONDS'
    ORDER BY date_time DESC
  `).all(req.user.id);

  res.json(withdrawals);
});

export default router;
