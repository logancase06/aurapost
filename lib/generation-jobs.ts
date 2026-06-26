import { db } from './db';
import { generationJobs, generatedPosts, users, tenants } from './db/schema';
import { and, eq, lt, or, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getProfileInput, type PostStatus } from './db/posts';
import { generateMonthlyContent } from './content-generator';
import { recordGeneration } from './rate-limit';
import { createNotification } from './db/notifications';
import { logActivity } from './db/activity';
import { sendMonthlyPostsEmail } from './email';
import { currentMonth } from './utils';
import { logError, logEvent } from './logger';
import { notifyAdminFailure, notifyJobsReconciled } from './alerting';

// ─────────────────────────────────────────────────────────────────────────────
// Génération asynchrone : un job en base, exécuté en arrière-plan (after()), avec
// progression par post. Résout le timeout serverless (la requête HTTP rend < 500 ms)
// et permet le streaming côté client (polling). Activé par GENERATION_ASYNC=true ;
// sinon le chemin synchrone historique (runMonthlyGeneration) reste utilisé.
// ─────────────────────────────────────────────────────────────────────────────

export type JobStatus = 'pending' | 'running' | 'done' | 'failed';

export interface JobPost {
  id: string;
  network: string;
  title: string | null;
  theme: string | null;
  content: string;
  hashtags: string[];
  status: string;
}

export interface GenerationJob {
  id: string;
  status: JobStatus;
  progress: number;
  total: number;
  posts: JobPost[];
  error: string | null;
  completedAt: string | null;
}

export async function createGenerationJob(tenantId: string, total: number): Promise<string> {
  const id = nanoid();
  await db.insert(generationJobs).values({ id, tenantId, status: 'pending', progress: 0, total, postsGenerated: '[]', createdAt: new Date().toISOString() });
  return id;
}

export async function getJob(jobId: string, tenantId: string): Promise<GenerationJob | null> {
  const [row] = await db
    .select()
    .from(generationJobs)
    .where(and(eq(generationJobs.id, jobId), eq(generationJobs.tenantId, tenantId)))
    .limit(1);
  if (!row) return null;
  let posts: JobPost[] = [];
  try {
    posts = JSON.parse(row.postsGenerated);
  } catch {
    posts = [];
  }
  return { id: row.id, status: row.status as JobStatus, progress: row.progress, total: row.total, posts, error: row.errorMessage, completedAt: row.completedAt };
}

export async function failJob(jobId: string, error: string): Promise<void> {
  await db.update(generationJobs).set({ status: 'failed', errorMessage: error.slice(0, 500), completedAt: new Date().toISOString() }).where(eq(generationJobs.id, jobId));
  void notifyAdminFailure('generation-job-failed', { jobId, error: error.slice(0, 200) });
}

/** Supprime les jobs de plus de 7 jours (nettoyage). */
export async function cleanOldJobs(): Promise<void> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  await db.delete(generationJobs).where(lt(generationJobs.createdAt, cutoff));
}

/**
 * Réconcilie les jobs bloqués (lambda tué pendant after()) : 'running' > 5 min ou
 * 'pending' > 10 min → 'failed', et libère le verrou generating_at des tenants concernés.
 * À appeler par un cron (toutes les ~10 min).
 */
export async function reconcileStuckJobs(): Promise<{ failed: number; locksReleased: number }> {
  const now = Date.now();
  const runningCutoff = new Date(now - 5 * 60 * 1000).toISOString();
  const pendingCutoff = new Date(now - 10 * 60 * 1000).toISOString();

  const stuck = await db
    .select({ id: generationJobs.id, tenantId: generationJobs.tenantId })
    .from(generationJobs)
    .where(
      or(
        and(eq(generationJobs.status, 'running'), lt(generationJobs.startedAt, runningCutoff)),
        and(eq(generationJobs.status, 'pending'), lt(generationJobs.createdAt, pendingCutoff))
      )
    );
  if (stuck.length === 0) return { failed: 0, locksReleased: 0 };

  const completedAt = new Date().toISOString();
  await db
    .update(generationJobs)
    .set({ status: 'failed', errorMessage: 'Job interrompu (lambda arrêté avant la fin).', completedAt })
    .where(inArray(generationJobs.id, stuck.map((s) => s.id)));

  // Libère le verrou generating_at des tenants des jobs échoués (filet anti-blocage).
  const tenantIds = [...new Set(stuck.map((s) => s.tenantId))];
  await db.update(tenants).set({ generatingAt: null }).where(inArray(tenants.id, tenantIds));

  if (stuck.length > 0) {
    void notifyJobsReconciled(stuck.length, tenantIds.length);
  }
  return { failed: stuck.length, locksReleased: tenantIds.length };
}

