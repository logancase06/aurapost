import { and, eq, sql } from 'drizzle-orm';
import { db } from './db';
import { users, generatedPosts, activityLogs } from './db/schema';
import { shell, button, escHtml, sendEmail, sendMarketingEmail } from './email';
import { getUnsubscribeUrl } from './unsubscribe';
import { logActivity } from './db/activity';
import { logError, logInfo } from './logger';

// ─────────────────────────────────────────────────────────────────────────────
// Séquence d'onboarding par email (J+0 → J+30). Déclenchée par un cron quotidien
// (/api/cron/email-sequences). Chaque envoi est journalisé dans activity_logs
// (action `email_seq_J{n}`) pour ne jamais envoyer deux fois le même email.
//
// J+0  bienvenue (envoyé à l'inscription, cf. route register) — inclus ici pour complétude.
// J+1  profil incomplet → « Votre premier contenu vous attend »
// J+3  aucun post généré → « 3 exemples de posts pour un coach comme vous »
// J+7  posts générés → « Vos 12 posts sont prêts — comment les publier »
// J+30 renouvellement → « Votre contenu du mois est prêt à générer »
// ─────────────────────────────────────────────────────────────────────────────

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';

// ── Builders HTML (premium, mobile-first via le shell partagé) ───────────────

export function seqWelcomeHtml(name: string): string {
  return shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b">Bienvenue ${escHtml(name)} ✦</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
        Ravi de t'accueillir ! La première étape prend 2 minutes : décris ton activité de coach,
        et AuraPost génère ton premier mois de contenu Instagram &amp; LinkedIn.
      </p>
      ${button(`${APP_URL()}/onboarding`, 'Compléter mon profil →')}
    </td></tr>`);
}

export function seqProfileIncompleteHtml(name: string, unsubscribeUrl?: string): string {
  return shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b">Ton premier contenu t'attend, ${escHtml(name)}</h1>
      <p style="margin:0 0 16px;color:#6b7280;font-size:15px;line-height:1.6">
        Tu y es presque ! Il ne manque que ton profil de coach pour qu'AuraPost se mette au travail.
        Spécialité, ville, ton de voix : c'est tout ce qu'il faut.
      </p>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
        Dans 2 minutes, tu auras 12 posts prêts à relire. Promis.
      </p>
      ${button(`${APP_URL()}/onboarding`, 'Terminer mon profil →')}
    </td></tr>`, unsubscribeUrl);
}

export function seqExamplesHtml(name: string, unsubscribeUrl?: string): string {
  const example = (theme: string, text: string) => `
    <div style="background:#f5f3ff;border-left:3px solid #7c3aed;border-radius:8px;padding:14px 16px;margin:0 0 12px">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#7c3aed">${escHtml(theme)}</p>
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.5">${escHtml(text)}</p>
    </div>`;
  return shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b">3 exemples pour un coach comme toi, ${escHtml(name)}</h1>
      <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6">
        Voici à quoi ressemble le contenu qu'AuraPost génère. Imagine ça, calibré sur TON profil :
      </p>
      ${example('Conseil du jour', '🔥 La régularité bat l\'intensité. 3 séances tenues valent mieux qu\'une séance parfaite. Quel est ton objectif cette semaine ?')}
      ${example('Motivation', '💪 Ton seul adversaire, c\'est le toi d\'hier. Concentre-toi sur ton prochain pas, pas sur celui des autres.')}
      ${example('Expertise (LinkedIn)', 'Le mental précède toujours le physique. Les clients qui progressent ne sont pas les plus doués — ce sont les plus constants.')}
      <div style="margin-top:8px">${button(`${APP_URL()}/dashboard`, 'Générer les miens →')}</div>
    </td></tr>`, unsubscribeUrl);
}

export function seqPostsReadyHtml(name: string, unsubscribeUrl?: string): string {
  return shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b">Tes 12 posts sont prêts ✦</h1>
      <p style="margin:0 0 16px;color:#6b7280;font-size:15px;line-height:1.6">
        Bravo ${escHtml(name)} ! Ton premier mois de contenu est généré. Voici comment en tirer le maximum :
      </p>
      <ol style="margin:0 0 24px;padding-left:20px;color:#374151;font-size:14px;line-height:1.8">
        <li>Relis et approuve les posts qui te ressemblent (1 clic).</li>
        <li>Demande une variante si un angle ne te plaît pas.</li>
        <li>Programme-les dans le calendrier éditorial, ou copie-les en un clic.</li>
      </ol>
      ${button(`${APP_URL()}/dashboard`, 'Relire mes posts →')}
    </td></tr>`, unsubscribeUrl);
}

