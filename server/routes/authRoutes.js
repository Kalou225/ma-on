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
import { generateAndSendOtp, generateAndSendEmailOtp, generateAndSendPhoneOtp, verifyOtp, verifyPhoneOtp } from '../services/otpService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation Schemas (Zod)
const sendOtpSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Adresse email invalide' }).optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    channel: z.enum(['EMAIL', 'SMS', 'email', 'sms']).optional(),
  }).refine((data) => (data.email && data.email.length > 0) || (data.phone && data.phone.length > 0), {
    message: 'Une adresse email ou un numéro de téléphone est requis pour recevoir le code OTP.',
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().min(3, { message: 'Email ou numéro de téléphone requis' }),
    password: z.string().min(6, { message: 'Le mot de passe doit comporter au moins 6 caractères' }),
    mfaToken: z.string().optional(),
  }),
});

const forgotPasswordSendOtpSchema = z.object({
  body: z.object({
    identifier: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    channel: z.enum(['EMAIL', 'SMS', 'email', 'sms']).optional(),
  }).refine((data) => data.identifier || data.phone || data.email, {
    message: 'Email ou numéro de téléphone requis pour la réinitialisation.',
  }),
});

const forgotPasswordResetSchema = z.object({
  body: z.object({
    identifier: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    otpCode: z.string().min(6, { message: 'Code de confirmation à 6 chiffres requis' }),
    newPassword: z.string().min(8, { message: 'Nouveau mot de passe trop court (min 8 caractères)' }),
    confirmNewPassword: z.string().min(8, { message: 'Confirmation du mot de passe requise' }),
  }).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Les nouveaux mots de passe ne correspondent pas',
    path: ['confirmNewPassword'],
  }),
});

const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, { message: 'Le nom doit comporter au moins 2 caractères' }),
    email: z.string().email({ message: 'Adresse email invalide' }),
    phone: z.string().min(8, { message: 'Numéro de téléphone invalide' }),
    password: z.string().min(8, { message: 'Mot de passe trop court (min 8 caractères)' }),
    confirmPassword: z.string().min(8, { message: 'Confirmation du mot de passe requise (min 8 caractères)' }),
    sponsorCode: z.string().optional(),
    otpCode: z.string().min(6, { message: 'Code de confirmation à 6 chiffres requis' }),
    channel: z.enum(['EMAIL', 'SMS', 'email', 'sms']).optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
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
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: config.refreshTokenExpiryDays * 24 * 60 * 60 * 1000,
  });

  return { accessToken, refreshToken };
};