export interface RunJobOpts {
  maxPosts?: number;
  instagramOnly?: boolean;
  initialStatus?: PostStatus;
}

/**
 * Exécute le job : génère le contenu, insère les posts UN PAR UN (progression streamée),
 * enregistre le garde mensuel + notification + email. Réutilise le générateur existant
 * (un seul appel IA) ; c'est la persistance qui est streamée pour l'effet temps réel.
 */
export async function runGenerationJob(jobId: string, tenantId: string, userId: string, opts: RunJobOpts = {}): Promise<void> {
  await db.update(generationJobs).set({ status: 'running', startedAt: new Date().toISOString() }).where(eq(generationJobs.id, jobId));

  const profile = await getProfileInput(tenantId);
  if (!profile) {
    await failJob(jobId, 'Profil coach introuvable.');
    return;
  }

  const month = currentMonth();
  let gen: Awaited<ReturnType<typeof generateMonthlyContent>>;
  try {
    gen = await generateMonthlyContent(profile, tenantId);
  } catch (err) {
    logError('[gen-job] génération échouée', { tenantId, error: String(err) });
    await failJob(jobId, 'La génération a échoué.');
    return;
  }
  if (gen.mode === 'mock') logEvent('generation.fallback_mock', tenantId, { month });

  let drafts = gen.posts;
  if (opts.instagramOnly) drafts = drafts.filter((d) => d.network === 'instagram');
  if (opts.maxPosts && drafts.length > opts.maxPosts) drafts = drafts.slice(0, opts.maxPosts);

  await db.update(generationJobs).set({ generationMode: gen.mode, total: drafts.length }).where(eq(generationJobs.id, jobId));

  const initialStatus: PostStatus = opts.initialStatus ?? 'draft';
  const now = new Date().toISOString();
  const saved: JobPost[] = [];
  for (const d of drafts) {
    const id = nanoid();
    await db.insert(generatedPosts).values({
      id,
      tenantId,
      network: d.network,
      status: initialStatus,
      title: d.title,
      theme: d.theme,
      content: d.content,
      hashtags: JSON.stringify(d.hashtags),
      callToAction: d.callToAction,
      month,
      variantOfId: null,
      generatedBy: userId,
      generatedMode: gen.mode,
      createdAt: now,
      updatedAt: now,
    });
    saved.push({ id, network: d.network, title: d.title, theme: d.theme, content: d.content, hashtags: d.hashtags, status: initialStatus });
    await db.update(generationJobs).set({ progress: saved.length, postsGenerated: JSON.stringify(saved) }).where(eq(generationJobs.id, jobId));
  }

  await recordGeneration(tenantId, month);
  await logActivity(tenantId, userId, 'content_generated', null, { month, count: saved.length, async: true });
  logEvent('generation.success', tenantId, { month, count: saved.length, mode: gen.mode, async: true });
  await createNotification({ tenantId, userId, type: 'posts_ready', title: `Vos ${saved.length} posts du mois sont prêts ✦`, body: 'Relisez, approuvez et planifiez votre contenu.', href: '/dashboard' });

  await db.update(generationJobs).set({ status: 'done', progress: saved.length, completedAt: new Date().toISOString() }).where(eq(generationJobs.id, jobId));

  // Email « posts prêts » (best-effort).
  try {
    const [u] = await db.select({ email: users.email, name: users.fullName }).from(users).where(eq(users.id, userId)).limit(1);
    if (u) await sendMonthlyPostsEmail({ email: u.email, name: u.name }, saved.length, month);
  } catch (err) {
    logError('[gen-job] email', { error: String(err) });
  }
}
