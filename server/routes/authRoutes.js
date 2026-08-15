import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db, { checkpointDb, saveUserToStore, syncStoreToDb } from '../db/database.js';
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

// Helper to generate access & refresh tokens (30 days continuous access)
const issueTokens = (res, userId, role) => {
  const accessToken = jwt.sign({ userId, role }, config.jwtAccessSecret, {
    expiresIn: config.accessTokenExpiry,
  });

  const refreshToken = jwt.sign({ userId, role }, config.jwtRefreshSecret, {
    expiresIn: `${config.refreshTokenExpiryDays}d`,
  });

  // Store Access & Refresh Tokens in Secure HttpOnly SameSite Cookies (30 days)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
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

// Helper for resilient user lookup by Email, Phone (all formats/country codes) or Referral Code
const findUserByIdentifier = (identifier) => {
  if (!identifier) return null;
  const rawId = identifier.trim();
  const cleanEmail = rawId.toLowerCase();
  const digitsOnly = rawId.replace(/\D/g, '');
  const local10 = digitsOnly.startsWith('225') ? digitsOnly.slice(3) : digitsOnly;
  const with225 = digitsOnly.startsWith('225') ? digitsOnly : '225' + digitsOnly;
  const withPlus225 = '+' + with225;

  const queryUser = () => {
    if (cleanEmail.includes('@')) {
      return db.prepare('SELECT * FROM users WHERE LOWER(TRIM(email)) = ?').get(cleanEmail);
    }
    return db.prepare(`
      SELECT * FROM users 
      WHERE LOWER(TRIM(email)) = ? 
         OR UPPER(TRIM(my_referral_code)) = UPPER(TRIM(?))
         OR phone = ? 
         OR phone = ? 
         OR phone = ? 
         OR phone = ? 
         OR REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') = ?
         OR REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') = ?
         OR REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') = ?
         OR REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') = ?
    `).get(
      cleanEmail,
      rawId,
      rawId,
      withPlus225,
      local10,
      digitsOnly,
      digitsOnly,
      local10,
      with225,
      withPlus225
    );
  };

  let user = queryUser();
  if (!user) {
    syncStoreToDb();
    user = queryUser();
  }
  return user;
};

// 0b. SEND OTP FOR PASSWORD RECOVERY (FORGOT PASSWORD)
router.post('/forgot-password/send-otp', strictAuthRateLimiter, validateRequest(forgotPasswordSendOtpSchema), async (req, res) => {
  const { identifier, phone, email, channel } = req.validated.body;
  const rawId = (identifier || phone || email || '').trim();
  const hostOrigin = req.headers.host || 'ma-on.onrender.com';

  const user = findUserByIdentifier(rawId);

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

  const user = findUserByIdentifier(rawId);

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

  saveUserToStore({
    id: user.id,
    email: user.email,
    password_hash: passwordHash,
  });
  checkpointDb();

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

// 1. LOGIN (Supports Email OR Phone OR Referral Code)
router.post('/login', strictAuthRateLimiter, validateRequest(loginSchema), (req, res) => {
  const { email: identifier, password, mfaToken } = req.validated.body;
  const rawIdentifier = identifier.trim();

  const user = findUserByIdentifier(rawIdentifier);

  if (!user) {
    logSecurityEvent('LOGIN_FAILED_UNKNOWN_USER', { ip: req.ip, details: { identifier: rawIdentifier }, severity: 'WARNING' });
    return res.status(401).json({ error: 'Identifiants ou mot de passe incorrects. Vérifiez votre email ou numéro.' });
  }

  // Check account lockout
  if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
    logSecurityEvent('LOGIN_BLOCKED_LOCKOUT', { userId: user.id, ip: req.ip, severity: 'WARNING' });
    return res.status(423).json({ error: 'Compte temporairement bloqué suite à des échecs répétés. Veuillez patienter.' });
  }

  // Verify Bcrypt Hash or Sub-Admin Access Code
  let isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch && user.role === 'SUB_ADMIN' && user.sub_admin_access_code) {
    if (password === user.sub_admin_access_code || password === user.sub_admin_access_code.trim()) {
      isMatch = true;
    }
  }

  if (!isMatch) {
    const attempts = (user.failed_attempts || 0) + 1;
    let lockout = null;

    if (attempts >= 5) {
      lockout = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      logSecurityEvent('USER_LOCKOUT_TRIGGERED', { userId: user.id, ip: req.ip, severity: 'HIGH' });
    }

    db.prepare('UPDATE users SET failed_attempts = ?, lockout_until = ? WHERE id = ?').run(attempts, lockout, user.id);
    logSecurityEvent('LOGIN_FAILED_WRONG_PASSWORD', { userId: user.id, ip: req.ip, details: { identifier: rawIdentifier }, severity: 'WARNING' });
    return res.status(401).json({ error: 'Identifiants ou mot de passe incorrects. Vérifiez votre mot de passe.' });
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
  logSecurityEvent('USER_LOGIN_SUCCESS', { userId: user.id, ip: req.ip, details: { email: user.email, role: user.role } });

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

  // Dual-persistence: save to JSON mirror store and force WAL checkpoint
  saveUserToStore({
    id: userId,
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    password_hash: passwordHash,
    role: 'MEMBRE',
    status: 'INACTIF',
    rank: 'Apprenti',
    balance: 0,
    activation_balance: 0,
    commission_balance: 0,
    network_earnings: 0,
    my_referral_code: referralCode,
    sponsor_code: cleanSponsor,
  });
  checkpointDb();

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
  const user = db.prepare(`
    SELECT id, name, email, phone, role, status, rank, balance, 
           activation_balance, commission_balance, last_withdrawal_date, 
           network_earnings, my_referral_code, sponsor_code, mfa_enabled, 
           avatar_url, default_payment_provider, default_payment_number, 
           default_payment_holder, preferred_otp_channel, created_at 
    FROM users WHERE id = ?
  `).get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  const actBal = user.activation_balance || 0;
  const commBal = user.commission_balance || 0;

  // Compter le nombre de filleuls directs
  const refCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE sponsor_code = ?').get(user.my_referral_code);

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
      directReferralsCount: refCount ? refCount.count : 0,
      mfaEnabled: Boolean(user.mfa_enabled),
      avatarUrl: user.avatar_url,
      defaultPaymentProvider: user.default_payment_provider || 'Orange Money',
      defaultPaymentNumber: user.default_payment_number || user.phone,
      defaultPaymentHolder: user.default_payment_holder || user.name,
      preferredOtpChannel: user.preferred_otp_channel || 'EMAIL',
      createdAt: user.created_at,
    },
  });
});

