import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/cron-auth';
import { downgradeOverduePayments } from '@/lib/db/payment-grace';
import { logError, logInfo } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET|POST /api/cron/payment-grace — retrograde les tenants dont le paiement a echoue
 * il y a plus de GRACE_PERIOD_DAYS (7j) sans que Stripe n'ait emis subscription.deleted.
 *
 * Filet de securite cote serveur, independant des webhooks Stripe.
 * A appeler 1x/jour avec `Authorization: Bearer $CRON_SECRET`.
 */
async function handle(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  try {
    const result = await downgradeOverduePayments();
    if (result.processed > 0 || result.errors > 0) {
      logInfo('[cron:payment-grace] termine', { processed: result.processed, errors: result.errors });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logError('[cron:payment-grace] echec', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
