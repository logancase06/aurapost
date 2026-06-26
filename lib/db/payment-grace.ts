import { and, isNotNull, lte, ne } from 'drizzle-orm';
import { db } from './index';
import { tenants, users } from './schema';
import { eq } from 'drizzle-orm';
import { upsertSubscription } from './subscription';
import { GRACE_PERIOD_DAYS } from '@/lib/constants';
import { logInfo, logError } from '@/lib/logger';
import { sendCancellationEmail } from '@/lib/email';
import { notifyAdminFailure } from '@/lib/alerting';

export interface GraceDowngradeResult {
  processed: number;
  errors: number;
}

/**
 * Retrograde vers 'starter' les tenants dont le paiement a echoue il y a plus de
 * GRACE_PERIOD_DAYS jours et qui n'ont pas encore ete retrogrades.
 *
 * Contexte : quand invoice.payment_failed arrive, on stocke paymentFailedAt et on envoie
 * un email. Stripe relance le paiement en automatique (Smart Retries). Si les retries
 * s'epuisent, Stripe emet customer.subscription.deleted => plan='starter'. Ce cron est
 * un filet de securite cote serveur : si ce webhook Stripe est manque, on downgrade
 * de facon autonome apres GRACE_PERIOD_DAYS jours.
 */
export async function downgradeOverduePayments(): Promise<GraceDowngradeResult> {
  const cutoff = new Date(Date.now() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const overdue = await db
    .select({ id: tenants.id, plan: tenants.plan, paymentFailedAt: tenants.paymentFailedAt })
    .from(tenants)
    .where(
      and(
        isNotNull(tenants.paymentFailedAt),
        lte(tenants.paymentFailedAt, cutoff),
        ne(tenants.plan, 'starter'),
      )
    );

  if (overdue.length === 0) return { processed: 0, errors: 0 };

  logInfo('[payment-grace] downgrades a traiter', { count: overdue.length, cutoff });

  let processed = 0;
  let errors = 0;

  for (const tenant of overdue) {
    try {
      // 1. Downgrade plan vers starter + efface paymentFailedAt
      await upsertSubscription({ tenantId: tenant.id, plan: 'starter', status: 'canceled' });
      await db
        .update(tenants)
        .set({ paymentFailedAt: null, updatedAt: new Date().toISOString() })
        .where(eq(tenants.id, tenant.id));

      // 2. Notifie le coach (best-effort)
      const [owner] = await db
        .select({ email: users.email, name: users.fullName })
        .from(users)
        .where(eq(users.tenantId, tenant.id))
        .limit(1);

      if (owner) {
        void sendCancellationEmail(owner).catch((err) =>
          logError('[payment-grace] email echec', { tenantId: tenant.id, error: String(err) })
        );
      }

      logInfo('[payment-grace] downgrade effectue', { tenantId: tenant.id, previousPlan: tenant.plan });
      processed++;
    } catch (err) {
      logError('[payment-grace] erreur traitement', { tenantId: tenant.id, error: String(err) });
      errors++;
    }
  }

  if (errors > 0) {
    void notifyAdminFailure(
      `[payment-grace] ${errors} downgrade(s) en echec sur ${overdue.length} a traiter`,
      { processed, errors }
    );
  }

  return { processed, errors };
}