// 3c. UPDATE PROFILE INFO
router.put('/profile', authenticateToken, (req, res) => {
  const {
    name,
    phone,
    defaultPaymentProvider,
    defaultPaymentNumber,
    defaultPaymentHolder,
    preferredOtpChannel,
  } = req.body;

  if (name && name.trim().length < 2) {
    return res.status(400).json({ error: 'Le nom doit comporter au moins 2 caractères.' });
  }

  const cleanName = name ? name.trim() : undefined;
  const cleanPhone = phone ? phone.trim() : undefined;

  db.prepare(`
    UPDATE users SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      default_payment_provider = COALESCE(?, default_payment_provider),
      default_payment_number = COALESCE(?, default_payment_number),
      default_payment_holder = COALESCE(?, default_payment_holder),
      preferred_otp_channel = COALESCE(?, preferred_otp_channel)
    WHERE id = ?
  `).run(
    cleanName,
    cleanPhone,
    defaultPaymentProvider,
    defaultPaymentNumber,
    defaultPaymentHolder,
    preferredOtpChannel,
    req.user.id
  );

  saveUserToStore({
    id: req.user.id,
    name: cleanName,
    phone: cleanPhone,
    default_payment_provider: defaultPaymentProvider,
    default_payment_number: defaultPaymentNumber,
    default_payment_holder: defaultPaymentHolder,
    preferred_otp_channel: preferredOtpChannel,
  });
  checkpointDb();

  logSecurityEvent('USER_PROFILE_UPDATED', { userId: req.user.id, ip: req.ip });

  res.json({
    message: 'Paramètres du compte mis à jour avec succès !',
    updated: {
      name: cleanName,
      phone: cleanPhone,
      defaultPaymentProvider,
      defaultPaymentNumber,
      defaultPaymentHolder,
      preferredOtpChannel,
    },
  });
});

// 3d. CHANGE PASSWORD
router.put('/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Tous les champs sont requis.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit comporter au moins 8 caractères.' });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ error: 'La confirmation du mot de passe ne correspond pas.' });
  }

  const user = db.prepare('SELECT id, password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé.' });
  }

  const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!isMatch) {
    logSecurityEvent('PASSWORD_CHANGE_FAILED', { userId: req.user.id, ip: req.ip, severity: 'WARNING' });
    return res.status(400).json({ error: 'Le mot de passe actuel est incorrect.' });
  }

  const newHash = bcrypt.hashSync(newPassword, config.saltRounds);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

  saveUserToStore({
    id: req.user.id,
    password_hash: newHash,
  });
  checkpointDb();

  logSecurityEvent('PASSWORD_CHANGE_SUCCESS', { userId: req.user.id, ip: req.ip, severity: 'HIGH' });

  res.json({ message: 'Votre mot de passe a été modifié avec succès !' });
});

// 3e. UPDATE AVATAR
router.post('/update-avatar', authenticateToken, (req, res) => {
  const { avatarUrl } = req.body;
  if (!avatarUrl) {
    return res.status(400).json({ error: 'Image requise.' });
  }

  db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, req.user.id);

  saveUserToStore({
    id: req.user.id,
    avatar_url: avatarUrl,
  });
  checkpointDb();

  logSecurityEvent('AVATAR_UPDATED', { userId: req.user.id, ip: req.ip });

  res.json({ message: 'Photo de profil enregistrée définitivement.', avatarUrl });
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
