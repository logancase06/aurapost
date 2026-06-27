import { db } from './index';
import { generatedPosts, coachProfiles } from './schema';
import { and, eq, isNull, isNotNull, desc, sql, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import {
  generateMonthlyContent,
  generateVariant,
  generateCaptionPack,
  GENERATION_MODE,
  type CoachProfileInput,
  type PostDraft,
  type Network,
} from '@/lib/content-generator';

// Mode de génération configuré, normalisé au domaine stocké ('api' | 'mock').
const CONFIGURED_GEN_MODE: 'api' | 'mock' = GENERATION_MODE === 'mock-enrichi' ? 'mock' : 'api';
import { logActivity } from './activity';
import { createNotification } from './notifications';
import { enqueueGeneration } from '@/lib/queue';
import { isGenerationRecorded, recordGeneration } from '@/lib/rate-limit';
import { currentMonth } from '@/lib/utils';
import { logError, logEvent } from '@/lib/logger';
import { parseAnalysis, InstagramAnalysisSchema, ReviewsAnalysisSchema } from '@/lib/validation';
import { getBrandConstraintsForTenant } from './organizations';

export type PostStatus = 'draft' | 'approved' | 'rejected' | 'pending_approval';

export interface PostRow {
  id: string;
  network: Network;
  status: PostStatus;
  title: string | null;
  theme: string | null;
  content: string;
  hashtags: string[];
  callToAction: string | null;
  month: string;
  variantOfId: string | null;
  format: string;
  scheduledFor: string | null;
  copyCount: number;
  createdAt: string;
}

const POST_COLS = {
  id: generatedPosts.id,
  network: generatedPosts.network,
  status: generatedPosts.status,
  title: generatedPosts.title,
  theme: generatedPosts.theme,
  content: generatedPosts.content,
  hashtags: generatedPosts.hashtags,
  callToAction: generatedPosts.callToAction,
  month: generatedPosts.month,
  variantOfId: generatedPosts.variantOfId,
  format: generatedPosts.format,
  scheduledFor: generatedPosts.scheduledFor,
  copyCount: generatedPosts.copyCount,
  createdAt: generatedPosts.createdAt,
};

function mapRow(r: Record<string, unknown>): PostRow {
  return {
    id: r.id as string,
    network: (r.network as Network) ?? 'instagram',
    status: (r.status as PostStatus) ?? 'draft',
    title: (r.title as string) ?? null,
    theme: (r.theme as string) ?? null,
    content: (r.content as string) ?? '',
    hashtags: parseHashtags(r.hashtags as string | null),
    callToAction: (r.callToAction as string) ?? null,
    month: (r.month as string) ?? '',
    variantOfId: (r.variantOfId as string) ?? null,
    format: (r.format as string) ?? 'post',
    scheduledFor: (r.scheduledFor as string) ?? null,
    copyCount: Number(r.copyCount ?? 0),
    createdAt: (r.createdAt as string) ?? '',
  };
}

function parseHashtags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

// ── Profil → input générateur ────────────────────────────────────────────────

export async function getProfileInput(tenantId: string): Promise<CoachProfileInput | null> {
  const [row] = await db
    .select({
      displayName: coachProfiles.displayName,
      speciality: coachProfiles.speciality,
      city: coachProfiles.city,
      tone: coachProfiles.tone,
      contentStyle: coachProfiles.contentStyle,
      bio: coachProfiles.bio,
      targetAudience: coachProfiles.targetAudience,
      results: coachProfiles.results,
      linkedinHeadline: coachProfiles.linkedinHeadline,
      linkedinSummary: coachProfiles.linkedinSummary,
      language: coachProfiles.language,
      instagramAnalysis: coachProfiles.instagramAnalysis,
      reviewsAnalysis: coachProfiles.reviewsAnalysis,
    })
    .from(coachProfiles)
    .where(eq(coachProfiles.tenantId, tenantId))
    .limit(1);
  if (!row) return null;
  // Contraintes de marque héritées si le tenant appartient à une organisation/réseau.
  const brand = await getBrandConstraintsForTenant(tenantId);
  return {
    displayName: row.displayName,
    speciality: row.speciality,
    city: row.city,
    tone: row.tone,
    contentStyle: row.contentStyle,
    bio: row.bio,
    targetAudience: row.targetAudience,
    language: row.language ?? 'fr',
    // Signaux séparés (le prompt et le mock les exploitent distinctement) :
    instagramVoice: buildInstagramVoice(row.instagramAnalysis),
    clientStrengths: parseStrengths(row.reviewsAnalysis),
    clientResults: row.results ?? null,
    linkedinHeadline: row.linkedinHeadline,
    linkedinSummary: row.linkedinSummary,
    brandName: brand?.orgName ?? null,
    brandTone: brand?.brandTone ?? null,
    brandGuidelines: brand?.toneGuidelines ?? null,
    forbiddenWords: brand?.forbiddenWords ?? null,
  };
}

/** Condense l'analyse Instagram (ton, style, thèmes, phrase) en une consigne texte. */
function buildInstagramVoice(instagramJson: string | null): string | null {
  const ig = parseAnalysis(instagramJson, InstagramAnalysisSchema);
  if (!ig) return null;
  const parts: string[] = [];
  if (ig.ton_dominant) parts.push(`ton ${ig.ton_dominant}`);
  if (ig.style_ecriture) parts.push(ig.style_ecriture);
  if (ig.themes_recurrents?.length) parts.push(`thèmes : ${ig.themes_recurrents.join(', ')}`);
  if (ig.phrase_caracteristique) parts.push(`ex. de phrase : « ${ig.phrase_caracteristique} »`);
  return parts.length ? parts.join(' · ') : null;
}

/** Extrait les points forts clients de l'analyse d'avis (JSON validé). */
function parseStrengths(reviewsJson: string | null): string[] | null {
  const rv = parseAnalysis(reviewsJson, ReviewsAnalysisSchema);
  const list = rv?.strengths?.map((s) => s.trim()).filter(Boolean).slice(0, 3) ?? [];
  return list.length ? list : null;
}

// ── Lectures ─────────────────────────────────────────────────────────────────

export async function listPosts(
  tenantId: string,
  filters?: { network?: Network; status?: PostStatus; month?: string }
): Promise<PostRow[]> {
  const conds = [eq(generatedPosts.tenantId, tenantId)];
  if (filters?.network) conds.push(eq(generatedPosts.network, filters.network));
  if (filters?.status) conds.push(eq(generatedPosts.status, filters.status));
  if (filters?.month) conds.push(eq(generatedPosts.month, filters.month));

  const rows = await db
    .select(POST_COLS)
    .from(generatedPosts)
    .where(and(...conds))
    .orderBy(desc(generatedPosts.createdAt))
    .limit(500);
  return rows.map(mapRow);
}

export async function getPostById(tenantId: string, postId: string): Promise<PostRow | null> {
  const [row] = await db
    .select(POST_COLS)
    .from(generatedPosts)
    .where(and(eq(generatedPosts.id, postId), eq(generatedPosts.tenantId, tenantId)))
    .limit(1);
  return row ? mapRow(row) : null;
}

export interface PostStats {
  total: number;
  draft: number;
  approved: number;
  rejected: number;
  pendingApproval: number;
  instagram: number;
  linkedin: number;
}

export async function getPostStats(tenantId: string, month?: string): Promise<PostStats> {
  const conds = [eq(generatedPosts.tenantId, tenantId)];
  if (month) conds.push(eq(generatedPosts.month, month));
  const rows = await db
    .select({ status: generatedPosts.status, network: generatedPosts.network })
    .from(generatedPosts)
    .where(and(...conds));

  const stats: PostStats = { total: 0, draft: 0, approved: 0, rejected: 0, pendingApproval: 0, instagram: 0, linkedin: 0 };
  for (const r of rows) {
    stats.total++;
    if (r.status === 'approved') stats.approved++;
    else if (r.status === 'rejected') stats.rejected++;
    else if (r.status === 'pending_approval') stats.pendingApproval++;
    else stats.draft++;
    if (r.network === 'linkedin') stats.linkedin++;
    else stats.instagram++;
  }
  return stats;
}

/** Mois (YYYY-MM) ayant au moins un lot mensuel généré, pour l'historique. */
export async function listGeneratedMonths(tenantId: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ month: generatedPosts.month })
    .from(generatedPosts)
    .where(eq(generatedPosts.tenantId, tenantId));
  return rows
    .map((r) => r.month)
    .filter(Boolean)
    .sort()
    .reverse();
}

