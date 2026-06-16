import { db } from './index';
import { postApprovals, generatedPosts, orgTenants, coachProfiles, users } from './schema';
import { and, eq, inArray, desc, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { logActivity } from './activity';

export interface PendingPost {
  id: string;
  tenantId: string;
  distributor: string;
  network: string;
  title: string | null;
  content: string;
  createdAt: string;
}

async function orgTenantIds(orgId: string): Promise<string[]> {
  const rows = await db.select({ tenantId: orgTenants.tenantId }).from(orgTenants).where(eq(orgTenants.orgId, orgId));
  return rows.map((r) => r.tenantId);
}

/** Posts en attente de validation pour une organisation (avec le nom du distributeur). */
export async function listPendingApprovals(orgId: string): Promise<PendingPost[]> {
  const ids = await orgTenantIds(orgId);
  if (ids.length === 0) return [];
  const [posts, profiles] = await Promise.all([
    db
      .select({ id: generatedPosts.id, tenantId: generatedPosts.tenantId, network: generatedPosts.network, title: generatedPosts.title, content: generatedPosts.content, createdAt: generatedPosts.createdAt })
      .from(generatedPosts)
      .where(and(inArray(generatedPosts.tenantId, ids), eq(generatedPosts.status, 'pending_approval')))
      .orderBy(desc(generatedPosts.createdAt))
      .limit(500),
    db.select({ tenantId: coachProfiles.tenantId, name: coachProfiles.displayName }).from(coachProfiles).where(inArray(coachProfiles.tenantId, ids)),
  ]);
  const nameMap = new Map(profiles.map((p) => [p.tenantId, p.name]));
  return posts.map((p) => ({ ...p, distributor: nameMap.get(p.tenantId) ?? '—' }));
}

export async function countPendingApprovals(orgId: string): Promise<number> {
  const ids = await orgTenantIds(orgId);
  if (ids.length === 0) return 0;
  const [row] = await db
    .select({ c: count() })
    .from(generatedPosts)
    .where(and(inArray(generatedPosts.tenantId, ids), eq(generatedPosts.status, 'pending_approval')));
  return Number(row?.c ?? 0);
}

/** Vérifie que le post appartient bien à un distributeur de l'org, retourne tenant + contenu. */
async function postInOrg(orgId: string, postId: string): Promise<{ tenantId: string; content: string } | null> {
  const ids = await orgTenantIds(orgId);
  if (ids.length === 0) return null;
  const [row] = await db
    .select({ tenantId: generatedPosts.tenantId, content: generatedPosts.content })
    .from(generatedPosts)
    .where(and(eq(generatedPosts.id, postId), inArray(generatedPosts.tenantId, ids)))
    .limit(1);
  return row ?? null;
}

export interface DecisionResult {
  ok: boolean;
  /** Email + prénom du distributeur (pour notification). */
  notify?: { email: string; name: string };
  error?: string;
}

async function distributorContact(tenantId: string): Promise<{ email: string; name: string } | null> {
  const [u] = await db.select({ email: users.email, name: users.fullName }).from(users).where(eq(users.tenantId, tenantId)).limit(1);
  return u ?? null;
}

/** Manager valide un post → statut approved + journal + ligne d'audit. */
export async function approvePost(orgId: string, reviewerId: string, postId: string, comment?: string): Promise<DecisionResult> {
  const post = await postInOrg(orgId, postId);
  if (!post) return { ok: false, error: 'Post introuvable dans cette organisation.' };
  const now = new Date().toISOString();
  await db.update(generatedPosts).set({ status: 'approved', updatedAt: now }).where(eq(generatedPosts.id, postId));
  await db.insert(postApprovals).values({ id: nanoid(), postId, orgId, reviewerId, status: 'approved', comment: comment ?? null, reviewedAt: now, createdAt: now });
  await logActivity(post.tenantId, reviewerId, 'org_post_approved', postId, { orgId });
  return { ok: true, notify: (await distributorContact(post.tenantId)) ?? undefined };
}

/** Manager rejette un post → statut rejected + commentaire + journal + audit. */
export async function rejectPost(orgId: string, reviewerId: string, postId: string, comment: string): Promise<DecisionResult> {
  const post = await postInOrg(orgId, postId);
  if (!post) return { ok: false, error: 'Post introuvable dans cette organisation.' };
  const now = new Date().toISOString();
  await db.update(generatedPosts).set({ status: 'rejected', updatedAt: now }).where(eq(generatedPosts.id, postId));
  await db.insert(postApprovals).values({ id: nanoid(), postId, orgId, reviewerId, status: 'rejected', comment, reviewedAt: now, createdAt: now });
  await logActivity(post.tenantId, reviewerId, 'org_post_rejected', postId, { orgId, comment });
  return { ok: true, notify: (await distributorContact(post.tenantId)) ?? undefined };
}

export interface ApprovalRegistryRow {
  status: string;
  comment: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

/** Registre des décisions (page compliance) + stats. */
export async function getApprovalRegistry(orgId: string): Promise<{ rows: ApprovalRegistryRow[]; approved: number; rejected: number; rate: number }> {
  const rows = await db
    .select({ status: postApprovals.status, comment: postApprovals.comment, reviewedAt: postApprovals.reviewedAt, createdAt: postApprovals.createdAt })
    .from(postApprovals)
    .where(eq(postApprovals.orgId, orgId))
    .orderBy(desc(postApprovals.createdAt))
    .limit(500);
  const approved = rows.filter((r) => r.status === 'approved').length;
  const rejected = rows.filter((r) => r.status === 'rejected').length;
  const decided = approved + rejected;
  return { rows, approved, rejected, rate: decided > 0 ? Math.round((approved / decided) * 100) : 0 };
}
