import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/cron-auth';
import { runEmailSequences } from '@/lib/email-sequences';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET|POST /api/cron/email-sequences — déclenche la séquence d'onboarding par email.
 * À appeler 1×/jour (Netlify Scheduled Function / cron externe) avec
 * `Authorization: Bearer $CRON_SECRET`.
 */
async function handle(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  try {
    const result = await runEmailSequences();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logError('[cron:email-sequences] échec', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
