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

  const user = db.prepare('SELECT activation_balance, commission_balance, status, name FROM users WHERE id = ?').get(userId);

  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable.' });
  }

  if (user.status !== 'ACTIF' || (user.activation_balance || 0) <= 0) {
    return res.status(403).json({
      error: 'Retrait impossible : Votre compte est actuellement INACTIF. Vous devez effectuer votre premier dépôt d\'activation pour débloquer les retraits (vos commissions accumulées restent conservées sur votre Solde Commission).',
    });
  }

  // 1. Contrôle du Solde Commission disponible
  const commBal = user.commission_balance || 0;
  if (commBal < amount) {
    return res.status(400).json({ error: `Solde commission insuffisant. Votre solde commission retirable est de ${commBal.toLocaleString('fr-FR')} FCFA.` });
  }

  // 2. Contrôle du Plafond de Retrait : 1/3 du Solde d'Activation
  const actBal = user.activation_balance || 0;
  const maxAllowedLimit = Math.floor(actBal / 3);
  if (amount > maxAllowedLimit) {
    return res.status(400).json({
      error: `Montant supérieur à la limite autorisée. Vous ne pouvez retirer que maximum 1/3 de votre solde d'activation (Plafond autorisé: ${maxAllowedLimit.toLocaleString('fr-FR')} FCFA pour un solde d'activation de ${actBal.toLocaleString('fr-FR')} FCFA).`,
    });
  }

  // 3. Contrôle de Fréquence : 1 seul retrait par mois calendaire
  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const countMonthlyWithdrawals = db.prepare(`
    SELECT COUNT(*) as count FROM transactions
    WHERE user_id = ? AND type = 'RETRAIT_FONDS' AND status IN ('VALIDÉ', 'EN_ATTENTE')
      AND date_time LIKE ?
  `).get(userId, `${currentMonthPrefix}%`).count;

  if (countMonthlyWithdrawals > 0) {
    return res.status(400).json({
      error: 'Limite atteinte : Vous avez déjà soumis ou effectué un retrait pour ce mois-ci. Les membres ont droit à 1 seul retrait par mois.',
    });
  }

  const id = `WTH-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateTime = new Date().toISOString();

  // Deduct commission_balance and update last_withdrawal_date
  const executeWithdrawal = db.transaction(() => {
    db.prepare(`
      INSERT INTO transactions (id, user_id, type, label, amount, provider, recipient_number, date_time, status, note)
      VALUES (?, ?, 'RETRAIT_FONDS', ?, ?, ?, ?, ?, 'EN_ATTENTE', 'Demande de retrait en cours de traitement par l''administrateur')
    `).run(id, userId, `Retrait vers ${provider} (${recipientNumber})`, amount, provider, recipientNumber, dateTime);

    db.prepare(`
      UPDATE users
      SET commission_balance = commission_balance - ?, balance = commission_balance - ?, last_withdrawal_date = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(amount, amount, userId);
  });

  executeWithdrawal();

  logSecurityEvent('WITHDRAWAL_REQUESTED', { userId, ip: req.ip, details: { amount, provider, recipientNumber } });

  res.status(201).json({
    message: 'Demande de retrait soumise avec succès. En attente de validation administrateur.',
    transactionId: id,
    newCommissionBalance: commBal - amount,
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
