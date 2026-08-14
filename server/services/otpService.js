import crypto from 'crypto';
import db from '../db/database.js';
import { logSecurityEvent } from './auditLogger.js';

/**
 * Service de gestion des codes OTP (SMS) pour Eco-Finance
 */

// Durée de validité du code OTP en minutes (10 minutes)
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;

/**
 * Génère et stocke un code OTP à 6 chiffres pour un numéro de téléphone
 * @param {string} phone - Numéro de téléphone du destinataire
 * @param {string} [email] - Adresse email associée (optionnelle pour le log)
 * @returns {Promise<{ success: boolean, message: string, phone: string, simulatedCode?: string, expiresAt: string }>}
 */
export const generateAndSendPhoneOtp = async (phone, email = '') => {
  const cleanPhone = phone.trim();
  
  // Génération d'un code OTP aléatoire cryptographiquement sûr à 6 chiffres
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const id = `otp-${crypto.randomUUID()}`;
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  // Invalider les anciens codes non vérifiés pour ce même numéro
  db.prepare('DELETE FROM phone_verifications WHERE phone = ?').run(cleanPhone);

  // Insérer le nouveau code OTP
  db.prepare(`
    INSERT INTO phone_verifications (id, phone, otp_code, expires_at, attempts, verified)
    VALUES (?, ?, ?, ?, 0, 0)
  `).run(id, cleanPhone, otpCode, expiresAt);

  // Journalisation d'audit de sécurité
  logSecurityEvent('PHONE_OTP_GENERATED', {
    details: { phone: cleanPhone, email, expiresAt },
    severity: 'INFO',
  });

  console.log(`\n==================================================`);
  console.log(`📱 [SMS ECO-FINANCE SIMULATION]`);
  console.log(`Destinataire : ${cleanPhone}`);
  console.log(`Message : "Votre code de confirmation Eco-Finance est : ${otpCode}. Valable 10 minutes. Ne le partagez avec personne."`);
  console.log(`==================================================\n`);

  return {
    success: true,
    message: `Code de confirmation SMS envoyé avec succès au ${cleanPhone}.`,
    phone: cleanPhone,
    // En environnement de développement/démo, on renvoie le code pour test immédiat
    simulatedCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
    expiresAt,
  };
};

/**
 * Vérifie la validité d'un code OTP saisi par l'utilisateur
 * @param {string} phone - Numéro de téléphone
 * @param {string} enteredCode - Code OTP saisi
 * @returns {{ valid: boolean, error?: string }}
 */
export const verifyPhoneOtp = (phone, enteredCode) => {
  const cleanPhone = phone.trim();
  const cleanCode = (enteredCode || '').toString().trim();

  const record = db.prepare(`
    SELECT * FROM phone_verifications 
    WHERE phone = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `).get(cleanPhone);

  if (!record) {
    return {
      valid: false,
      error: 'Aucun code OTP n\'a été demandé pour ce numéro de téléphone ou le code a expiré.',
    };
  }

  // Vérifier le dépassement du nombre de tentatives maximales
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    db.prepare('DELETE FROM phone_verifications WHERE id = ?').run(record.id);
    logSecurityEvent('OTP_MAX_ATTEMPTS_EXCEEDED', {
      details: { phone: cleanPhone },
      severity: 'WARNING',
    });
    return {
      valid: false,
      error: 'Nombre maximal de tentatives dépassé (3). Veuillez demander un nouveau code SMS.',
    };
  }

  // Vérifier si le code a expiré
  if (new Date(record.expires_at) < new Date()) {
    db.prepare('DELETE FROM phone_verifications WHERE id = ?').run(record.id);
    return {
      valid: false,
      error: 'Le code de confirmation a expiré. Veuillez demander un nouveau code.',
    };
  }

  // Incrémenter les tentatives
  db.prepare('UPDATE phone_verifications SET attempts = attempts + 1 WHERE id = ?').run(record.id);

  // Vérifier la conformité du code
  if (record.otp_code !== cleanCode) {
    return {
      valid: false,
      error: 'Code de confirmation incorrect. Veuillez vérifier le SMS reçu.',
    };
  }

  // Code valide : marquer comme vérifié et nettoyer
  db.prepare('DELETE FROM phone_verifications WHERE id = ?').run(record.id);

  logSecurityEvent('PHONE_OTP_VERIFIED_SUCCESS', {
    details: { phone: cleanPhone },
    severity: 'INFO',
  });

  return { valid: true };
};