// 0a. SEND OTP (EMAIL & SMS + WebOTP API) FOR SIGNUP
router.post('/send-otp', strictAuthRateLimiter, validateRequest(sendOtpSchema), async (req, res) => {
  const { phone, email, channel } = req.validated.body;
  const cleanPhone = (phone || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const hostOrigin = req.headers.host || 'ma-on.onrender.com';

  // Check if an existing account already uses this phone number
  if (cleanPhone) {
    const existingPhone = db.prepare('SELECT id FROM users WHERE phone = ? OR phone = ?').get(
      cleanPhone,
      cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`
    );
    if (existingPhone) {
      return res.status(400).json({ error: 'Un compte existe déjà avec ce numéro de téléphone.' });
    }
  }

  // Check if an existing account already uses this email
  if (cleanEmail) {
    const existingEmail = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existingEmail) {
      return res.status(400).json({ error: 'Un compte existe déjà avec cette adresse email.' });
    }
  }

  try {
    const result = await generateAndSendOtp({
      email: cleanEmail,
      phone: cleanPhone,
      channel: channel || (cleanEmail ? 'EMAIL' : 'SMS'),
      origin: hostOrigin,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erreur lors de l\'envoi du code de confirmation.' });
  }
});

// 0b. SEND OTP FOR PASSWORD RECOVERY (FORGOT PASSWORD)
router.post('/forgot-password/send-otp', strictAuthRateLimiter, validateRequest(forgotPasswordSendOtpSchema), async (req, res) => {
  const { identifier, phone, email, channel } = req.validated.body;
  const rawId = (identifier || phone || email || '').trim();
  const cleanEmail = rawId.toLowerCase();
  const hostOrigin = req.headers.host || 'ma-on.onrender.com';

  // Find user by email or phone number
  const user = db.prepare('SELECT id, name, email, phone FROM users WHERE LOWER(email) = ? OR phone = ? OR phone = ?').get(
    cleanEmail,
    rawId,
    rawId.startsWith('+') ? rawId : `+${rawId}`
  );

  if (!user) {
    return res.status(404).json({ error: 'Aucun compte associé à cet email ou numéro de téléphone n\'a été trouvé.' });
  }

  try {
    const chosenChannel = channel || (rawId.includes('@') ? 'EMAIL' : 'SMS');
    const result = await generateAndSendOtp({
      email: user.email,
      phone: user.phone,
      channel: chosenChannel,
      name: user.name,
      origin: hostOrigin,
    });

    res.json({
      success: true,
      message: chosenChannel.toUpperCase() === 'EMAIL'
        ? `Code de récupération envoyé par email à ${user.email}.`
        : `Code de récupération SMS envoyé au ${user.phone}.`,
      identifier: chosenChannel.toUpperCase() === 'EMAIL' ? user.email : user.phone,
      channel: chosenChannel,
      simulatedCode: result.simulatedCode,
      webOtpMessage: result.webOtpMessage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erreur lors de l\'envoi du code de réinitialisation.' });
  }
});

// 0c. RESET PASSWORD VIA OTP VERIFICATION
router.post('/forgot-password/reset', strictAuthRateLimiter, validateRequest(forgotPasswordResetSchema), (req, res) => {
  const { identifier, phone, email, otpCode, newPassword } = req.validated.body;
  const rawId = (identifier || phone || email || '').trim();
  const cleanEmail = rawId.toLowerCase();

  const user = db.prepare('SELECT id, phone, email FROM users WHERE LOWER(email) = ? OR phone = ? OR phone = ?').get(
    cleanEmail,
    rawId,
    rawId.startsWith('+') ? rawId : `+${rawId}`
  );

  if (!user) {
    return res.status(404).json({ error: 'Compte introuvable.' });
  }

  // Verify OTP for user email or phone
  let otpVerification = verifyOtp(user.email, otpCode);
  if (!otpVerification.valid && user.phone) {
    otpVerification = verifyOtp(user.phone, otpCode);
  }

  if (!otpVerification.valid) {
    return res.status(400).json({ error: otpVerification.error || 'Code de confirmation invalide ou expiré.' });
  }

  // Hash new password and update user in database
  const passwordHash = bcrypt.hashSync(newPassword, config.saltRounds);
  db.prepare('UPDATE users SET password_hash = ?, failed_attempts = 0, lockout_until = NULL WHERE id = ?').run(passwordHash, user.id);

  logSecurityEvent('PASSWORD_RESET_SUCCESS', {
    userId: user.id,
    ip: req.ip,
    details: { phone: user.phone, email: user.email },
    severity: 'HIGH',
  });

  res.json({
    message: 'Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
  });
});

// 1. LOGIN (Supports Email OR Phone)
router.post('/login', strictAuthRateLimiter, validateRequest(loginSchema), (req, res) => {
  const { email: identifier, password, mfaToken } = req.validated.body;
  const cleanIdentifier = identifier.trim().toLowerCase();
  const rawIdentifier = identifier.trim();

  // Search by email or phone
  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ? OR phone = ? OR phone = ?').get(
    cleanIdentifier,
    rawIdentifier,
    rawIdentifier.startsWith('+') ? rawIdentifier : `+${rawIdentifier}`
  );

  if (!user) {
    logSecurityEvent('LOGIN_FAILED_UNKNOWN_USER', { ip: req.ip, details: { identifier: rawIdentifier }, severity: 'WARNING' });
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
      balance: user.commission_balance || 0,
      activationBalance: user.activation_balance || 0,
      commissionBalance: user.commission_balance || 0,
      maxWithdrawableAmount: Math.floor((user.activation_balance || 0) / 3),
      lastWithdrawalDate: user.last_withdrawal_date,
      myReferralCode: user.my_referral_code,
      avatarUrl: user.avatar_url,
    },
    accessToken,
  });
});

// 2. SIGNUP
router.post('/signup', validateRequest(signupSchema), (req, res) => {
  const { name, email, phone, password, sponsorCode, otpCode } = req.validated.body;
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();
  const cleanSponsor = sponsorCode ? sponsorCode.trim().toUpperCase() : 'ILL-88392';

  // 1. Verify Email or Phone OTP
  let otpVerification = verifyOtp(cleanEmail, otpCode);
  if (!otpVerification.valid && cleanPhone) {
    otpVerification = verifyOtp(cleanPhone, otpCode);
  }
  if (!otpVerification.valid) {
    return res.status(400).json({ error: otpVerification.error || 'Code de confirmation invalide ou expiré.' });
  }

  // 2. Check for existing email or phone
  const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
  if (existingUser) {
    return res.status(400).json({ error: 'Un compte existe déjà avec cette adresse email.' });
  }

  const existingPhone = db.prepare('SELECT id FROM users WHERE phone = ?').get(cleanPhone);
  if (existingPhone) {
    return res.status(400).json({ error: 'Un compte existe déjà avec ce numéro de téléphone.' });
  }

  const userId = `usr-${Math.random().toString(36).substr(2, 9)}`;
  const referralCode = `ILL-${Math.floor(1000 + Math.random() * 9000)}`;
  const passwordHash = bcrypt.hashSync(password, config.saltRounds);

  db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, role, status, rank, balance, activation_balance, commission_balance, my_referral_code, sponsor_code)
    VALUES (?, ?, ?, ?, ?, 'MEMBRE', 'INACTIF', 'Apprenti', 0, 0, 0, ?, ?)
  `).run(userId, cleanName, cleanEmail, cleanPhone, passwordHash, referralCode, cleanSponsor);

  const { accessToken } = issueTokens(res, userId, 'MEMBRE');
  logSecurityEvent('USER_REGISTERED', { userId, ip: req.ip, details: { phone: cleanPhone, email: cleanEmail } });

  res.status(201).json({
    message: 'Compte créé et vérifié avec succès ! Dépôt manuel requis pour activation.',
    user: {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role: 'MEMBRE',
      status: 'INACTIF',
      rank: 'Apprenti',
      balance: 0,
      activationBalance: 0,
      commissionBalance: 0,
      maxWithdrawableAmount: 0,
      myReferralCode: referralCode,
    },
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
  const user = db.prepare('SELECT id, name, email, phone, role, status, rank, balance, activation_balance, commission_balance, last_withdrawal_date, network_earnings, my_referral_code, sponsor_code, mfa_enabled, avatar_url FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  const actBal = user.activation_balance || 0;
  const commBal = user.commission_balance || 0;

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      rank: user.rank,
      balance: commBal,
      activationBalance: actBal,
      commissionBalance: commBal,
      maxWithdrawableAmount: Math.floor(actBal / 3),
      lastWithdrawalDate: user.last_withdrawal_date,
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
