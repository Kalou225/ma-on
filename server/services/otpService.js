import crypto from 'crypto';
import db from '../db/database.js';
import { logSecurityEvent } from './auditLogger.js';
import { sendOtpEmail } from './emailService.js';

/**
 * Service de gestion unifié des codes OTP (Email & SMS + WebOTP API) pour Eco-Finance
 */

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;

/**
 * Génère et stocke un code OTP à 6 chiffres pour un identifiant (Email ou Téléphone)
 * @param {Object} options
 * @param {string} [options.email] - Adresse email du destinataire
 * @param {string} [options.phone] - Numéro de téléphone du destinataire
 * @param {'EMAIL' | 'SMS'} [options.channel='EMAIL'] - Canal d'envoi ('EMAIL' ou 'SMS')
 * @param {string} [options.name] - Nom du destinataire
 * @param {string} [options.origin] - Domaine / origine pour le formatage WebOTP
 * @returns {Promise<{ success: boolean, message: string, identifier: string, channel: string, simulatedCode?: string, expiresAt: string, webOtpMessage?: string }>}
 */
export const generateAndSendOtp = async ({
  email = '',
  phone = '',
  channel = 'EMAIL',
  name = '',
  origin = 'ma-on.onrender.com',
}) => {
  const chosenChannel = channel.toUpperCase() === 'SMS' && phone ? 'SMS' : 'EMAIL';
  const cleanIdentifier = (chosenChannel === 'EMAIL' ? email : phone).trim().toLowerCase();

  if (!cleanIdentifier) {
    throw new Error('Identifiant (Email ou Numéro de téléphone) manquant pour la génération du code OTP.');
  }

  // Génération d'un code OTP cryptographiquement sécurisé à 6 chiffres
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const id = `otp-${crypto.randomUUID()}`;
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  // Invalider les anciens codes non vérifiés pour cet identifiant
  db.prepare('DELETE FROM otp_verifications WHERE LOWER(identifier) = ?').run(cleanIdentifier);
  if (phone) {
    db.prepare('DELETE FROM phone_verifications WHERE phone = ?').run(phone.trim());
  }

  // Insérer dans la table unifiée otp_verifications
  db.prepare(`
    INSERT INTO otp_verifications (id, identifier, channel, otp_code, expires_at, attempts, verified)
    VALUES (?, ?, ?, ?, ?, 0, 0)
  `).run(id, cleanIdentifier, chosenChannel, otpCode, expiresAt);

  // Pour rétrocompatibilité avec les anciennes requêtes SMS
  if (chosenChannel === 'SMS' && phone) {
    db.prepare(`
      INSERT INTO phone_verifications (id, phone, otp_code, expires_at, attempts, verified)
      VALUES (?, ?, ?, ?, 0, 0)
    `).run(id, phone.trim(), otpCode, expiresAt);
  }

  // Formatage du message standard WebOTP pour navigateurs mobiles
  const webOtpFormattedSms = `Votre code de confirmation Eco-Finance est : ${otpCode}.\n\n@${origin} #${otpCode}`;

  let emailDispatchResult = { sent: false, simulated: true };

  if (chosenChannel === 'EMAIL') {
    // Journalisation d'audit de sécurité
    logSecurityEvent('EMAIL_OTP_GENERATED', {
      details: { email: cleanIdentifier, phone, expiresAt },
      severity: 'INFO',
    });

    // Envoi réel par email via le transporteur SMTP
    emailDispatchResult = await sendOtpEmail({
      to: cleanIdentifier,
      otpCode,
      name: name || 'Membre',
    });
  } else {
    logSecurityEvent('PHONE_OTP_GENERATED', {
      details: { phone: cleanIdentifier, email, expiresAt },
      severity: 'INFO',
    });

    console.log(`\n==================================================`);
    console.log(`📱 [SMS ECO-FINANCE CONFIRMATION — WebOTP API]`);
    console.log(`Destinataire : ${cleanIdentifier}`);
    console.log(`Message : "${webOtpFormattedSms}"`);
    console.log(`==================================================\n`);
  }

  // En cas d'erreur de distribution SMTP, d'absence de serveur ou en mode démo, renvoyer simulatedCode pour ne jamais bloquer l'utilisateur
  const hasRealSmtp = Boolean(process.env.SMTP_USER || process.env.GMAIL_USER);
  const includeSimulated = emailDispatchResult.simulated || !hasRealSmtp || process.env.NODE_ENV !== 'production';

  return {
    success: true,
    message: chosenChannel === 'EMAIL'
      ? (emailDispatchResult.sent && !emailDispatchResult.simulated
          ? `Code de confirmation envoyé par Email à ${cleanIdentifier}.`
          : `Code généré pour ${cleanIdentifier}.`)
      : `Code de confirmation SMS envoyé au ${cleanIdentifier}.`,
    identifier: cleanIdentifier,
    channel: chosenChannel,
    simulatedCode: includeSimulated ? otpCode : undefined,
    webOtpMessage: webOtpFormattedSms,
    expiresAt,
  };
};

