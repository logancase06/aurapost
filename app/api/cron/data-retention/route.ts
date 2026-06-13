import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { activityLogs } from '@/lib/db/schema';
import { isAuthorizedCron } from '@/lib/cron-auth';
import { logError, logInfo } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const RETENTION_DAYS = 90;

/**
 * GET|POST /api/cron/data-retention — purge des logs d'activité de plus de 90 jours.
 * À planifier 1×/jour. `Authorization: Bearer $CRON_SECRET`.
 */
async function handle(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  try {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await db.delete(activityLogs).where(lt(activityLogs.createdAt, cutoff));
    logInfo('[cron:data-retention] purge effectuée', { cutoff });
    return NextResponse.json({ ok: true, cutoff, retentionDays: RETENTION_DAYS });
  } catch (err) {
    logError('[cron:data-retention] échec', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
