import db from '../db/database.js';

export const createNotification = (userId, title, message, type = 'INFO') => {
  try {
    const notifId = `NOTIF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(notifId, userId, title, message, type);
    return notifId;
  } catch (error) {
    console.error('Erreur création notification:', error);
    return null;
  }
};
