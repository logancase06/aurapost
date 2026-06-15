import { logError, logInfo, logEvent } from './logger';
import { isUnsubscribed, getUnsubscribeUrl } from './unsubscribe';

// ─────────────────────────────────────────────────────────────────────────────
// Email transactionnel via Resend. Mock propre si RESEND_API_KEY est absent :
// l'email est journalisé en console et considéré comme « envoyé » (les flux ne cassent pas).
// ─────────────────────────────────────────────────────────────────────────────

const FROM = process.env.RESEND_FROM ?? 'AuraPost <onboarding@aurapost.fr>';

export function isEmailMock(): boolean {
  return !process.env.RESEND_API_KEY;
}

/** Échappe les caractères HTML pour l'interpolation dans les templates. */
export function escHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

/**
 * Garde RGPD/LCEN pour les emails MARKETING : ne pas envoyer si le tenant s'est désabonné.
 * Les emails transactionnels (auth, paiement, posts prêts) appellent `sendEmail` directement.
 */
export async function sendMarketingEmail(
  tenantId: string,
  to: { email: string; name?: string },
  subject: string,
  html: string
): Promise<{ success: boolean; skipped?: boolean; mocked?: boolean; reason?: string }> {
  if (await isUnsubscribed(tenantId)) {
    logEvent('email.suppressed.unsubscribed', tenantId, { email: to.email });
    return { success: true, skipped: true };
  }
  return sendEmail(to, subject, html);
}

/**
 * Envoi bas niveau. Retourne `{ success }`. En mode mock, journalise et renvoie success:true.
 */
export async function sendEmail(
  to: { email: string; name?: string },
  subject: string,
  html: string
): Promise<{ success: boolean; mocked?: boolean; reason?: string }> {
  if (isEmailMock()) {
    logInfo('[email:mock] email simulé', { to: to.email, subject });
    return { success: true, mocked: true };
  }
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM,
      to: [to.email],
      subject,
      html,
    });
    if (error) {
      logError('[email] Resend error', { to: to.email, error: String(error) });
      return { success: false, reason: String(error) };
    }
    return { success: true };
  } catch (err) {
    logError('[email] échec envoi', { to: to.email, error: String(err) });
    return { success: false, reason: String(err) };
  }
}

// ── Templates HTML ───────────────────────────────────────────────────────────

/**
 * Coque HTML partagée. `unsubscribeUrl` (emails marketing uniquement) ajoute la mention
 * légale de désabonnement (RGPD/LCEN). Les emails transactionnels l'omettent.
 */
export function shell(inner: string, unsubscribeUrl?: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';
  const unsub = unsubscribeUrl
    ? `<p style="margin:10px 0 0;color:#9ca3af;font-size:11px;line-height:1.5">
        Tu reçois cet email car tu as un compte AuraPost.
        <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline">Se désabonner</a> de ces emails.
      </p>`
    : '';
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:Inter,system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(124,58,237,0.12)">
      <tr><td style="background:linear-gradient(135deg,#7c3aed,#db2777);padding:32px;text-align:center">
        <span style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px">✦ AuraPost</span>
        <p style="margin:8px 0 0;color:#f5d0fe;font-size:13px">Le contenu social de votre coaching, en pilote automatique</p>
      </td></tr>
      ${inner}
      <tr><td style="padding:20px 32px;border-top:1px solid #ede9fe;text-align:center">
        <p style="margin:0;color:#a78bfa;font-size:12px">AuraPost · contact@aurapost.fr · <a href="${appUrl}" style="color:#7c3aed;text-decoration:none">${appUrl}</a></p>
        ${unsub}
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export function button(href: string, label: string): string {
  return `<div style="text-align:center;margin-top:8px">
    <a href="${href}" style="display:inline-block;padding:14px 32px;background:#7c3aed;color:#fff;font-size:15px;font-weight:600;border-radius:10px;text-decoration:none">${label}</a>
  </div>`;
}

export function welcomeEmail(name: string, ctaUrl?: string, locale: 'fr' | 'en' = 'fr'): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';
  const href = ctaUrl ?? `${appUrl}/onboarding`;
  const t =
    locale === 'en'
      ? {
          title: `Welcome, ${escHtml(name)} ✦`,
          body: 'Your AuraPost account is ready. Set up your coach profile and generate your first month of Instagram &amp; LinkedIn content in seconds.',
          cta: 'Set up my profile →',
        }
      : {
          title: `Bienvenue, ${escHtml(name)} ✦`,
          body: 'Votre compte AuraPost est créé. Configurez votre profil de coach et générez votre premier mois de contenu Instagram &amp; LinkedIn en quelques secondes.',
          cta: 'Configurer mon profil →',
        };
  return shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b">${t.title}</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">${t.body}</p>
      ${button(href, t.cta)}
    </td></tr>`);
}

export function magicLinkHtml(name: string, link: string): string {
  return shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1e1b4b">Votre lien de connexion</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
        Bonjour ${escHtml(name)}, cliquez ci-dessous pour vous connecter à AuraPost. Ce lien expire dans 1 heure.
      </p>
      ${button(link, 'Me connecter →')}
    </td></tr>`);
}

