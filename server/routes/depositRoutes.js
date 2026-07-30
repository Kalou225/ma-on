import express from 'express';
import { z } from 'zod';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validate.js';
import { logSecurityEvent } from '../services/auditLogger.js';

const router = express.Router();

const depositSchema = z.object({
  body: z.object({
    amount: z.number().positive({ message: 'Le montant doit être un nombre positif' }),
    provider: z.string().min(2),
    recipientNumber: z.string().min(8),
    senderNumber: z.string().min(8),
    txnId: z.string().min(4, { message: 'ID de transaction valide requis' }),
    dateTime: z.string().min(5),
  }),
});

// 1. GET ACTIVE ADMIN RECEPTION NUMBERS
router.get('/payment-numbers', (req, res) => {
  const numbers = db.prepare('SELECT id, provider, number, holder, icon FROM admin_payment_numbers WHERE active = 1').all();
  res.json(numbers);
});

// 2. SUBMIT MANUAL DEPOSIT (USER)
router.post('/submit', authenticateToken, validateRequest(depositSchema), (req, res) => {
  const { amount, provider, recipientNumber, senderNumber, txnId, dateTime } = req.validated.body;
  const userId = req.user.id;

  // Check Anti-Replay: Ensure txnId is unique
  const existingTxn = db.prepare('SELECT id FROM transactions WHERE txn_id = ?').get(txnId.toUpperCase());
  if (existingTxn) {
    logSecurityEvent('REPLAY_DEPOSIT_ATTEMPT', { userId, ip: req.ip, details: { txnId }, severity: 'HIGH' });
    return res.status(400).json({ error: 'Cette référence de transaction a déjà été soumise.' });
  }

  const id = `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
  const isActivation = req.user.status === 'INACTIF';

  db.prepare(`
    INSERT INTO transactions (id, user_id, type, label, amount, provider, recipient_number, sender_number, txn_id, date_time, status, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EN_ATTENTE', 'En attente de vérification par l''administrateur')
  `).run(
    id,
    userId,
    isActivation ? 'DEPOT_ACTIVATION' : 'DEPOT_FONDS',
    isActivation ? 'Dépôt Activation de Compte' : `Dépôt Manuel ${provider}`,
    amount,
    provider,
    recipientNumber,
    senderNumber,
    txnId.toUpperCase(),
    dateTime
  );

  logSecurityEvent('MANUAL_DEPOSIT_SUBMITTED', { userId, ip: req.ip, details: { amount, txnId } });

  res.status(201).json({
    message: 'Dépôt transmis à l\'administrateur pour vérification manuelle.',
    transactionId: id,
  });
});

// 3. GET USER TRANSACTIONS
router.get('/my-transactions', authenticateToken, (req, res) => {
  const txns = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date_time DESC').all(req.user.id);
  res.json(txns);
});

export default router;
