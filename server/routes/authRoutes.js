import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../db/database.js';
import { config } from '../config/security.js';
import { validateRequest } from '../middleware/validate.js';
import { strictAuthRateLimiter } from '../middleware/rateLimiter.js';
import { logSecurityEvent } from '../services/auditLogger.js';
import { generateMfaSecret, generateQrCodeUrl, verifyMfaToken } from '../services/mfaService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation Schemas (Zod)
const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Adresse email invalide' }),
    password: z.string().min(6, { message: 'Le mot de passe doit comporter au moins 6 caractères' }),
    mfaToken: z.string().optional(),
  }),
});

const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, { message: 'Le nom doit comporter au moins 2 caractères' }),
    email: z.string().email({ message: 'Adresse email invalide' }),
    phone: z.string().min(8, { message: 'Numéro de téléphone invalide' }),
    password: z.string().min(8, { message: 'Mot de passe trop court (min 8 caractères)' }),
    sponsorCode: z.string().optional(),
  }),
});

// Helper to generate access & refresh tokens
const issueTokens = (res, userId, role) => {
  const accessToken = jwt.sign({ userId, role }, config.jwtAccessSecret, {
    expiresIn: config.accessTokenExpiry,
  });

  const refreshToken = jwt.sign({ userId, role }, config.jwtRefreshSecret, {
    expiresIn: `${config.refreshTokenExpiryDays}d`,
  });

  // Store Access & Refresh Tokens in Secure HttpOnly SameSite Cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: config.refreshTokenExpiryDays * 24 * 60 * 60 * 1000,
  });

  return { accessToken, refreshToken };
};

// 1. LOGIN
router.post('/login', strictAuthRateLimiter, validateRequest(loginSchema), (req, res) => {
  const { email, password, mfaToken } = req.validated.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    logSecurityEvent('LOGIN_FAILED_UNKNOWN_USER', { ip: req.ip, details: { email }, severity: 'WARNING' });
    return res.status(401).json({ error: 'Identifiants ou mot de passe incorrects.' });
  }

  // Check account lockout
  if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
    logSecurityEvent('LOGIN_BLOCKED_LOCKOUT', { userId: user.id, ip: req.ip, severity: 'WARNING' });
    return res.status(423).json({ error: 'Compte temporairement bloqué suite à des échecs répétés.' });
  }

  // Verify Bcrypt Hash
  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    const attempts = user.failed_attempts + 1;
    let lockout = null;

    if (attempts >= 5) {
      lockout = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      logSecurityEvent('USER_LOCKOUT_TRIGGERED', { userId: user.id, ip: req.ip, severity: 'HIGH' });
    }

    db.prepare('UPDATE users SET failed_attempts = ?, lockout_until = ? WHERE id = ?').run(attempts, lockout, user.id);
    return res.status(401).json({ error: 'Identifiants ou mot de passe incorrects.' });
  }

  // Check MFA if enabled
  if (user.mfa_enabled) {
    if (!mfaToken || !verifyMfaToken(mfaToken, user.mfa_secret)) {
      return res.status(403).json({ error: 'Code MFA (2FA) invalide ou requis.', requireMfa: true });
    }
  }

  // Reset failed attempts on clean login
  db.prepare('UPDATE users SET failed_attempts = 0, lockout_until = NULL WHERE id = ?').run(user.id);

  const { accessToken } = issueTokens(res, user.id, user.role);
  logSecurityEvent('USER_LOGIN_SUCCESS', { userId: user.id, ip: req.ip });

  res.json({
    message: 'Connexion réussie',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      rank: user.rank,
      balance: user.balance,
      myReferralCode: user.my_referral_code,
      avatarUrl: user.avatar_url,
    },
    accessToken,
  });
});

// 2. SIGNUP
router.post('/signup', validateRequest(signupSchema), (req, res) => {
  const { name, email, phone, password, sponsorCode } = req.validated.body;

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    return res.status(400).json({ error: 'Un compte existe déjà avec cette adresse email.' });
  }

  const userId = `usr-${Math.random().toString(36).substr(2, 9)}`;
  const referralCode = `ILL-${Math.floor(1000 + Math.random() * 9000)}`;
  const passwordHash = bcrypt.hashSync(password, config.saltRounds);

  db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, role, status, rank, balance, my_referral_code, sponsor_code)
    VALUES (?, ?, ?, ?, ?, 'MEMBRE', 'INACTIF', 'Apprenti', 0, ?, ?)
  `).run(userId, name, email, phone, passwordHash, referralCode, sponsorCode || 'ILL-88392');

  const { accessToken } = issueTokens(res, userId, 'MEMBRE');
  logSecurityEvent('USER_REGISTERED', { userId, ip: req.ip });

  res.status(201).json({
    message: 'Compte créé avec succès. Dépôt manuel requis pour activation.',
    user: { id: userId, name, email, phone, role: 'MEMBRE', status: 'INACTIF', rank: 'Apprenti', balance: 0, myReferralCode: referralCode },
    accessToken,
  });
});

// 3. LOGOUT
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Déconnexion réussie' });
});

// 3b. ME (GET CURRENT LOGGED IN USER)
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email, phone, role, status, rank, balance, network_earnings, my_referral_code, sponsor_code, mfa_enabled, avatar_url FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      rank: user.rank,
      balance: user.balance,
      networkEarnings: user.network_earnings,
      myReferralCode: user.my_referral_code,
      sponsorCode: user.sponsor_code,
      mfaEnabled: Boolean(user.mfa_enabled),
      avatarUrl: user.avatar_url,
    },
  });
});

// 3c. UPDATE AVATAR
router.post('/update-avatar', authenticateToken, (req, res) => {
  const { avatarUrl } = req.body;
  if (!avatarUrl) {
    return res.status(400).json({ error: 'Image requise.' });
  }
  db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, req.user.id);
  res.json({ message: 'Photo de profil mise à jour avec succès.', avatarUrl });
});


// 4. MFA SETUP (AUTHENTICATE FIRST)
router.post('/mfa/setup', authenticateToken, async (req, res) => {
  const mfa = generateMfaSecret(req.user.email);
  const qrCodeUrl = await generateQrCodeUrl(mfa.otpauthUrl);

  db.prepare('UPDATE users SET mfa_secret = ? WHERE id = ?').run(mfa.base32Secret, req.user.id);

  res.json({
    secret: mfa.base32Secret,
    qrCodeUrl,
  });
});

// 5. MFA VERIFY & ENABLE
router.post('/mfa/enable', authenticateToken, (req, res) => {
  const { token } = req.body;
  const user = db.prepare('SELECT mfa_secret FROM users WHERE id = ?').get(req.user.id);

  if (!verifyMfaToken(token, user.mfa_secret)) {
    return res.status(400).json({ error: 'Code TOTP invalide.' });
  }

  db.prepare('UPDATE users SET mfa_enabled = 1 WHERE id = ?').run(req.user.id);
  logSecurityEvent('MFA_ENABLED', { userId: req.user.id, ip: req.ip });

  res.json({ message: 'Authentification 2FA activée avec succès !' });
});

export default router;