export function verifyEmailHtml(name: string, verifyUrl: string): string {
  return shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1e1b4b">Vérifiez votre adresse email</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
        Bonjour ${escHtml(name)}, confirmez votre adresse pour activer toutes les fonctionnalités d'AuraPost. Ce lien expire dans 48 heures.
      </p>
      ${button(verifyUrl, 'Vérifier mon email →')}
    </td></tr>`);
}

export function monthlyPostsHtml(name: string, count: number, month: string, ctaUrl: string): string {
  return shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b">Vos ${count} posts du mois sont prêts ✦</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
        Bonjour ${escHtml(name)}, votre contenu pour <strong>${escHtml(month)}</strong> vient d'être généré :
        8 posts Instagram et 4 posts LinkedIn vous attendent. Relisez, approuvez et publiez !
      </p>
      ${button(ctaUrl, 'Voir mes posts →')}
    </td></tr>`);
}

export function websiteActivatedHtml(name: string, url: string): string {
  return shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b">Votre site est en ligne 🌐</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
        Bonjour ${escHtml(name)}, votre site vitrine personnalisé est désormais actif. Partagez-le avec vos clients !
      </p>
      ${button(url, 'Voir mon site →')}
    </td></tr>`);
}

// ── Envois haut niveau (utilisés par les flux applicatifs) ───────────────────

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';

export function sendWelcomeEmail(to: { email: string; name: string }) {
  return sendEmail(to, 'Bienvenue sur AuraPost ✦', welcomeEmail(to.name));
}

export function sendMonthlyPostsEmail(to: { email: string; name: string }, count: number, month: string) {
  return sendEmail(to, `Vos ${count} posts du mois sont prêts ✦`, monthlyPostsHtml(to.name, count, month, `${APP_URL()}/dashboard`));
}

export function sendWebsiteActivatedEmail(to: { email: string; name: string }, siteUrl: string) {
  return sendEmail(to, 'Votre site AuraPost est en ligne 🌐', websiteActivatedHtml(to.name, siteUrl));
}

export function referralJoinedHtml(name: string, refereeName: string): string {
  return shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b">Quelqu'un a rejoint AuraPost grâce à vous ! ✦</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
        Bonjour ${escHtml(name)}, <strong>${escHtml(refereeName)}</strong> vient de s'inscrire avec votre lien de parrainage.
        <strong>1 mois gratuit</strong> a été crédité sur votre compte — et sur le sien. Merci de faire grandir la communauté !
      </p>
      ${button(`${APP_URL()}/dashboard/referral`, 'Voir mes parrainages →')}
    </td></tr>`);
}

export function sendReferralJoinedEmail(to: { email: string; name: string }, refereeName: string) {
  return sendEmail(to, 'Quelqu’un a rejoint AuraPost grâce à vous ✦', referralJoinedHtml(to.name, refereeName));
}

// ── Cycle de vie facturation ─────────────────────────────────────────────────