// ── Rate limit : 1 génération mensuelle par tenant ──────────────────────────

export async function hasGeneratedThisMonth(tenantId: string, month: string): Promise<boolean> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(generatedPosts)
    .where(
      and(
        eq(generatedPosts.tenantId, tenantId),
        eq(generatedPosts.month, month),
        isNull(generatedPosts.variantOfId) // les variantes ne comptent pas
      )
    );
  return Number(row?.count ?? 0) > 0;
}

/** Mode du dernier lot généré ce mois ('api' | 'mock' | null) — pour la bannière fallback. */
export async function getLatestGenerationMode(tenantId: string, month = currentMonth()): Promise<'api' | 'mock' | null> {
  const [row] = await db
    .select({ mode: generatedPosts.generatedMode })
    .from(generatedPosts)
    .where(and(eq(generatedPosts.tenantId, tenantId), eq(generatedPosts.month, month), isNull(generatedPosts.variantOfId)))
    .orderBy(desc(generatedPosts.createdAt))
    .limit(1);
  return (row?.mode as 'api' | 'mock' | null) ?? null;
}

/** Nombre de variantes générées ce mois par le tenant (pour le gating par plan). */
export async function getVariantesCount(tenantId: string, month = currentMonth()): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(generatedPosts)
    .where(and(eq(generatedPosts.tenantId, tenantId), eq(generatedPosts.month, month), isNotNull(generatedPosts.variantOfId)));
  return Number(row?.count ?? 0);
}

