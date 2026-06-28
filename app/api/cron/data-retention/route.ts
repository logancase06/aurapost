import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { activityLogs, siteVisits, magicTokens } from '@/lib/db/schema';
import { isAuthorizedCron } from '@/lib/cron-auth';
import { logError, logInfo } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const LOGS_RETENTION_DAYS = 90;
// CNIL délibération 2020-091 art. 5 — exemption audience measurement :
// durée de conservation maximale recommandée = 13 mois.
const VISITS_RETENTION_DAYS = 395;

/**
 * GET|POST /api/cron/data-retention — purge RGPD des données à durée limitée.
 * - Logs d'activité : 90 jours.
 * - Visites du site vitrine (siteVisits) : 13 mois (CNIL).
 * - Magic tokens expirés : supprimés dès expiration (utilisés ou non).
 * À planifier 1×/jour. `Authorization: Bearer $CRON_SECRET`.
 */
async function handle(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  try {
    const now = new Date();
    const logsCutoff = new Date(Date.now() - LOGS_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const visitsCutoff = new Date(Date.now() - VISITS_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const tokensCutoff = now.toISOString();

    await Promise.all([
      db.delete(activityLogs).where(lt(activityLogs.createdAt, logsCutoff)),
      db.delete(siteVisits).where(lt(siteVisits.visitedAt, visitsCutoff)),
      db.delete(magicTokens).where(lt(magicTokens.expiresAt, tokensCutoff)),
    ]);

    logInfo('[cron:data-retention] purge effectuée', { logsCutoff, visitsCutoff: visitsCutoff.toISOString(), tokensCutoff });
    return NextResponse.json({ ok: true, logsCutoff, visitsCutoff: visitsCutoff.toISOString(), tokensCutoff });
  } catch (err) {
    logError('[cron:data-retention] échec', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
