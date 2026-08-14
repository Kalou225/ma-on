import nodemailer from 'nodemailer';
import { logSecurityEvent } from './auditLogger.js';

/**
 * Service d'envoi d'e-mails transactionnels (OTP) pour Eco-Finance
 */

// Configuration du transporteur SMTP (Gmail, Brevo, Resend, OVH, SendGrid ou SMTP personnalisé)
let transporter = null;

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;

  if (user && pass) {
    if (process.env.GMAIL_USER || (host && host.includes('gmail.com'))) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
      });
    }

    return nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port: port || 587,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  return null;
};

/**
 * Envoie un code OTP par email avec un template HTML professionnel Eco-Finance
 * @param {Object} options
 * @param {string} options.to - Adresse email du destinataire
 * @param {string} options.otpCode - Code de confirmation à 6 chiffres
 * @param {string} [options.name] - Nom du membre
 * @param {string} [options.subject] - Objet du message
 * @returns {Promise<{ sent: boolean, error?: string, simulated: boolean }>}
 */
export const sendOtpEmail = async ({ to, otpCode, name = 'Cher Membre', subject = 'Votre code de confirmation Eco-Finance' }) => {
  const cleanEmail = to.trim().toLowerCase();
  const fromEmail = process.env.SMTP_FROM || `"Eco-Finance Sécurité" <${process.env.SMTP_USER || 'no-reply@eco-finance.ci'}>`;

  if (!transporter) {
    transporter = createTransporter();
  }

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
          Vous avez demandé un code de vérification sécurisé pour valider votre compte ou votre action sur la plateforme Eco-Finance.
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

  if (transporter) {
    try {
      await transporter.sendMail({
        from: fromEmail,
        to: cleanEmail,
        subject: `[Eco-Finance] Code de confirmation : ${otpCode}`,
        text: textContent,
        html: htmlContent,
      });

      logSecurityEvent('EMAIL_SENT_SUCCESS', {
        details: { email: cleanEmail, subject },
        severity: 'INFO',
      });

      console.log(`✅ [EMAIL DISPATCHED VIA SMTP] Envoyé à ${cleanEmail} avec le code ${otpCode}`);
      return { sent: true, simulated: false };
    } catch (error) {
      console.error(`❌ [EMAIL SMTP ERROR] Échec de l'envoi à ${cleanEmail} :`, error.message);
      logSecurityEvent('EMAIL_SENT_FAILURE', {
        details: { email: cleanEmail, error: error.message },
        severity: 'WARNING',
      });
      return { sent: false, error: error.message, simulated: true };
    }
  } else {
    // Si aucun SMTP n'est encore configuré dans les variables d'environnement sur Render
    console.log(`\n==================================================`);
    console.log(`📧 [EMAIL ECO-FINANCE SIMULATION - SMTP NON CONFIGURÉ]`);
    console.log(`Destinataire : ${cleanEmail} (${name})`);
    console.log(`Code OTP     : ${otpCode}`);
    console.log(`Astuce       : Configurez SMTP_USER et SMTP_PASS sur Render pour envoyer de vrais emails vers Gmail/Outlook.`);
    console.log(`==================================================\n`);
    return { sent: true, simulated: true };
  }
};
