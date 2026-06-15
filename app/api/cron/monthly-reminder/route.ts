import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { coachesToRemindMonthly } from '@/lib/db/onboarding';
import { sendMonthlyReminderEmail } from '@/lib/email';
import { isAuthorizedCron } from '@/lib/cron-auth';
import { currentMonth } from '@/lib/utils';
import { logError, logInfo } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET|POST /api/cron/monthly-reminder — relance les coachs qui n'ont pas généré
 * leur contenu ce mois-ci. À planifier le 1er du mois. `Authorization: Bearer $CRON_SECRET`.
 */
async function handle(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const monthIso = currentMonth();
  const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long' });
  const label = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  try {
    const coaches = await coachesToRemindMonthly(monthIso);
    let sent = 0;
    for (const c of coaches) {
      const res = await sendMonthlyReminderEmail({ email: c.email, name: c.name }, label).catch(() => ({ success: false }));
      if (res.success) sent++;
    }
    logInfo('[cron:monthly-reminder] relances envoyées', { month: monthIso, total: coaches.length, sent });
    return NextResponse.json({ ok: true, month: monthIso, total: coaches.length, sent });
  } catch (err) {
    logError('[cron:monthly-reminder] échec', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
