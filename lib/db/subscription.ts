import { db } from './index';
import { subscriptions, tenants } from './schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export interface SubscriptionRow {
  id: string;
  tenantId: string;
  plan: string;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
}

export async function getSubscription(tenantId: string): Promise<SubscriptionRow | null> {
  const [row] = await db
    .select({
      id: subscriptions.id,
      tenantId: subscriptions.tenantId,
      plan: subscriptions.plan,
      status: subscriptions.status,
      stripeCustomerId: subscriptions.stripeCustomerId,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .limit(1);
  return row ?? null;
}

export interface UpsertSubscriptionInput {
  tenantId: string;
  plan: string;
  status: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  currentPeriodEnd?: string | null;
}

/** Crée/met à jour la ligne subscriptions ET synchronise tenants.plan. */
export async function upsertSubscription(input: UpsertSubscriptionInput): Promise<void> {
  const now = new Date().toISOString();
  const existing = await getSubscription(input.tenantId);

  if (existing) {
    await db
      .update(subscriptions)
      .set({
        plan: input.plan,
        status: input.status,
        stripeCustomerId: input.stripeCustomerId ?? existing.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId ?? existing.stripeSubscriptionId,
        stripePriceId: input.stripePriceId ?? undefined,
        currentPeriodEnd: input.currentPeriodEnd ?? existing.currentPeriodEnd,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, existing.id));
  } else {
    await db.insert(subscriptions).values({
      id: nanoid(),
      tenantId: input.tenantId,
      plan: input.plan,
      status: input.status,
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      stripePriceId: input.stripePriceId ?? null,
      currentPeriodEnd: input.currentPeriodEnd ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Synchronise le plan effectif du tenant (source de vérité pour le gating).
  // 'past_due' garde le plan actif pendant la période de grâce (l'expiration réelle
  // se fait via planExpiresAt / la suppression d'abonnement).
  const active = input.status === 'active' || input.status === 'trialing' || input.status === 'past_due';
  await db
    .update(tenants)
    .set({
      plan: active ? input.plan : 'starter',
      planExpiresAt: active ? (input.currentPeriodEnd ?? null) : null,
      stripeCustomerId: input.stripeCustomerId ?? undefined,
      stripeSubscriptionId: input.stripeSubscriptionId ?? undefined,
      updatedAt: now,
    })
    .where(eq(tenants.id, input.tenantId));
}

export async function findTenantByStripeCustomer(customerId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.stripeCustomerId, customerId))
    .limit(1);
  return row?.id ?? null;
}

/** Historique de paiements MOCK (Stripe absent) — pour l'aperçu du dashboard billing. */
export function mockPaymentHistory(): { date: string; amount: string; status: string }[] {
  const now = new Date();
  return [0, 1, 2].map((m) => {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    return {
      date: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      amount: '—',
      status: 'Simulé',
    };
  });
}
