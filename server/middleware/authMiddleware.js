import jwt from 'jsonwebtoken';
import { config } from '../config/security.js';
import db from '../db/database.js';
import { logSecurityEvent } from '../services/auditLogger.js';

export const authenticateToken = (req, res, next) => {
  // Read token from Authorization header or httpOnly cookie
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1] || req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ error: 'Accès non autorisé. Jeton d\'authentification manquant.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtAccessSecret);
    const user = db.prepare('SELECT id, name, email, phone, role, status, rank, balance, my_referral_code FROM users WHERE id = ?').get(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur introuvable ou compte supprimé.' });
    }

    req.user = user;
    next();
  } catch (error) {
    logSecurityEvent('INVALID_TOKEN_ATTEMPT', { ip: req.ip, details: { error: error.message }, severity: 'WARNING' });
    return res.status(403).json({ error: 'Jeton expiré ou invalide.' });
  }
};

export const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    logSecurityEvent('UNAUTHORIZED_ROLE_ACCESS', { userId: req.user?.id, ip: req.ip, details: { requiredRole: role }, severity: 'HIGH' });
    return res.status(403).json({ error: 'Accès refusé. Privilèges d\'administration requis.' });
  }
  next();
};

// Exclusively for Super Administrator (Master Admin)
export const requireMasterAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    logSecurityEvent('UNAUTHORIZED_MASTER_ADMIN_ACCESS', { userId: req.user?.id, ip: req.ip, severity: 'HIGH' });
    return res.status(403).json({ error: 'Accès refusé. Action strictement réservée à l\'Administrateur Général.' });
  }
  next();
};

// For both Super Administrator and Sub-Administrators (Operational management)
export const requireAdminOrSubAdmin = (req, res, next) => {
  if (!req.user || !['ADMIN', 'SUB_ADMIN'].includes(req.user.role)) {
    logSecurityEvent('UNAUTHORIZED_ADMIN_ACCESS', { userId: req.user?.id, ip: req.ip, severity: 'HIGH' });
    return res.status(403).json({ error: 'Accès refusé. Privilèges d\'administration ou sous-administration requis.' });
  }
  next();
};
