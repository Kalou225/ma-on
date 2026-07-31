import express from 'express';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/notifications
router.get('/', (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.user.id);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND read_status = 0
    `).get(req.user.id).count;

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications.' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare(`
      UPDATE notifications SET read_status = 1
      WHERE id = ? AND user_id = ?
    `).run(id, req.user.id);
    res.json({ message: 'Notification marquée comme lue.' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', (req, res) => {
  try {
    db.prepare(`
      UPDATE notifications SET read_status = 1
      WHERE user_id = ?
    `).run(req.user.id);
    res.json({ message: 'Toutes les notifications ont été marquées comme lues.' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
});

export default router;
