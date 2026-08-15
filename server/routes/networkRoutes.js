import express from 'express';
import db, { checkpointDb, saveUserToStore } from '../db/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getNextRank, getRankDetails } from '../services/rankService.js';
import { logSecurityEvent } from '../services/auditLogger.js';
import { createNotification } from '../services/notificationService.js';

const router = express.Router();

// 1. GET REFERRAL NETWORK TREE (Up to 3 levels)
router.get('/tree', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const currentUser = db.prepare('SELECT id, my_referral_code FROM users WHERE id = ?').get(userId);
  if (!currentUser) {
    return res.status(404).json({ error: 'Utilisateur introuvable.' });
  }

  // Level 1: Direct referrals
  const level1Users = db.prepare(`
    SELECT id, name, email, phone, status, rank, balance, network_earnings, created_at, my_referral_code
    FROM users
    WHERE sponsor_code = ?
    ORDER BY created_at DESC
  `).all(currentUser.my_referral_code);

  // Level 2 & 3 referrals calculation
  const tree = level1Users.map((userL1) => {
    const level2Users = db.prepare(`
      SELECT id, name, email, phone, status, rank, balance, network_earnings, created_at, my_referral_code
      FROM users
      WHERE sponsor_code = ?
      ORDER BY created_at DESC
    `).all(userL1.my_referral_code);

    const level2WithSub = level2Users.map((userL2) => {
      const level3Users = db.prepare(`
        SELECT id, name, email, phone, status, rank, balance, network_earnings, created_at
        FROM users
        WHERE sponsor_code = ?
        ORDER BY created_at DESC
      `).all(userL2.my_referral_code);

      return {
        ...userL2,
        level: 2,
        children: level3Users.map((l3) => ({ ...l3, level: 3, children: [] })),
      };
    });

    return {
      ...userL1,
      level: 1,
      children: level2WithSub,
    };
  });

  // Calculate totals
  const totalDirectCount = level1Users.length;
  const activeDirectCount = level1Users.filter((u) => u.status === 'ACTIF').length;

  let totalTeamCount = totalDirectCount;
  level1Users.forEach((l1) => {
    totalTeamCount += l1.children ? l1.children.length : 0;
    if (l1.children) {
      l1.children.forEach((l2) => {
        totalTeamCount += l2.children ? l2.children.length : 0;
      });
    }
  });

  res.json({
    referralCode: currentUser.my_referral_code,
    stats: {
      totalDirectCount,
      activeDirectCount,
      totalTeamCount,
    },
    tree,
  });
});

// 2. UPGRADE RANK VIA COMMISSION BALANCE (USER ACTION)
router.post('/upgrade-rank', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const user = db.prepare(`
    SELECT id, name, email, phone, status, rank, commission_balance, balance, activation_balance 
    FROM users 
    WHERE id = ?
  `).get(userId);

  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable.' });
  }

  if (user.status !== 'ACTIF' || (user.activation_balance || 0) <= 0) {
    return res.status(400).json({
      error: 'Vous devez d\'abord activer votre compte avec un 1er dépôt pour pouvoir monter de grade.',
    });
  }

  const currentRank = user.rank || 'Apprenti';
  const currentIndex = RANKS_CONFIG.findIndex(
    (r) => r.name.toLowerCase() === currentRank.trim().toLowerCase()
  );

  let targetRank = null;
  if (req.body && req.body.targetRank) {
    targetRank = getRankDetails(req.body.targetRank);
    const targetIndex = RANKS_CONFIG.findIndex(
      (r) => r.name.toLowerCase() === targetRank.name.toLowerCase()
    );
    if (targetIndex <= currentIndex) {
      return res.status(400).json({
        error: `Le grade sélectionné (${targetRank.name}) doit être supérieur à votre grade actuel (${currentRank}).`,
      });
    }
  } else {
    targetRank = getNextRank(currentRank);
  }

  if (!targetRank) {
    return res.status(400).json({
      error: 'Vous avez déjà atteint le grade suprême (Grand Maître) !',
    });
  }

  const userCommission = user.commission_balance || 0;
  if (userCommission < targetRank.cost) {
    return res.status(400).json({
      error: `Solde Commission insuffisant (${userCommission.toLocaleString()} FCFA). Le palier requis pour débloquer le grade ${targetRank.name} est de ${targetRank.cost.toLocaleString()} FCFA.`,
      requiredAmount: targetRank.cost,
      currentCommission: userCommission,
      missingAmount: targetRank.cost - userCommission,
    });
  }

  try {
    const executeUpgrade = db.transaction(() => {
      const newCommissionBal = userCommission - targetRank.cost;
      const newTotalBal = Math.max(0, (user.balance || 0) - targetRank.cost);

      // 1. Update user balances and rank
      db.prepare(`
        UPDATE users
        SET commission_balance = ?,
            balance = ?,
            rank = ?
        WHERE id = ?
      `).run(newCommissionBal, newTotalBal, targetRank.name, userId);

      // 2. Record transaction
      const txnId = `UPG-${Math.floor(1000 + Math.random() * 9000)}`;
      db.prepare(`
        INSERT INTO transactions (id, user_id, type, label, amount, date_time, status, note)
        VALUES (?, ?, 'UPGRADE_GRADE', ?, ?, CURRENT_TIMESTAMP, 'VALIDÉ', ?)
      `).run(
        txnId,
        userId,
        `Montée au grade ${targetRank.name}`,
        targetRank.cost,
        `Prélèvement Solde Commission (${targetRank.cost.toLocaleString()} FCFA) pour accès au grade ${targetRank.name} (${(targetRank.rate * 100).toFixed(0)}% commission réseau).`
      );

      // 3. Create Notification
      createNotification(
        userId,
        'Nouveau Grade Débloqué ! 🏆',
        `Félicitations ! Vous êtes passé au grade ${targetRank.name}. Votre taux de commission réseau est désormais de ${(targetRank.rate * 100).toFixed(0)}%.`,
        'SUCCESS'
      );

      // 4. Update Mirror Store
      saveUserToStore({
        id: userId,
        rank: targetRank.name,
        commission_balance: newCommissionBal,
        balance: newTotalBal,
      });
      checkpointDb();

      // 5. Security audit
      logSecurityEvent('RANK_UPGRADED_SUCCESS', {
        userId,
        ip: req.ip,
        details: {
          previousRank: currentRank,
          newRank: targetRank.name,
          cost: targetRank.cost,
          newCommissionBalance: newCommissionBal,
        },
        severity: 'INFO',
      });

      return {
        newCommissionBal,
        newTotalBal,
        newRank: targetRank.name,
        newRate: targetRank.rate,
        label: targetRank.label,
        deductedCost: targetRank.cost,
      };
    });

    const result = executeUpgrade();

    res.json({
      success: true,
      message: `Félicitations ! Vous avez atteint avec succès le grade ${result.newRank} ! 🎉`,
      newRank: result.newRank,
      newRate: result.newRate,
      deductedCost: result.deductedCost,
      newCommissionBalance: result.newCommissionBal,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erreur lors de la montée de grade.' });
  }
});

export default router;
