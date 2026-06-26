// Verifie que upsertSubscription maintient tenants.plan et subscriptions.plan
// toujours en coherence - source de verite : tenants.plan (lu par le JWT).
process.env.AURAPOST_USE_MOCK = '1';
delete process.env.TURSO_DATABASE_URL;

import { db } from '@/lib/db';
import { tenants, subscriptions } from '@/lib/db/schema';
import { upsertSubscription } from '@/lib/db/subscription';
import { eq } from 'drizzle-orm';

const NOW = new Date().toISOString();
const T1 = 'sync-test-tenant-1';
const T2 = 'sync-test-tenant-2';

async function seedTenant(id: string) {
  await db.insert(tenants).values({
    id,
    name: `Tenant ${id}`,
    ownerId: `u-${id}`,
    status: 'active',
    plan: 'starter',
    createdAt: NOW,
    updatedAt: NOW,
  });
}

async function getTenantPlan(id: string): Promise<string | null> {
  const [row] = await db.select({ plan: tenants.plan }).from(tenants).where(eq(tenants.id, id)).limit(1);
  return row?.plan ?? null;
}

async function getSubscriptionRow(id: string) {
  const [row] = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, id)).limit(1);
  return row ?? null;
}

beforeAll(async () => {
  await seedTenant(T1);
  await seedTenant(T2);
});

describe("upsertSubscription - synchronisation tenants.plan", () => {
  it("creation : renseigne subscriptions ET met a jour tenants.plan", async () => {
    await upsertSubscription({ tenantId: T1, plan: 'content_only', status: 'active' });

    const sub = await getSubscriptionRow(T1);
    expect(sub).not.toBeNull();
    expect(sub?.plan).toBe('content_only');
    expect(sub?.status).toBe('active');

    const tenantPlan = await getTenantPlan(T1);
    expect(tenantPlan).toBe('content_only');
  });

  it("upgrade : les deux tables passent au nouveau plan", async () => {
    await upsertSubscription({ tenantId: T1, plan: 'pack_complet', status: 'active' });

    const sub = await getSubscriptionRow(T1);
    expect(sub?.plan).toBe('pack_complet');
    expect(await getTenantPlan(T1)).toBe('pack_complet');
  });

  it("downgrade : les deux tables reviennent au plan inferieur", async () => {
    await upsertSubscription({ tenantId: T1, plan: 'content_only', status: 'active' });

    expect(await getTenantPlan(T1)).toBe('content_only');
    const sub = await getSubscriptionRow(T1);
    expect(sub?.plan).toBe('content_only');
  });

  it("annulation : tenants.plan retombe a starter quand status = canceled", async () => {
    await upsertSubscription({ tenantId: T1, plan: 'starter', status: 'canceled' });

    expect(await getTenantPlan(T1)).toBe('starter');
  });

  it("past_due : garde le plan actif (periode de grace)", async () => {
    await upsertSubscription({ tenantId: T2, plan: 'pack_complet', status: 'active' });
    await upsertSubscription({ tenantId: T2, plan: 'pack_complet', status: 'past_due' });

    // past_due = dans la periode de grace -> acces maintenu.
    expect(await getTenantPlan(T2)).toBe('pack_complet');
  });

  it("trialing : le plan est actif pendant l'essai", async () => {
    await upsertSubscription({ tenantId: T2, plan: 'content_only', status: 'trialing' });
    expect(await getTenantPlan(T2)).toBe('content_only');
  });

  it("isolation : la mise a jour d'un tenant ne touche pas l'autre", async () => {
    await upsertSubscription({ tenantId: T1, plan: 'pack_complet', status: 'active' });
    const t2Plan = await getTenantPlan(T2);
    // T2 etait reste sur content_only (trialing) - T1 ne doit pas l'avoir modifie.
    expect(t2Plan).toBe('content_only');
  });

  it("idempotence : un double appel identique laisse la DB dans le meme etat", async () => {
    await upsertSubscription({ tenantId: T1, plan: 'content_only', status: 'active' });
    await upsertSubscription({ tenantId: T1, plan: 'content_only', status: 'active' });

    const subs = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, T1));
    expect(subs).toHaveLength(1); // pas de doublon
    expect(await getTenantPlan(T1)).toBe('content_only');
  });
});
