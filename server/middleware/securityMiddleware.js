import helmet from 'helmet';
import cors from 'cors';
import { config } from '../config/security.js';

export const configureSecurityHeaders = (app) => {
  // 1. Helmet Security Headers (CSP, HSTS, Frameguard, XSS Filter)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", '*', ...config.allowedOrigins],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Essential for serving static CSS/JS files
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  // 2. Flexible CORS Configuration (supports same-origin, Render deployments & local testing)
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow same-origin / direct static file requests (origin is undefined)
        if (!origin) return callback(null, true);

        const isLocalNetwork = (
          origin.startsWith('http://localhost') ||
          origin.startsWith('http://127.0.0.1') ||
          origin.startsWith('http://10.') ||
          origin.startsWith('http://192.168.')
        );
        const isRender = origin.endsWith('.onrender.com');

        if (config.nodeEnv === 'production' || isRender || isLocalNetwork || config.allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );
};