// ── Génération + sauvegarde ──────────────────────────────────────────────────

export type GenerateResult =
  | { ok: true; count: number; month: string }
  | { ok: false; error: 'no_profile' | 'already_generated' | 'internal' };

export async function runMonthlyGeneration(
  tenantId: string,
  userId: string,
  opts?: { maxPosts?: number; instagramOnly?: boolean; initialStatus?: PostStatus }
): Promise<GenerateResult> {
  const profile = await getProfileInput(tenantId);
  if (!profile) return { ok: false, error: 'no_profile' };

  const month = currentMonth();
  // Garde distribué (Redis, multi-lambda) puis vérité en base.
  if ((await isGenerationRecorded(tenantId, month)) || (await hasGeneratedThisMonth(tenantId, month))) {
    return { ok: false, error: 'already_generated' };
  }

  logEvent('generation.started', tenantId, { month });
  let drafts: PostDraft[];
  let mode: 'api' | 'mock';
  try {
    // File d'attente : limite la concurrence des générations lourdes.
    // `tenantId` sert de seed au mock enrichi (variété stable, sans répétition).
    const res = await enqueueGeneration(() => generateMonthlyContent(profile, tenantId));
    drafts = res.posts;
    mode = res.mode;
  } catch (err) {
    logError('[posts] génération échouée', { tenantId, error: String(err) });
    logEvent('generation.failed', tenantId, { month, error: String(err) });
    return { ok: false, error: 'internal' };
  }
  if (mode === 'mock') logEvent('generation.fallback_mock', tenantId, { month });

  // Limites du plan (ex. offre Découverte = 4 posts Instagram uniquement).
  if (opts?.instagramOnly) drafts = drafts.filter((d) => d.network === 'instagram');
  if (opts?.maxPosts && drafts.length > opts.maxPosts) drafts = drafts.slice(0, opts.maxPosts);

  const now = new Date().toISOString();
  const initialStatus: PostStatus = opts?.initialStatus ?? 'draft';
  const values = drafts.map((d) => ({
    id: nanoid(),
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
    generatedMode: mode,
    createdAt: now,
    updatedAt: now,
  }));

  await db.insert(generatedPosts).values(values);
  await recordGeneration(tenantId, month); // marque le garde distribué
  await logActivity(tenantId, userId, 'content_generated', null, { month, count: values.length });
  logEvent('generation.success', tenantId, { month, count: values.length, mode });
  await createNotification({
    tenantId,
    userId,
    type: 'posts_ready',
    title: `Vos ${values.length} posts du mois sont prêts ✦`,
    body: 'Relisez, approuvez et planifiez votre contenu.',
    href: '/dashboard',
  });

  return { ok: true, count: values.length, month };
}

