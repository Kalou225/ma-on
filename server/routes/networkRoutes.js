import express from 'express';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to determine rank dynamically
const calculateRank = (directCount, totalEarnings) => {
  if (directCount >= 30 || totalEarnings >= 2000000) return 'Grand Maître';
  if (directCount >= 15 || totalEarnings >= 500000) return 'Maître';
  if (directCount >= 5 || totalEarnings >= 100000) return 'Compagnon';
  return 'Apprenti';
};

// GET REFERRAL NETWORK TREE (Up to 3 levels)
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

export default router;
