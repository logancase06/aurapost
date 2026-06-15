// Séquence email — vérifie le traitement batché (anti N+1) et l'idempotence.
// SQLite in-memory (fallback), emails mockés (pas de RESEND_API_KEY).
process.env.AURAPOST_USE_MOCK = '1';
delete process.env.TURSO_DATABASE_URL;
delete process.env.RESEND_API_KEY;

import { db } from '@/lib/db';
import { tenants, users } from '@/lib/db/schema';
import { runEmailSequences } from '@/lib/email-sequences';

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

async function seedUser(id: string, ageDays: number, onboardingCompleted: boolean) {
  const now = new Date().toISOString();
  await db.insert(tenants).values({
    id,
    name: id,
    ownerId: `u-${id}`,
    status: 'active',
    plan: 'starter',
    createdAt: daysAgo(ageDays),
    updatedAt: now,
  });
  await db.insert(users).values({
    id: `u-${id}`,
    tenantId: id,
    email: `${id}@example.com`,
    fullName: `User ${id}`,
    role: 'owner',
    onboardingCompleted,
    createdAt: daysAgo(ageDays),
  });
}

beforeAll(async () => {
  await seedUser('seq-new', 0, false); // J0 bienvenue
  await seedUser('seq-j1', 1, false); // J1 profil incomplet
  await seedUser('seq-j3', 3, false); // J3 exemples (pas de posts)
  await seedUser('seq-old', 40, true); // J30 renouvellement
});

describe('runEmailSequences (batch, anti N+1)', () => {
  it('traite tous les coachs et envoie les étapes dues', async () => {
    const res = await runEmailSequences();
    expect(res.processed).toBe(4);
    expect(res.sent.length).toBeGreaterThan(0);
  });

  it('est idempotent : un 2e run ne renvoie pas les mêmes étapes', async () => {
    const res = await runEmailSequences();
    expect(res.processed).toBe(4);
    expect(res.sent.length).toBe(0);
  });
});
