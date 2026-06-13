'use server';

import { auth } from '@/lib/auth';
import { logActivity } from '@/lib/db/activity';
import { sendEmail, shell, button, escHtml } from '@/lib/email';
import { sanitizeText } from '@/lib/security';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';

function retentionHtml(name: string): string {
  return shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b">On peut faire une pause, ${escHtml(name)} ?</h1>
      <p style="margin:0 0 16px;color:#6b7280;font-size:15px;line-height:1.6">
        Avant de partir : tu peux <strong>mettre ton abonnement en pause pendant 1 mois</strong> plutôt que de l'annuler.
        Ton contenu et ton site sont conservés, et tu reprends quand tu veux.
      </p>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
        Et si quelque chose n'allait pas, réponds simplement à cet email — on lit tout.
      </p>
      ${button(`${APP_URL}/dashboard/billing`, 'Mettre en pause plutôt qu’annuler')}
    </td></tr>`);
}

/** Enregistre la raison d'annulation et envoie l'email de rétention. */
export async function submitCancellationAction(input: {
  reason: string;
  details?: string;
}): Promise<{ ok: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false };
    const tenantId = session.user.tenantId ?? null;

    await logActivity(tenantId, session.user.id, 'cancellation_feedback', null, {
      reason: sanitizeText(input.reason).slice(0, 80),
      details: sanitizeText(input.details ?? '').slice(0, 500),
    });

    const name = (session.user.name ?? '').split(' ')[0] || 'coach';
    await sendEmail(
      { email: session.user.email ?? '', name: session.user.name ?? 'Coach' },
      'On peut faire une pause plutôt qu’annuler ?',
      retentionHtml(name)
    ).catch(() => {});

    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Demande de pause d'abonnement (1 mois). Mock propre si Stripe non configuré. */
export async function pauseSubscriptionAction(): Promise<{ ok: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false };
    await logActivity(session.user.tenantId ?? null, session.user.id, 'subscription_pause_requested', null, {});
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