export async function createVariantForPost(
  tenantId: string,
  userId: string,
  postId: string
): Promise<{ ok: true; id: string } | { ok: false; error: 'not_found' | 'no_profile' | 'internal' }> {
  const original = await getPostById(tenantId, postId);
  if (!original) return { ok: false, error: 'not_found' };
  const profile = await getProfileInput(tenantId);
  if (!profile) return { ok: false, error: 'no_profile' };

  try {
    const draft = await enqueueGeneration(() =>
      generateVariant(profile, {
        network: original.network,
      title: original.title ?? '',
      content: original.content,
      hashtags: original.hashtags,
      callToAction: original.callToAction ?? '',
      theme: original.theme ?? 'général',
      tone: profile.tone,
      })
    );

    const id = nanoid();
    const now = new Date().toISOString();
    await db.insert(generatedPosts).values({
      id,
      tenantId,
      network: draft.network,
      status: 'draft',
      title: draft.title,
      theme: draft.theme,
      content: draft.content,
      hashtags: JSON.stringify(draft.hashtags),
      callToAction: draft.callToAction,
      month: original.month,
      variantOfId: postId,
      generatedBy: userId,
      generatedMode: CONFIGURED_GEN_MODE,
      createdAt: now,
      updatedAt: now,
    });
    await logActivity(tenantId, userId, 'variant_generated', postId, { network: draft.network });
    return { ok: true, id };
  } catch (err) {
    logError('[posts] variante échouée', { tenantId, postId, error: String(err) });
    return { ok: false, error: 'internal' };
  }
}

export async function setPostStatus(
  tenantId: string,
  userId: string,
  postId: string,
  status: PostStatus
): Promise<{ ok: boolean }> {
  await db
    .update(generatedPosts)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(and(eq(generatedPosts.id, postId), eq(generatedPosts.tenantId, tenantId)));
  await logActivity(tenantId, userId, `post_${status}`, postId);
  return { ok: true };
}

/** Passe plusieurs posts en un seul UPDATE. Filtre strict sur tenantId. */
export async function batchSetPostStatus(
  tenantId: string,
  userId: string,
  postIds: string[],
  status: PostStatus
): Promise<{ ok: boolean; count: number }> {
  if (!postIds.length) return { ok: true, count: 0 };
  const safe = postIds.slice(0, 100); // hard cap anti-abus
  await db
    .update(generatedPosts)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(and(eq(generatedPosts.tenantId, tenantId), inArray(generatedPosts.id, safe)));
  await logActivity(tenantId, userId, `batch_${status}`, null, { count: safe.length });
  return { ok: true, count: safe.length };
}

// ── Détail d'un post + historique des variantes ──────────────────────────────

export interface PostWithVariants {
  post: PostRow;
  /** Le post original (si `post` est lui-même une variante). */
  original: PostRow | null;
  /** Toutes les variantes générées à partir du même original (hors `post`). */
  variants: PostRow[];
}

export async function getPostWithVariants(tenantId: string, postId: string): Promise<PostWithVariants | null> {
  const post = await getPostById(tenantId, postId);
  if (!post) return null;

  const rootId = post.variantOfId ?? post.id;
  const original = post.variantOfId ? await getPostById(tenantId, rootId) : post;

  const siblings = await db
    .select(POST_COLS)
    .from(generatedPosts)
    .where(and(eq(generatedPosts.tenantId, tenantId), eq(generatedPosts.variantOfId, rootId)))
    .orderBy(desc(generatedPosts.createdAt));

  const variants = siblings.map(mapRow).filter((v) => v.id !== post.id);
  return { post, original: original && original.id !== post.id ? original : original ?? null, variants };
}

