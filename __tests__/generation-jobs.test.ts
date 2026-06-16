// Jobs de génération asynchrone. SQLite in-memory, génération mockée (déterministe).
process.env.AURAPOST_USE_MOCK = '1';
delete process.env.TURSO_DATABASE_URL;

import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { tenants, users, coachProfiles, generationJobs } from '@/lib/db/schema';
import { createGenerationJob, runGenerationJob, getJob, reconcileStuckJobs } from '@/lib/generation-jobs';

async function seed(id: string) {
  const now = new Date().toISOString();
  await db.insert(tenants).values({ id, name: id, ownerId: `u-${id}`, status: 'active', plan: 'pack_complet', createdAt: now, updatedAt: now });
  await db.insert(users).values({ id: `u-${id}`, tenantId: id, email: `${id}@ex.com`, fullName: `Coach ${id}`, role: 'owner', createdAt: now });
  await db.insert(coachProfiles).values({ id: `p-${id}`, tenantId: id, userId: `u-${id}`, displayName: `Coach ${id}`, speciality: 'Préparation physique', tone: 'motivant', language: 'fr', createdAt: now, updatedAt: now });
}

describe('generation-jobs', () => {
  beforeAll(async () => {
    await seed('job-a');
    await seed('job-b');
  });

  it('crée un job avec status pending', async () => {
    const id = await createGenerationJob('job-a', 12);
    const job = await getJob(id, 'job-a');
    expect(job?.status).toBe('pending');
    expect(job?.progress).toBe(0);
  });

  it('exécute le job → done + 12 posts + progress = total', async () => {
    const id = await createGenerationJob('job-a', 12);
    await runGenerationJob(id, 'job-a', 'u-job-a', { maxPosts: 12 });
    const job = await getJob(id, 'job-a');
    expect(job?.status).toBe('done');
    expect(job?.posts.length).toBe(12);
    expect(job?.progress).toBe(12);
  });

  it('respecte la limite du plan gratuit (4 posts Instagram)', async () => {
    const id = await createGenerationJob('job-b', 4);
    await runGenerationJob(id, 'job-b', 'u-job-b', { maxPosts: 4, instagramOnly: true });
    const job = await getJob(id, 'job-b');
    expect(job?.status).toBe('done');
    expect(job?.posts.length).toBe(4);
    expect(job?.posts.every((p) => p.network === 'instagram')).toBe(true);
  });

  it('isole les jobs par tenant', async () => {
    const id = await createGenerationJob('job-a', 12);
    expect(await getJob(id, 'job-b')).toBeNull();
    expect(await getJob(id, 'job-a')).not.toBeNull();
  });
});

describe('reconcileStuckJobs', () => {
  const old = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  const recent = new Date().toISOString();

  beforeAll(async () => {
    const now = new Date().toISOString();
    await db.insert(tenants).values({ id: 'job-stuck', name: 'stuck', ownerId: 'u-x', status: 'active', plan: 'starter', generatingAt: now, createdAt: now, updatedAt: now });
    // Job 'running' bloqué depuis 20 min.
    await db.insert(generationJobs).values({ id: 'gj-stuck', tenantId: 'job-stuck', status: 'running', progress: 3, total: 12, postsGenerated: '[]', startedAt: old, createdAt: old });
    // Job 'running' récent (ne doit pas être touché).
    await db.insert(generationJobs).values({ id: 'gj-recent', tenantId: 'job-a', status: 'running', progress: 1, total: 12, postsGenerated: '[]', startedAt: recent, createdAt: recent });
  });

  it('marque les jobs running > 5 min comme failed et libère le verrou', async () => {
    const res = await reconcileStuckJobs();
    expect(res.failed).toBeGreaterThanOrEqual(1);
    const stuck = await getJob('gj-stuck', 'job-stuck');
    expect(stuck?.status).toBe('failed');
    const [t] = await db.select({ g: tenants.generatingAt }).from(tenants).where(eq(tenants.id, 'job-stuck')).limit(1);
    expect(t.g).toBeNull();
  });

  it('ne touche pas les jobs récents', async () => {
    const recentJob = await getJob('gj-recent', 'job-a');
    expect(recentJob?.status).toBe('running');
  });
});
