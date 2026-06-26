import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { upsertSubscription, findTenantByStripeCustomer } from '@/lib/db/subscription';
import { planIdForPrice } from '@/lib/plans';
import { db } from '@/lib/db';
import { tenants, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendPaymentFailedEmail, sendPaymentSucceededEmail, sendCancellationEmail, sendTrialEndingEmail } from '@/lib/email';
import { logError, logInfo } from '@/lib/logger';
import { GRACE_PERIOD_DAYS as GRACE_DAYS } from '@/lib/constants';

/** Email + nom du propriétaire d'un tenant (fire-and-forget pour les notifications). */
async function owner(tenantId: string): Promise<{ email: string; name: string } | null> {
  const [u] = await db.select({ email: users.email, name: users.fullName }).from(users).where(eq(users.tenantId, tenantId)).limit(1);
  return u ? { email: u.email, name: u.name } : null;
}

// Webhook Stripe. Met à jour la table subscriptions (+ tenants.plan) selon les événements
// checkout.session.completed / customer.subscription.updated / customer.subscription.deleted.
// Mock propre : si Stripe n'est pas configuré, on répond 200 sans rien faire.

/**
 * POST /api/webhooks/stripe — réception des événements Stripe.
 *
 * Sécurité : la requête n'est PAS authentifiée par session (appel serveur→serveur) ;
 * l'authenticité est garantie par la **vérification de signature HMAC**
 * (`stripe.webhooks.constructEvent` avec `STRIPE_WEBHOOK_SECRET`). Toute signature
 * absente/invalide → 400. Le middleware (`proxy.ts`) laisse passer cette route sans JWT.
 *
 * @param req Requête brute (le body est lu en texte pour la vérification de signature).
 * @returns 200 `{ received: true }` si traité (ou mock), 400 si signature invalide.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    logInfo('[stripe:webhook] Stripe non configuré — événement ignoré (mock)', {});
    return NextResponse.json({ received: true, mocked: true });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });

  let event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    logError('[stripe:webhook] signature invalide', { error: String(err) });
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as {
          id: string;
          customer?: string;
          subscription?: string;
          metadata?: { tenantId?: string; plan?: string };
        };
        const tenantId = s.metadata?.tenantId;
        if (tenantId) {
          if (!s.metadata?.plan) {
            logError('[stripe] metadata.plan absente — fallback content_only', { sessionId: s.id, tenantId });
          }
          await upsertSubscription({
            tenantId,
            plan: s.metadata?.plan ?? 'content_only',
            status: 'active',
            stripeCustomerId: s.customer ?? null,
            stripeSubscriptionId: s.subscription ?? null,
          });
        } else {
          logError('[stripe] checkout.session.completed sans tenantId', { sessionId: s.id });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as {
          customer: string;
          status: string;
          current_period_end?: number;
          items?: { data?: { price?: { id?: string } }[] };
        };
        const tenantId = await findTenantByStripeCustomer(sub.customer);
        if (tenantId) {
          const priceId = sub.items?.data?.[0]?.price?.id ?? null;
          await upsertSubscription({
            tenantId,
            plan: planIdForPrice(priceId) ?? 'content_only',
            status: sub.status,
            stripeCustomerId: sub.customer,
            stripePriceId: priceId,
            currentPeriodEnd: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as { customer: string };
        const tenantId = await findTenantByStripeCustomer(sub.customer);
        if (tenantId) {
          await upsertSubscription({ tenantId, plan: 'starter', status: 'canceled', stripeCustomerId: sub.customer });
          const o = await owner(tenantId);
          if (o) await sendCancellationEmail(o);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object as { customer: string };
        const tenantId = await findTenantByStripeCustomer(inv.customer);
        if (tenantId) {
          // Période de grâce : on note l'échec, on garde l'accès et on prévient le coach.
          // Stripe relance automatiquement (Smart Retries). Quand les retries s'épuisent,
          // Stripe émet customer.subscription.deleted → plan='starter'. Filet côté serveur :
          // /api/cron/payment-grace vérifie paymentFailedAt > GRACE_PERIOD_DAYS (1×/jour).
          await db.update(tenants).set({ paymentFailedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).where(eq(tenants.id, tenantId));
          const o = await owner(tenantId);
          if (o) await sendPaymentFailedEmail(o, GRACE_DAYS);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const inv = event.data.object as { customer: string };
        const tenantId = await findTenantByStripeCustomer(inv.customer);
        if (tenantId) {
          // Paiement repassé : on lève la période de grâce.
          await db.update(tenants).set({ paymentFailedAt: null, updatedAt: new Date().toISOString() }).where(eq(tenants.id, tenantId));
          const o = await owner(tenantId);
          if (o) await sendPaymentSucceededEmail(o);
        }
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as { customer: string; trial_end?: number };
        const tenantId = await findTenantByStripeCustomer(sub.customer);
        if (tenantId) {
          const daysLeft = sub.trial_end ? Math.max(1, Math.ceil((sub.trial_end * 1000 - Date.now()) / 86_400_000)) : 3;
          const o = await owner(tenantId);
          if (o) await sendTrialEndingEmail(o, daysLeft);
        }
        break;
      }

      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    logError('[stripe:webhook] traitement échoué', { type: event.type, error: String(err) });
    return NextResponse.json({ error: 'Erreur traitement' }, { status: 500 });
  }
}