export function seqRenewalHtml(name: string, unsubscribeUrl?: string): string {
  return shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b">Un nouveau mois, du nouveau contenu</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
        ${escHtml(name)}, ton contenu du mois est prêt à être généré. Quelques minutes suffisent pour
        garder une présence régulière — et la régularité, c'est ce qui fait grandir une audience.
      </p>
      ${button(`${APP_URL()}/dashboard`, 'Générer mon mois →')}
    </td></tr>`, unsubscribeUrl);
}

// ── Définition de la séquence ────────────────────────────────────────────────

export type SequenceStep = 'J0' | 'J1' | 'J3' | 'J7' | 'J30';

interface StepConfig {
  step: SequenceStep;
  day: number;
  subject: string;
  build: (name: string, unsubscribeUrl?: string) => string;
  /** Condition d'envoi évaluée sur l'état du coach. */
  condition: (s: CoachState) => boolean;
}

interface CoachState {
  onboardingCompleted: boolean;
  hasPosts: boolean;
}

const SEQUENCE: StepConfig[] = [
  { step: 'J0', day: 0, subject: 'Bienvenue sur AuraPost ✦', build: seqWelcomeHtml, condition: () => true },
  { step: 'J1', day: 1, subject: 'Ton premier contenu t’attend', build: seqProfileIncompleteHtml, condition: (s) => !s.onboardingCompleted },
  { step: 'J3', day: 3, subject: '3 exemples de posts pour un coach comme toi', build: seqExamplesHtml, condition: (s) => !s.hasPosts },
  { step: 'J7', day: 7, subject: 'Tes 12 posts sont prêts — voici comment les publier', build: seqPostsReadyHtml, condition: (s) => s.hasPosts },
  { step: 'J30', day: 30, subject: 'Ton contenu du mois est prêt à générer', build: seqRenewalHtml, condition: () => true },
];

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

async function alreadySent(userId: string, step: SequenceStep): Promise<boolean> {
  const rows = await db
    .select({ id: activityLogs.id })
    .from(activityLogs)
    .where(and(eq(activityLogs.userId, userId), eq(activityLogs.action, `email_seq_${step}`)))
    .limit(1);
  return rows.length > 0;
}

export interface SequenceRunResult {
  processed: number;
  sent: { step: SequenceStep; email: string }[];
}

/**
 * Parcourt les coachs et envoie l'email de séquence dû (le plus avancé non encore envoyé
 * dont la condition est remplie). Idempotent via activity_logs. À appeler 1×/jour par cron.
 */
export async function runEmailSequences(): Promise<SequenceRunResult> {
  const result: SequenceRunResult = { processed: 0, sent: [] };

  const coaches = await db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      email: users.email,
      name: users.fullName,
      onboardingCompleted: users.onboardingCompleted,
      createdAt: users.createdAt,
    })
    .from(users)
    .limit(2000);

  for (const c of coaches) {
    result.processed++;
    const age = daysSince(c.createdAt);

    const [{ n } = { n: 0 }] = await db
      .select({ n: sql<number>`count(*)` })
      .from(generatedPosts)
      .where(eq(generatedPosts.tenantId, c.tenantId));
    const state: CoachState = { onboardingCompleted: !!c.onboardingCompleted, hasPosts: Number(n) > 0 };

    // Étape due = la plus avancée dont le jour est atteint, la condition remplie, non encore envoyée.
    const due = [...SEQUENCE].reverse().find((step) => age >= step.day && step.condition(state));
    if (!due) continue;
    if (await alreadySent(c.id, due.step)) continue;

    const firstName = c.name.split(' ')[0] || 'coach';
    // J0 (bienvenue) = transactionnel ; J1/J3/J7/J30 = marketing → garde de désabonnement + lien.
    const isMarketing = due.step !== 'J0';

    try {
      const res = isMarketing
        ? await sendMarketingEmail(c.tenantId, { email: c.email, name: c.name }, due.subject, due.build(firstName, getUnsubscribeUrl(c.tenantId)))
        : await sendEmail({ email: c.email, name: c.name }, due.subject, due.build(firstName));
      // skipped = désabonné : on ne journalise pas comme envoyé → la séquence reprend en cas de réabonnement.
      if ('skipped' in res && res.skipped) continue;
      if (res.success) {
        await logActivity(c.tenantId, c.id, `email_seq_${due.step}`, null, { mocked: res.mocked ?? false });
        result.sent.push({ step: due.step, email: c.email });
      }
    } catch (err) {
      logError('[email-sequences] envoi échoué', { userId: c.id, step: due.step, error: String(err) });
    }
  }

  logInfo('[email-sequences] run terminé', { processed: result.processed, sent: result.sent.length });
  return result;
}
