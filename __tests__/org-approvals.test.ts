// File de validation MLM + détection d'allégations. SQLite in-memory, mock forcé.
process.env.AURAPOST_USE_MOCK = '1';
delete process.env.TURSO_DATABASE_URL;

import { db } from '@/lib/db';
import { tenants, users, coachProfiles } from '@/lib/db/schema';
import { createOrganization, addTenantToOrg } from '@/lib/db/organizations';
import { runMonthlyGeneration } from '@/lib/db/posts';
import { listPendingApprovals, approvePost, countPendingApprovals } from '@/lib/db/approvals';
import { findForbidden, mergeForbidden } from '@/lib/compliance';

async function seed(id: string) {
  const now = new Date().toISOString();
  await db.insert(tenants).values({ id, name: id, ownerId: `u-${id}`, status: 'active', plan: 'pack_complet', createdAt: now, updatedAt: now });
  await db.insert(users).values({ id: `u-${id}`, tenantId: id, email: `${id}@ex.com`, fullName: `Coach ${id}`, role: 'owner', createdAt: now });
  await db.insert(coachProfiles).values({ id: `p-${id}`, tenantId: id, userId: `u-${id}`, displayName: `Coach ${id}`, speciality: 'Préparation physique', tone: 'motivant', language: 'fr', createdAt: now, updatedAt: now });
}

describe('détection d’allégations (conformité)', () => {
  it('repère les termes interdits, ignore le contenu propre', () => {
    const words = mergeForbidden(['offre spéciale']);
    expect(findForbidden('Gagne des revenus complémentaires', words)).toContain('revenus');
    expect(findForbidden('Programme Hyrox 12 semaines, technique avant volume.', words)).toHaveLength(0);
  });
});

describe('file de validation org', () => {
  let orgId: string;
  beforeAll(async () => {
    await seed('mgr');
    await seed('dist');
    const org = await createOrganization('mgr', 'Réseau Test');
    orgId = org.id;
    await addTenantToOrg(orgId, 'dist', 'member');
    // Génération du distributeur en mode "validation requise".
    await runMonthlyGeneration('dist', 'u-dist', { initialStatus: 'pending_approval' });
  });

  it('les posts du distributeur sont en attente de validation', async () => {
    const pending = await listPendingApprovals(orgId);
    expect(pending.length).toBeGreaterThan(0);
    expect(await countPendingApprovals(orgId)).toBe(pending.length);
  });

  it('le manager peut approuver un post → il sort de la file', async () => {
    const before = await listPendingApprovals(orgId);
    const res = await approvePost(orgId, 'u-mgr', before[0].id);
    expect(res.ok).toBe(true);
    const after = await listPendingApprovals(orgId);
    expect(after.length).toBe(before.length - 1);
  });
});
