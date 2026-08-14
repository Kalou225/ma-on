import nodemailer from 'nodemailer';
import dns from 'dns';
import { logSecurityEvent } from './auditLogger.js';

// Forcer la résolution DNS en IPv4 en priorité pour éviter l'erreur ENETUNREACH sur les conteneurs cloud (Render, AWS, etc.)
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

/**
 * Service d'envoi d'e-mails transactionnels (OTP) ultra-robuste pour Eco-Finance
 */

const getSmtpCredentials = () => {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '').trim();
  const host = (process.env.SMTP_HOST || (user.includes('@gmail.com') ? 'smtp.gmail.com' : '')).trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const from = (process.env.SMTP_FROM || `"Eco-Finance Sécurité" <${user || 'no-reply@eco-finance.ci'}>`).trim();

  return { user, pass, host: host || 'smtp.gmail.com', port, from };
};

/**
 * Crée un transporteur Nodemailer avec forcing IPv4 et timeouts adaptés au cloud
 */
const createTransporter = (host, port, user, pass) => {
  const isSslPort = port === 465;

  return nodemailer.createTransport({
    host: host || 'smtp.gmail.com',
    port: port || (isSslPort ? 465 : 587),
    secure: isSslPort, // true pour port 465, false pour port 587 (STARTTLS)
    family: 4, // ⭐ CRITIQUE : Force IPv4 pour éliminer l'erreur ENETUNREACH IPv6 sur Render
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false, // Évite les rejets de certificats dans les proxys cloud
      ciphers: 'SSLv3',
    },
    connectionTimeout: 10000, // 10s
    greetingTimeout: 8000,
    socketTimeout: 15000,
  });
};

/**
 * Envoie un code OTP par email avec template HTML Eco-Finance et gestion de secours
 * @param {Object} options
 * @param {string} options.to - Adresse email du destinataire
 * @param {string} options.otpCode - Code de confirmation à 6 chiffres
 * @param {string} [options.name] - Nom du membre
 * @param {string} [options.subject] - Objet du message
 * @returns {Promise<{ sent: boolean, error?: string, simulated: boolean }>}
 */
export const sendOtpEmail = async ({
  to,
  otpCode,
  name = 'Cher Membre',
  subject = 'Votre code de confirmation Eco-Finance',
}) => {
  const cleanEmail = to.trim().toLowerCase();
  const { user, pass, host, port, from } = getSmtpCredentials();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Code de confirmation Eco-Finance</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0d1012; margin: 0; padding: 20px; color: #e0e3e6; }
        .container { max-width: 500px; margin: 0 auto; background: #141719; border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 20px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { text-align: center; margin-bottom: 25px; }
        .brand { font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #F2CA50; text-transform: uppercase; margin: 0; }
        .subbrand { font-size: 11px; color: #99907c; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
        .greeting { font-size: 15px; color: #ffffff; margin-bottom: 15px; }
        .message { font-size: 13px; color: #d0c5af; line-height: 1.6; margin-bottom: 25px; }
        .otp-box { background: #1a1e21; border: 2px dashed #F2CA50; border-radius: 16px; padding: 20px; text-align: center; margin: 25px 0; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #F2CA50; margin: 0; }
        .otp-label { font-size: 10px; color: #99907c; text-transform: uppercase; margin-top: 8px; letter-spacing: 1px; }
        .warning { background: rgba(230, 57, 70, 0.1); border-left: 3px solid #E63946; padding: 12px; border-radius: 8px; font-size: 11px; color: #d0c5af; margin-bottom: 25px; }
        .footer { text-align: center; font-size: 10px; color: #666; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; margin-top: 25px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="brand">ECO-FINANCE</h1>
          <div class="subbrand">Plateforme Financière & Réseau Privé</div>
        </div>

        <p class="greeting">Bonjour <strong>${name}</strong>,</p>
        <p class="message">
          Vous avez demandé un code de vérification sécurisé pour valider votre compte sur la plateforme Eco-Finance.
        </p>

        <div class="otp-box">
          <div class="otp-code">${otpCode}</div>
          <div class="otp-label">Code valable pendant 10 minutes</div>
        </div>

        <div class="warning">
          <strong>⚠️ Sécurité importante :</strong> Ne communiquez ce code à personne, y compris à un prétendu administrateur d'Eco-Finance.
        </div>

        <div class="footer">
          Ceci est un message automatique sécurisé envoyé par le système Eco-Finance.<br>
          Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `Bonjour ${name},\n\nVotre code de confirmation Eco-Finance est : ${otpCode}\n\nCe code est valable 10 minutes. Ne le communiquez à personne.\n\nEco-Finance Sécurité`;

  // Si des identifiants SMTP sont fournis
  if (user && pass) {
    // 1ère tentative : port configuré ou standard 587 avec IPv4
    try {
      const primaryTransporter = createTransporter(host, port || 587, user, pass);
      await primaryTransporter.sendMail({
        from,
        to: cleanEmail,
        subject: `[Eco-Finance] Code de confirmation : ${otpCode}`,
        text: textContent,
        html: htmlContent,
      });

      logSecurityEvent('EMAIL_SENT_SUCCESS', {
        details: { email: cleanEmail, subject, port: port || 587 },
        severity: 'INFO',
      });

      console.log(`✅ [EMAIL DISPATCHED VIA SMTP IPv4] Envoyé avec succès à ${cleanEmail} (Code: ${otpCode})`);
      return { sent: true, simulated: false };
    } catch (primaryError) {
      console.warn(`⚠️ [SMTP Tentative 1 Échouée (${port || 587})] : ${primaryError.message}. Tentative sur port alternatif 465 (IPv4)...`);

      // 2ème tentative : port alternatif 465 (SSL avec IPv4 forcé)
      try {
        const altTransporter = createTransporter(host, 465, user, pass);
        await altTransporter.sendMail({
          from,
          to: cleanEmail,
          subject: `[Eco-Finance] Code de confirmation : ${otpCode}`,
          text: textContent,
          html: htmlContent,
        });

        logSecurityEvent('EMAIL_SENT_SUCCESS', {
          details: { email: cleanEmail, subject, port: 465 },
          severity: 'INFO',
        });

        console.log(`✅ [EMAIL DISPATCHED VIA SMTP 465 IPv4] Envoyé avec succès à ${cleanEmail} (Code: ${otpCode})`);
        return { sent: true, simulated: false };
      } catch (secondaryError) {
        console.error(`❌ [EMAIL SMTP ERROR DÉFINITIF] Échec de l'envoi à ${cleanEmail} :`, secondaryError.message);
        logSecurityEvent('EMAIL_SENT_FAILURE', {
          details: { email: cleanEmail, error: secondaryError.message },
          severity: 'WARNING',
        });

        return { sent: false, error: secondaryError.message, simulated: true };
      }
    }
  } else {
    // Si aucun SMTP n'est configuré
    console.log(`\n==================================================`);
    console.log(`📧 [EMAIL ECO-FINANCE SIMULATION - SMTP NON CONFIGURÉ]`);
    console.log(`Destinataire : ${cleanEmail} (${name})`);
    console.log(`Code OTP     : ${otpCode}`);
    console.log(`Astuce       : Définissez GMAIL_USER et GMAIL_APP_PASSWORD sur Render pour envoyer de vrais emails.`);
    console.log(`==================================================\n`);
    return { sent: true, simulated: true };
  }
};
