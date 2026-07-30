import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config/security.js';
import { configureSecurityHeaders } from './middleware/securityMiddleware.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';

import authRoutes from './routes/authRoutes.js';
import depositRoutes from './routes/depositRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';
import networkRoutes from './routes/networkRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { logger } from './services/auditLogger.js';

const app = express();

// 1. Configure Security Headers (Helmet + CORS)
configureSecurityHeaders(app);

// 2. Body Parser & Cookie Parser
app.use(express.json({ limit: '10kb' })); // Anti-DoS body size limit
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 3. Global Rate Limiter
app.use('/api', globalRateLimiter);

// 4. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', security: 'OWASP_TOP_10_ENFORCED', timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ressource introuvable' });
});

// Global Error Handler (Sanitizes Error Stack in Production)
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

app.listen(config.port, () => {
  logger.info(`🛡️ Serveur Backend Sécurisé OWASP démarré sur http://localhost:${config.port}`);
});
