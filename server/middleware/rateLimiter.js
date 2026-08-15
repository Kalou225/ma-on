import rateLimit from 'express-rate-limit';
import { logSecurityEvent } from '../services/auditLogger.js';

// General API Rate Limiter (Max 1000 requests / 15 min to accommodate regular polling and high activity)
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Trop de requêtes envoyées depuis cette adresse IP. Veuillez réessayer dans quelques minutes.',
  },
});

// Rate Limiter for Authentication endpoints (Max 60 attempts / 15 min, skips successful requests)
export const strictAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('BRUTE_FORCE_PREVENTION_TRIGGERED', {
      ip: req.ip,
      details: { path: req.originalUrl, email: req.body?.email },
      severity: 'WARNING',
    });
    res.status(429).json({
      error: 'Trop de tentatives de connexion échouées. Veuillez patienter quelques instants avant de réessayer.',
    });
  },
});
