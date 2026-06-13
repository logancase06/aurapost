import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { activityLogs } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { isAuthorizedCron } from '@/lib/cron-auth';
import { usersToRemind } from '@/lib/db/onboarding';
import { logActivity } from '@/lib/db/activity';
import { sendEmail, welcomeEmail } from '@/lib/email';
import { logError, logInfo } from '@/lib/logger';

// Relance les utilisateurs ayant abandonné l'onboarding depuis +24h. Déclenché par cron.
export async function POST(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const candidates = await usersToRemind();
  let sent = 0;

  for (const u of candidates) {
    // Déduplication : ne pas relancer deux fois le même utilisateur.
    const [already] = await db
      .select({ id: activityLogs.id })
      .from(activityLogs)
      .where(and(eq(activityLogs.action, 'onboarding_reminder'), eq(activityLogs.targetId, u.id)))
      .limit(1);
    if (already) continue;

    try {
      await sendEmail(
        { email: u.email, name: u.fullName },
        'Il vous reste une étape pour démarrer sur AuraPost ✦',
        welcomeEmail(u.fullName)
      );
      await logActivity(u.tenantId, u.id, 'onboarding_reminder', u.id, {});
      sent++;
    } catch (err) {
      logError('[cron:onboarding-reminder] envoi échoué', { userId: u.id, error: String(err) });
    }
  }

  logInfo('[cron:onboarding-reminder] terminé', { candidates: candidates.length, sent });
  return NextResponse.json({ ok: true, candidates: candidates.length, sent });
}
