import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/cron-auth';
import { reconcileStuckJobs, cleanOldJobs } from '@/lib/generation-jobs';
import { logError, logInfo } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET|POST /api/cron/reconcile-jobs — répare les jobs de génération bloqués
 * (lambda tué pendant after()) et nettoie les jobs anciens. À appeler ~toutes les 10 min
 * avec `Authorization: Bearer $CRON_SECRET`.
 */
async function handle(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  try {
    const { failed, locksReleased } = await reconcileStuckJobs();
    await cleanOldJobs();
    if (failed > 0) logInfo('[cron:reconcile-jobs] jobs réconciliés', { failed, locksReleased });
    return NextResponse.json({ ok: true, failed, locksReleased });
  } catch (err) {
    logError('[cron:reconcile-jobs] échec', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
