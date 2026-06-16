import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/cron-auth';
import { runDistributorActivation } from '@/lib/distributor-activation';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET|POST /api/cron/distributor-activation — relance d'activation des distributeurs réseau.
 * À appeler 1×/jour avec `Authorization: Bearer $CRON_SECRET`.
 */
async function handle(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  try {
    const result = await runDistributorActivation();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logError('[cron:distributor-activation] échec', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
