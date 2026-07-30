import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'ma-on-security-audit' },
  transports: [
    new winston.transports.File({ filename: path.join(__dirname, '../logs/security-audit.log') }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `[${timestamp}] [SECURITY AUDIT] ${level}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ''
          }`;
        })
      ),
    }),
  ],
});

export const logSecurityEvent = (eventType, { userId, ip, details, severity = 'INFO' }) => {
  logger.info({
    event: eventType,
    userId: userId || 'ANONYMOUS',
    ip: ip || 'UNKNOWN',
    severity,
    details: details || {},
  });
};
