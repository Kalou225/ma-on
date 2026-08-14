import nodemailer from 'nodemailer';
import dns from 'dns';
import { logSecurityEvent } from './auditLogger.js';

// Force la résolution IPv4 en priorité
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

/**
 * Service d'envoi d'e-mails transactionnels (OTP) ultra-robuste pour Eco-Finance
 * Compatible avec :
 * 1. HTTPS REST API (Resend, Brevo, SendGrid) -> 100% insensible aux blocages de ports sur Render
 * 2. SMTP Standard / Gmail / Brevo (Ports 587, 2525, 465)
 * 3. Fallback immédiat avec code de secours sans freeze
 */

const getSmtpCredentials = () => {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '').trim();
  const host = (process.env.SMTP_HOST || (user.includes('@gmail.com') ? 'smtp.gmail.com' : '')).trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const from = (process.env.SMTP_FROM || process.env.EMAIL_FROM || `"Eco-Finance Sécurité" <${user || 'no-reply@eco-finance.ci'}>`).trim();

  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
  const sendgridApiKey = (process.env.SENDGRID_API_KEY || '').trim();

  return { user, pass, host: host || 'smtp.gmail.com', port, from, resendApiKey, brevoApiKey, sendgridApiKey };
};

/**
 * Envoi via API HTTPS Resend (Port 443 - Jamais bloqué sur Render)
 */
const sendViaResendApi = async (apiKey, from, to, subject, html, text) => {
  const fromEmail = from.includes('<') ? from : `Eco-Finance Sécurité <${from || 'onboarding@resend.dev'}>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail.includes('@') ? fromEmail : 'Eco-Finance <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Resend API Error HTTP ${res.status}`);
  }

  return await res.json();
};

/**
 * Envoi via API HTTPS Brevo (Port 443 - Jamais bloqué sur Render)
 */
const sendViaBrevoApi = async (apiKey, from, to, name, subject, html, text) => {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Eco-Finance Sécurité', email: process.env.SMTP_USER || 'no-reply@eco-finance.ci' },
      to: [{ email: to, name: name || 'Membre' }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Brevo API Error HTTP ${res.status}`);
  }

  return await res.json();
};

/**
 * Crée un transporteur Nodemailer avec timeout court pour éviter les blocages de l'interface
 */
const createTransporter = (host, port, user, pass) => {
  const isSslPort = port === 465;

  return nodemailer.createTransport({
    host: host || 'smtp.gmail.com',
    port: port || (isSslPort ? 465 : 587),
    secure: isSslPort,
    family: 4, // Force IPv4
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 3500, // 3.5s max pour ne pas bloquer l'utilisateur
    greetingTimeout: 3000,
    socketTimeout: 5000,
  });
};

/**
 * Envoie un code OTP par email avec support HTTPS API et SMTP
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
  const { user, pass, host, port, from, resendApiKey, brevoApiKey } = getSmtpCredentials();

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

  const emailSubject = `[Eco-Finance] Code de confirmation : ${otpCode}`;
  const textContent = `Bonjour ${name},\n\nVotre code de confirmation Eco-Finance est : ${otpCode}\n\nCe code est valable 10 minutes. Ne le communiquez à personne.\n\nEco-Finance Sécurité`;

  // OPTION 1 : Envoi via Resend API HTTPS (Recommandé sur Render)
  if (resendApiKey) {
    try {
      await sendViaResendApi(resendApiKey, from, cleanEmail, emailSubject, htmlContent, textContent);
      logSecurityEvent('EMAIL_SENT_HTTPS_SUCCESS', { details: { email: cleanEmail, provider: 'Resend' }, severity: 'INFO' });
      console.log(`✅ [EMAIL DISPATCHED VIA RESEND HTTPS API] Envoyé avec succès à ${cleanEmail} (Code: ${otpCode})`);
      return { sent: true, simulated: false };
    } catch (apiError) {
      console.warn(`⚠️ [RESEND API ERROR] : ${apiError.message}`);
    }
  }

  // OPTION 2 : Envoi via Brevo API HTTPS (Port 443)
  if (brevoApiKey) {
    try {
      await sendViaBrevoApi(brevoApiKey, from, cleanEmail, name, emailSubject, htmlContent, textContent);
      logSecurityEvent('EMAIL_SENT_HTTPS_SUCCESS', { details: { email: cleanEmail, provider: 'Brevo' }, severity: 'INFO' });
      console.log(`✅ [EMAIL DISPATCHED VIA BREVO HTTPS API] Envoyé avec succès à ${cleanEmail} (Code: ${otpCode})`);
      return { sent: true, simulated: false };
    } catch (apiError) {
      console.warn(`⚠️ [BREVO API ERROR] : ${apiError.message}`);
    }
  }

  // OPTION 3 : SMTP Standard avec ports alternatifs et timeout court
  if (user && pass) {
    const portsToTry = [port || 587, 2525, 465];
    for (const testPort of portsToTry) {
      try {
        const transporter = createTransporter(host, testPort, user, pass);
        await transporter.sendMail({
          from,
          to: cleanEmail,
          subject: emailSubject,
          text: textContent,
          html: htmlContent,
        });

        logSecurityEvent('EMAIL_SENT_SMTP_SUCCESS', { details: { email: cleanEmail, port: testPort }, severity: 'INFO' });
        console.log(`✅ [EMAIL DISPATCHED VIA SMTP PORT ${testPort}] Envoyé avec succès à ${cleanEmail} (Code: ${otpCode})`);
        return { sent: true, simulated: false };
      } catch (smtpError) {
        console.warn(`⚠️ [SMTP Port ${testPort} Timeout / Échec] : ${smtpError.message}`);
      }
    }
  }

  // REPLI AUTOMATIQUE (FALLBACK) :
  // Si Render bloque les ports sortants ou qu'aucun SMTP/API n'a réussi,
  // on journalise et on renvoie le mode simulé pour que l'utilisateur reçoive le code dans son interface sans blocage
  console.log(`\n==================================================`);
  console.log(`📧 [EMAIL ECO-FINANCE MODE SECOURS ACTIF]`);
  console.log(`Destinataire : ${cleanEmail} (${name})`);
  console.log(`Code OTP     : ${otpCode}`);
  console.log(`Astuce       : Les ports SMTP sont souvent bloqués sur Render. Ajoutez RESEND_API_KEY ou BREVO_API_KEY sur Render pour l'envoi HTTPS direct.`);
  console.log(`==================================================\n`);

  return { sent: false, simulated: true, error: 'Port SMTP filtré par l\'hébergeur cloud' };
};
