import rateLimit from 'express-rate-limit';
import { logSecurityEvent } from '../services/auditLogger.js';

// General API Rate Limiter (Max 100 requests / 15 min)
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Trop de requêtes envoyées depuis cette adresse IP. Veuillez réespayer dans 15 minutes.',
  },
});

// Strict Rate Limiter for Authentication & Deposit endpoints (Max 5 attempts / 15 min)
export const strictAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('BRUTE_FORCE_PREVENTION_TRIGGERED', {
      ip: req.ip,
      details: { path: req.originalUrl, email: req.body?.email },
      severity: 'WARNING',
    });
    res.status(429).json({
      error: 'Nombre maximal de tentatives de connexion atteint. Compte temporairement verrouillé (15 min).',
    });
  },
});
