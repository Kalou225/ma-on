import express from 'express';
import dns from 'dns';
import cookieParser from 'cookie-parser';

// Force la résolution DNS IPv4 en priorité sur tous les conteneurs cloud (Render.com, AWS, etc.)
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

import { config } from './config/security.js';
import { configureSecurityHeaders } from './middleware/securityMiddleware.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';

import authRoutes from './routes/authRoutes.js';
import depositRoutes from './routes/depositRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';
import networkRoutes from './routes/networkRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { logger } from './services/auditLogger.js';

const app = express();

// Enable Trust Proxy for Render.com and cloud load balancers (so real client IPs are used for rate limiting)
app.set('trust proxy', 1);

// 1. Configure Security Headers (Helmet + CORS)
configureSecurityHeaders(app);

// 2. Body Parser & Cookie Parser (Allow profile photos & transactions receipts)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 3. Global Rate Limiter
app.use('/api', globalRateLimiter);

// 4. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', security: 'OWASP_TOP_10_ENFORCED', timestamp: new Date().toISOString() });
});

// Locate dist/ directory across common deployment paths
const possibleDistPaths = [
  path.join(__dirname, '../dist'),
  path.join(__dirname, 'dist'),
  path.join(process.cwd(), 'dist'),
  path.join(process.cwd(), '../dist'),
];

const distPath = possibleDistPaths.find((p) => fs.existsSync(p));

if (distPath) {
  logger.info(`📦 Frontend React dist/ détecté et actif depuis : ${distPath}`);
  app.use(express.static(distPath));

  // SPA Fallback for client routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  logger.warn('⚠️ Aucun dossier dist/ n\'a été détecté. Le serveur tourne en mode API uniquement.');
  app.use((req, res) => {
    res.status(404).json({ error: 'Ressource introuvable (Dossier dist/ non détecté)' });
  });
}

// Global Error Handler (Sanitizes Error Stack in Production)
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

app.listen(config.port, '0.0.0.0', () => {
  logger.info(`🛡️ Serveur Backend Sécurisé OWASP démarré sur http://0.0.0.0:${config.port}`);
});