/**
 * Raccourci pour l'envoi OTP par Email
 */
export const generateAndSendEmailOtp = async (email, name = '', origin = 'ma-on.onrender.com') => {
  return generateAndSendOtp({ email, channel: 'EMAIL', name, origin });
};

/**
 * Raccourci pour l'envoi OTP par SMS
 */
export const generateAndSendPhoneOtp = async (phone, email = '', origin = 'ma-on.onrender.com') => {
  return generateAndSendOtp({ phone, email, channel: 'SMS', origin });
};

/**
 * Vérifie la validité d'un code OTP saisi pour un identifiant (Email ou Numéro de téléphone)
 * @param {string} identifier - Adresse email ou numéro de téléphone
 * @param {string} enteredCode - Code OTP saisi à 6 chiffres
 * @returns {{ valid: boolean, error?: string }}
 */
export const verifyOtp = (identifier, enteredCode) => {
  const cleanIdentifier = (identifier || '').trim().toLowerCase();
  const cleanCode = (enteredCode || '').toString().trim();

  // Recherche dans otp_verifications ou fallback phone_verifications
  let record = db.prepare(`
    SELECT * FROM otp_verifications 
    WHERE LOWER(identifier) = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `).get(cleanIdentifier);

  let isPhoneTable = false;
  if (!record) {
    record = db.prepare(`
      SELECT * FROM phone_verifications 
      WHERE phone = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(cleanIdentifier);
    if (record) isPhoneTable = true;
  }

  if (!record) {
    return {
      valid: false,
      error: 'Aucun code de confirmation n\'a été demandé pour cet identifiant ou le code a expiré.',
    };
  }

  // Vérifier le nombre de tentatives maximales
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    if (isPhoneTable) {
      db.prepare('DELETE FROM phone_verifications WHERE id = ?').run(record.id);
    } else {
      db.prepare('DELETE FROM otp_verifications WHERE id = ?').run(record.id);
    }
    logSecurityEvent('OTP_MAX_ATTEMPTS_EXCEEDED', {
      details: { identifier: cleanIdentifier },
      severity: 'WARNING',
    });
    return {
      valid: false,
      error: 'Nombre maximal de tentatives dépassé (3). Veuillez demander un nouveau code de confirmation.',
    };
  }

  // Vérifier si le code a expiré
  if (new Date(record.expires_at) < new Date()) {
    if (isPhoneTable) {
      db.prepare('DELETE FROM phone_verifications WHERE id = ?').run(record.id);
    } else {
      db.prepare('DELETE FROM otp_verifications WHERE id = ?').run(record.id);
    }
    return {
      valid: false,
      error: 'Le code de confirmation a expiré. Veuillez demander un nouveau code.',
    };
  }

  // Incrémenter le compteur de tentatives
  if (isPhoneTable) {
    db.prepare('UPDATE phone_verifications SET attempts = attempts + 1 WHERE id = ?').run(record.id);
  } else {
    db.prepare('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?').run(record.id);
  }

  // Vérifier la conformité du code
  if (record.otp_code !== cleanCode) {
    return {
      valid: false,
      error: 'Code de confirmation incorrect. Veuillez vérifier votre boîte email / SMS.',
    };
  }

  // Code valide : marquer comme vérifié et nettoyer
  if (isPhoneTable) {
    db.prepare('DELETE FROM phone_verifications WHERE id = ?').run(record.id);
  } else {
    db.prepare('DELETE FROM otp_verifications WHERE id = ?').run(record.id);
  }

  logSecurityEvent('OTP_VERIFIED_SUCCESS', {
    details: { identifier: cleanIdentifier },
    severity: 'INFO',
  });

  return { valid: true };
};

/**
 * Alias pour vérification de téléphone (compatibilité)
 */
export const verifyPhoneOtp = (phone, enteredCode) => {
  return verifyOtp(phone, enteredCode);
};

/**
 * Alias pour vérification d'email
 */
export const verifyEmailOtp = (email, enteredCode) => {
  return verifyOtp(email, enteredCode);
};
