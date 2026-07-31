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
          scriptSrc: ["'self'", "'unsafe-inline'"], // Allow local scripts
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", ...config.allowedOrigins],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  // 2. Strict CORS Configuration (support local network IPs for mobile testing)
  app.use(
    cors({
      origin: (origin, callback) => {
        const isLocalNetwork = origin && (
          origin.startsWith('http://localhost') ||
          origin.startsWith('http://127.0.0.1') ||
          origin.startsWith('http://10.') ||
          origin.startsWith('http://192.168.')
        );
        if (!origin || config.allowedOrigins.includes(origin) || isLocalNetwork) {
          callback(null, true);
        } else {
          callback(new Error('Cross-Origin Request Rejeté par la politique CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );
};