/** Incrémente le compteur « copié X fois » d'un post (stat). */
export async function incrementCopyCount(tenantId: string, postId: string): Promise<number> {
  await db
    .update(generatedPosts)
    .set({ copyCount: sql`${generatedPosts.copyCount} + 1`, updatedAt: new Date().toISOString() })
    .where(and(eq(generatedPosts.id, postId), eq(generatedPosts.tenantId, tenantId)));
  const [row] = await db
    .select({ copyCount: generatedPosts.copyCount })
    .from(generatedPosts)
    .where(and(eq(generatedPosts.id, postId), eq(generatedPosts.tenantId, tenantId)))
    .limit(1);
  return Number(row?.copyCount ?? 0);
}

// ── Planification / calendrier éditorial ─────────────────────────────────────

/** Planifie (ou déplanifie si null) un post à une date ISO. */
export async function schedulePost(
  tenantId: string,
  userId: string,
  postId: string,
  dateISO: string | null
): Promise<{ ok: boolean }> {
  await db
    .update(generatedPosts)
    .set({ scheduledFor: dateISO, updatedAt: new Date().toISOString() })
    .where(and(eq(generatedPosts.id, postId), eq(generatedPosts.tenantId, tenantId)));
  await logActivity(tenantId, userId, dateISO ? 'post_scheduled' : 'post_unscheduled', postId, { dateISO });
  return { ok: true };
}

/** Posts planifiés dans un intervalle [startISO, endISO) — pour la vue calendrier. */
export async function listScheduledRange(tenantId: string, startISO: string, endISO: string): Promise<PostRow[]> {
  const rows = await db
    .select(POST_COLS)
    .from(generatedPosts)
    .where(
      and(
        eq(generatedPosts.tenantId, tenantId),
        sql`${generatedPosts.scheduledFor} IS NOT NULL`,
        sql`${generatedPosts.scheduledFor} >= ${startISO}`,
        sql`${generatedPosts.scheduledFor} < ${endISO}`
      )
    )
    .orderBy(generatedPosts.scheduledFor);
  return rows.map(mapRow);
}

/** Posts approuvés non encore planifiés — réservoir à glisser dans le calendrier. */
export async function listSchedulablePosts(tenantId: string): Promise<PostRow[]> {
  const rows = await db
    .select(POST_COLS)
    .from(generatedPosts)
    .where(
      and(
        eq(generatedPosts.tenantId, tenantId),
        eq(generatedPosts.status, 'approved'),
        sql`${generatedPosts.scheduledFor} IS NULL`
      )
    )
    .orderBy(desc(generatedPosts.createdAt))
    .limit(100);
  return rows.map(mapRow);
}

// ── Pack de légendes (30 stories) ────────────────────────────────────────────

export async function runCaptionPackGeneration(
  tenantId: string,
  userId: string
): Promise<{ ok: true; count: number } | { ok: false; error: 'no_profile' | 'internal' }> {
  const profile = await getProfileInput(tenantId);
  if (!profile) return { ok: false, error: 'no_profile' };

  try {
    const captions = await enqueueGeneration(() => generateCaptionPack(profile));
    const now = new Date().toISOString();
    const month = currentMonth();
    const values = captions.map((c) => ({
      id: nanoid(),
      tenantId,
      network: 'instagram' as const,
      status: 'draft' as const,
      title: null,
      theme: c.theme,
      content: c.content,
      hashtags: JSON.stringify([]),
      callToAction: null,
      month,
      variantOfId: null,
      format: 'story_caption' as const,
      generatedBy: userId,
      generatedMode: CONFIGURED_GEN_MODE,
      createdAt: now,
      updatedAt: now,
    }));
    await db.insert(generatedPosts).values(values);
    await logActivity(tenantId, userId, 'caption_pack_generated', null, { count: values.length });
    return { ok: true, count: values.length };
  } catch (err) {
    logError('[posts] caption pack échoué', { tenantId, error: String(err) });
    return { ok: false, error: 'internal' };
  }
}
