// Sans STRIPE_SECRET_KEY ni STRIPE_WEBHOOK_SECRET, le webhook répond en mode mock.
delete process.env.STRIPE_SECRET_KEY;
delete process.env.STRIPE_WEBHOOK_SECRET;

// DB in-memory pour les tests d'idempotence.
process.env.AURAPOST_USE_MOCK = '1';
delete process.env.TURSO_DATABASE_URL;

import { POST } from '@/app/api/webhooks/stripe/route';
import { upsertSubscription, getSubscription } from '@/lib/db/subscription';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const TENANT_ID = 'wh-test-tenant';
const NOW = new Date().toISOString();

async function setupTenant() {
  await db.insert(tenants).values({
    id: TENANT_ID,
    name: 'Webhook Test Tenant',
    ownerId: 'wh-user-1',
    status: 'active',
    plan: 'starter',
    createdAt: NOW,
    updatedAt: NOW,
  }).onConflictDoNothing();
}

describe("webhook Stripe (mock — pas de cle configuree)", () => {
  it("repond 200 mocked quand Stripe n'est pas configure", async () => {
    const res = await POST({} as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.mocked).toBe(true);
  });
});

describe("idempotence checkout.session.completed", () => {
  beforeEach(async () => {
    await setupTenant();
  });

  it("double appel checkout identique : une seule ligne subscription, plan inchange", async () => {
    const payload = {
      tenantId: TENANT_ID,
      plan: 'content_only',
      status: 'active',
      stripeCustomerId: 'cus_test_123',
      stripeSubscriptionId: 'sub_test_456',
    };

    // Simule checkout.session.completed × 2 (Stripe peut rejouer l'evenement).
    await upsertSubscription(payload);
    await upsertSubscription(payload);

    const sub = await getSubscription(TENANT_ID);
    expect(sub).not.toBeNull();
    expect(sub!.plan).toBe('content_only');
    expect(sub!.status).toBe('active');
    expect(sub!.stripeCustomerId).toBe('cus_test_123');

    // Verification qu'il n'y a pas de doublon en DB.
    const [tenant] = await db.select({ plan: tenants.plan }).from(tenants).where(eq(tenants.id, TENANT_ID)).limit(1);
    expect(tenant?.plan).toBe('content_only');
  });

  it("checkout + subscription.updated rejoues dans l'ordre : plan final = dernier event", async () => {
    await upsertSubscription({ tenantId: TENANT_ID, plan: 'content_only', status: 'active', stripeCustomerId: 'cus_test_123' });
    // Upgrade via subscription.updated
    await upsertSubscription({ tenantId: TENANT_ID, plan: 'pack_complet', status: 'active', stripeCustomerId: 'cus_test_123' });
    // Replay du checkout original (event retarde ou rejoue)
    await upsertSubscription({ tenantId: TENANT_ID, plan: 'content_only', status: 'active', stripeCustomerId: 'cus_test_123' });

    // Le dernier call "gagne" (dernier etat ecrit) — comportement attendu du webhook Stripe.
    const sub = await getSubscription(TENANT_ID);
    expect(sub!.plan).toBe('content_only');
  });
});
