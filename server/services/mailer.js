/**
 * Service d'envoi d'e-mails — Nodemailer via SMTP Gmail
 *
 * Variables d'environnement requises :
 *   SMTP_USER   → adresse Gmail expéditrice  (ex: moncompte@gmail.com)
 *   SMTP_PASS   → mot de passe d'application Gmail (pas le mot de passe principal)
 *
 * Variables optionnelles :
 *   SMTP_HOST        → défaut : smtp.gmail.com
 *   SMTP_PORT        → défaut : 587
 *   NOTIFY_EMAIL     → destinataire des notifications (défaut : naharinzu@gmail.com)
 *
 * Comment générer un mot de passe d'application Gmail :
 *   Mon compte Google → Sécurité → Validation en 2 étapes (activer) →
 *   Mots de passe des applications → Générer
 */
import nodemailer from 'nodemailer';

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'naharinzu@gmail.com';

function createTransport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('[mailer] SMTP_USER ou SMTP_PASS non configuré — notifications e-mail désactivées.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false, // STARTTLS
    auth: { user, pass },
  });
}

/**
 * Envoie une notification de connexion.
 * @param {object} params
 * @param {string} params.fullName   Nom complet de l'utilisateur
 * @param {string} params.username   Identifiant
 * @param {string} params.roleLabel  Rôle affiché
 * @param {string} params.ip         Adresse IP du client
 */
export async function sendLoginNotification({ fullName, username, roleLabel, ip }) {
  const transport = createTransport();
  if (!transport) return; // SMTP non configuré → silencieux

  const now = new Date().toLocaleString('fr-FR', {
    timeZone: 'Indian/Antananarivo',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      <div style="background:#4f46e5;padding:20px 24px">
        <h2 style="color:white;margin:0;font-size:18px">🔔 Connexion détectée — Collège Sully</h2>
      </div>
      <div style="padding:24px;background:#f8fafc">
        <p style="margin:0 0 16px;color:#374151;font-size:14px">
          Un utilisateur vient de se connecter à l'application de gestion scolaire.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="padding:8px 12px;background:#fff;border:1px solid #e5e7eb;font-weight:600;color:#6b7280;width:40%">Nom</td>
            <td style="padding:8px 12px;background:#fff;border:1px solid #e5e7eb;color:#111827">${fullName}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;color:#6b7280">Identifiant</td>
            <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;color:#111827">${username}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;background:#fff;border:1px solid #e5e7eb;font-weight:600;color:#6b7280">Rôle</td>
            <td style="padding:8px 12px;background:#fff;border:1px solid #e5e7eb;color:#111827">${roleLabel}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;color:#6b7280">Date / heure</td>
            <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;color:#111827">${now}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;background:#fff;border:1px solid #e5e7eb;font-weight:600;color:#6b7280">Adresse IP</td>
            <td style="padding:8px 12px;background:#fff;border:1px solid #e5e7eb;color:#111827">${ip}</td>
          </tr>
        </table>
        <p style="margin:16px 0 0;color:#9ca3af;font-size:12px">
          Cet e-mail est envoyé automatiquement par le système de gestion du Collège Sully.
          Si vous ne reconnaissez pas cette connexion, vérifiez les comptes utilisateurs.
        </p>
      </div>
    </div>
  `;

  try {
    await transport.sendMail({
      from: `"Collège Sully 🏫" <${process.env.SMTP_USER}>`,
      to: NOTIFY_EMAIL,
      subject: `🔔 Connexion : ${fullName} (${roleLabel}) — ${now}`,
      html,
    });
    console.log(`[mailer] Notification envoyée à ${NOTIFY_EMAIL} pour la connexion de ${username}`);
  } catch (err) {
    // Ne jamais bloquer la connexion à cause d'un échec e-mail
    console.error('[mailer] Échec envoi notification:', err.message);
  }
}