export function sendPostsReadyEmail(to: { email: string; name: string }, count: number, month: string) {
  return sendEmail(to, `Tes ${count} posts de ${month} sont prêts ✨`, monthlyPostsHtml(to.name, count, month, `${APP_URL()}/dashboard`));
}

export function sendPaymentFailedEmail(to: { email: string; name: string }, graceDays: number) {
  const html = shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1e1b4b">⚠️ Problème de paiement</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
        Bonjour ${escHtml(to.name)}, ton dernier paiement n'a pas pu être effectué. Mets à jour ta carte sous
        <strong>${graceDays} jours</strong> pour conserver l'accès à ton espace.
      </p>
      ${button(`${APP_URL()}/dashboard/billing`, 'Mettre à jour ma carte →')}
    </td></tr>`);
  return sendEmail(to, '⚠️ Problème de paiement — action requise', html);
}

export function sendPaymentSucceededEmail(to: { email: string; name: string }) {
  const html = shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1e1b4b">Paiement confirmé ✓</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
        Bonjour ${escHtml(to.name)}, ton paiement est passé — tout est bon, ton accès est pleinement actif.
      </p>
      ${button(`${APP_URL()}/dashboard`, 'Accéder à mon espace →')}
    </td></tr>`);
  return sendEmail(to, 'Paiement confirmé ✓ — tout est bon', html);
}

export function sendCancellationEmail(to: { email: string; name: string }) {
  const html = shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1e1b4b">Ton abonnement est annulé</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
        Bonjour ${escHtml(to.name)}, ton abonnement AuraPost a bien été annulé. Tes données restent conservées
        <strong>30 jours</strong> — tu peux te réabonner à tout moment et tout retrouver.
      </p>
      ${button(`${APP_URL()}/dashboard/billing`, 'Me réabonner →')}
    </td></tr>`);
  return sendEmail(to, 'Ton abonnement AuraPost est annulé', html);
}

// Email MARKETING (relance mensuelle) → garde de désabonnement + lien dans le pied.
export function sendMonthlyReminderEmail(tenantId: string, to: { email: string; name: string }, month: string) {
  const html = shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b">${escHtml(month)} est là 📅</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
        Bonjour ${escHtml(to.name)}, un nouveau mois commence — tes 12 posts t'attendent.
        Pense à mettre à jour ton profil si tu as de nouveaux résultats clients, puis génère ton contenu.
      </p>
      ${button(`${APP_URL()}/dashboard`, 'Générer mes posts →')}
    </td></tr>`, getUnsubscribeUrl(tenantId));
  return sendMarketingEmail(tenantId, to, `${to.name.split(' ')[0] || 'Coach'}, tes posts de ${month} t'attendent 📅`, html);
}

export function sendTrialEndingEmail(to: { email: string; name: string }, daysLeft: number) {
  const html = shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1e1b4b">Ton essai se termine dans ${daysLeft} jours</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
        Bonjour ${escHtml(to.name)}, ton essai gratuit touche à sa fin. Continue avec AuraPost pour garder ton contenu
        et ton site — tes données sont conservées dans tous les cas.
      </p>
      ${button(`${APP_URL()}/dashboard/billing`, 'Continuer avec AuraPost →')}
    </td></tr>`);
  return sendEmail(to, `Ton essai se termine dans ${daysLeft} jours`, html);
}

/** Message du formulaire de contact d'un site coach → envoyé au coach. */
export function sendContactEmail(
  to: { email: string; name: string },
  from: { name: string; email: string; message: string }
) {
  const html = shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1e1b4b">Nouveau message depuis votre site ✦</h1>
      <p style="margin:0 0 16px;color:#6b7280;font-size:15px">
        <strong>${escHtml(from.name)}</strong> (${escHtml(from.email)}) vous a écrit :
      </p>
      <div style="background:#f5f3ff;border-radius:10px;padding:16px;color:#374151;font-size:14px;line-height:1.6;white-space:pre-line">${escHtml(from.message)}</div>
    </td></tr>`);
  return sendEmail(to, `Nouveau message de ${from.name} — AuraPost`, html);
}
