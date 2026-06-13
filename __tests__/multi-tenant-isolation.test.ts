// Isolation multi-tenant — même approche que BlazeCheck : SQLite in-memory (fallback
// automatique quand TURSO_DATABASE_URL est absent), génération en mode mock déterministe.
process.env.AURAPOST_USE_MOCK = '1';
delete process.env.TURSO_DATABASE_URL;

import { db } from '@/lib/db';
import { tenants, users, coachProfiles } from '@/lib/db/schema';
import {
  runMonthlyGeneration,
  listPosts,
  getPostById,
  setPostStatus,
} from '@/lib/db/posts';

async function seedTenant(id: string, email: string) {
  const now = new Date().toISOString();
  await db.insert(tenants).values({
    id,
    name: `Tenant ${id}`,
    ownerId: `u-${id}`,
    status: 'active',
    plan: 'starter',
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(users).values({
    id: `u-${id}`,
    tenantId: id,
    email,
    fullName: `Owner ${id}`,
    role: 'owner',
    createdAt: now,
  });
  await db.insert(coachProfiles).values({
    id: `p-${id}`,
    tenantId: id,
    userId: `u-${id}`,
    displayName: `Coach ${id}`,
    speciality: 'Préparation physique',
    tone: 'motivant',
    language: 'fr',
    createdAt: now,
    updatedAt: now,
  });
}

beforeAll(async () => {
  await seedTenant('A', 'a@example.com');
  await seedTenant('B', 'b@example.com');
  await runMonthlyGeneration('A', 'u-A');
  await runMonthlyGeneration('B', 'u-B');
});

describe('isolation multi-tenant', () => {
  it('chaque tenant génère 12 posts', async () => {
    const a = await listPosts('A');
    const b = await listPosts('B');
    expect(a).toHaveLength(12);
    expect(b).toHaveLength(12);
  });

  it('un tenant ne voit jamais les posts d’un autre', async () => {
    const a = await listPosts('A');
    const b = await listPosts('B');
    const idsA = new Set(a.map((p) => p.id));
    expect(b.some((p) => idsA.has(p.id))).toBe(false);
  });

  it('rate limit : une 2e génération le même mois est refusée', async () => {
    const again = await runMonthlyGeneration('A', 'u-A');
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.error).toBe('already_generated');
  });

  it('une mutation cross-tenant est un no-op (isolation des écritures)', async () => {
    const a = await listPosts('A');
    const target = a[0];
    // Tenant B tente d'approuver un post de A → aucune ligne ne matche (id + tenant_id=B).
    await setPostStatus('B', 'u-B', target.id, 'approved');
    const after = await getPostById('A', target.id);
    expect(after?.status).toBe('draft');
  });

  it('getPostById ne retourne rien pour le mauvais tenant', async () => {
    const a = await listPosts('A');
    const fromB = await getPostById('B', a[0].id);
    expect(fromB).toBeNull();
  });
});
