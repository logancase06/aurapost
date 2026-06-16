import { db } from './index';
import { organizations, orgTenants, orgTemplates, orgBrandKit, coachProfiles, generatedPosts, websites, users, activityLogs } from './schema';
import { and, eq, inArray, sql, desc, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { slugify } from '@/lib/utils';
import { currentMonth } from '@/lib/utils';
import { mergeForbidden } from '@/lib/compliance';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string | null;
  brandTone: string | null;
  requiresApproval: boolean;
  ownerTenantId: string;
  createdAt: string;
}

export interface OrgMembership {
  org: Organization;
  role: 'owner' | 'member';
}

function mapOrg(r: typeof organizations.$inferSelect): Organization {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    logoUrl: r.logoUrl,
    brandColor: r.brandColor,
    brandTone: r.brandTone,
    requiresApproval: !!r.requiresApproval,
    ownerTenantId: r.ownerTenantId,
    createdAt: r.createdAt,
  };
}

/** L'organisation du tenant exige-t-elle une validation des posts ? + son orgId. */
export async function orgApprovalContext(tenantId: string): Promise<{ orgId: string; requiresApproval: boolean } | null> {
  const m = await getOrgForTenant(tenantId);
  if (!m) return null;
  return { orgId: m.org.id, requiresApproval: m.org.requiresApproval };
}

/** Active/désactive la validation obligatoire des posts pour une organisation. */
export async function setOrgRequiresApproval(orgId: string, requires: boolean): Promise<void> {
  await db.update(organizations).set({ requiresApproval: requires }).where(eq(organizations.id, orgId));
}

/** Crée une organisation et y rattache le tenant fondateur (rôle owner). Idempotent par owner. */
export async function createOrganization(ownerTenantId: string, name: string): Promise<Organization> {
  const existing = await getOrgForTenant(ownerTenantId);
  if (existing) return existing.org;

  const now = new Date().toISOString();
  const base = slugify(name) || `org-${ownerTenantId.slice(0, 6)}`;
  let slug = base;
  for (let i = 1; i < 30; i++) {
    const [clash] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, slug)).limit(1);
    if (!clash) break;
    slug = `${base}-${i + 1}`;
  }

  const id = nanoid();
  await db.insert(organizations).values({ id, name: name.trim(), slug, ownerTenantId, createdAt: now });
  await db.insert(orgTenants).values({ orgId: id, tenantId: ownerTenantId, role: 'owner', invitedAt: now, joinedAt: now });
  await db.insert(orgBrandKit).values({ orgId: id, updatedAt: now });
  const [row] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return mapOrg(row);
}

/** Organisation + rôle du tenant courant (null si le tenant n'appartient à aucune org). */
export async function getOrgForTenant(tenantId: string): Promise<OrgMembership | null> {
  const [link] = await db.select().from(orgTenants).where(eq(orgTenants.tenantId, tenantId)).limit(1);
  if (!link) return null;
  const [row] = await db.select().from(organizations).where(eq(organizations.id, link.orgId)).limit(1);
  if (!row) return null;
  return { org: mapOrg(row), role: (link.role as 'owner' | 'member') ?? 'member' };
}

export async function getOrgBySlug(slug: string): Promise<Organization | null> {
  const [row] = await db.select().from(organizations).where(eq(organizations.slug, slug.toLowerCase())).limit(1);
  return row ? mapOrg(row) : null;
}

/** Rattache un tenant à une org (invitation / import). Idempotent. */
export async function addTenantToOrg(orgId: string, tenantId: string, role: 'owner' | 'member' = 'member'): Promise<void> {
  const [existing] = await db
    .select({ tenantId: orgTenants.tenantId })
    .from(orgTenants)
    .where(and(eq(orgTenants.orgId, orgId), eq(orgTenants.tenantId, tenantId)))
    .limit(1);
  if (existing) return;
  const now = new Date().toISOString();
  await db.insert(orgTenants).values({ orgId, tenantId, role, invitedAt: now, joinedAt: now });
}

export type MemberState = 'never' | 'inactive' | 'active';

export interface OrgMemberStats {
  tenantId: string;
  name: string;
  email: string;
  city: string | null;
  postsThisMonth: number;
  totalPosts: number;
  approved: number;
  approvalRate: number;
  siteActive: boolean;
  lastActivity: string | null;
  firstLoginAt: string | null;
  lastLoginAt: string | null;
  /** never = jamais connecté · inactive = connecté mais sans action récente · active = action < 7j. */
  state: MemberState;
}

/** Membres d'une org avec leurs stats (batché). */
export async function listOrgMembersWithStats(orgId: string): Promise<OrgMemberStats[]> {
  const links = await db.select({ tenantId: orgTenants.tenantId }).from(orgTenants).where(eq(orgTenants.orgId, orgId));
  const tenantIds = links.map((l) => l.tenantId);
  if (tenantIds.length === 0) return [];

  const month = currentMonth();
  const [profiles, owners, posts, sites, logs] = await Promise.all([
    db.select({ tenantId: coachProfiles.tenantId, name: coachProfiles.displayName, city: coachProfiles.city }).from(coachProfiles).where(inArray(coachProfiles.tenantId, tenantIds)),
    db.select({ tenantId: users.tenantId, email: users.email, firstLoginAt: users.firstLoginAt, lastLoginAt: users.lastLoginAt }).from(users).where(inArray(users.tenantId, tenantIds)),
    db.select({ tenantId: generatedPosts.tenantId, status: generatedPosts.status, month: generatedPosts.month }).from(generatedPosts).where(inArray(generatedPosts.tenantId, tenantIds)),
    db.select({ tenantId: websites.tenantId, status: websites.status }).from(websites).where(inArray(websites.tenantId, tenantIds)),
    db.select({ tenantId: activityLogs.tenantId, last: sql<string>`max(${activityLogs.createdAt})` }).from(activityLogs).where(inArray(activityLogs.tenantId, tenantIds)).groupBy(activityLogs.tenantId),
  ]);

  const nameMap = new Map(profiles.map((p) => [p.tenantId, { name: p.name, city: p.city }]));
  const ownerMap = new Map(owners.map((o) => [o.tenantId, o]));
  const siteMap = new Map(sites.map((s) => [s.tenantId, s.status === 'active']));
  const lastMap = new Map(logs.map((l) => [l.tenantId, l.last]));
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const agg = new Map<string, { total: number; approved: number; rejected: number; month: number }>();
  for (const id of tenantIds) agg.set(id, { total: 0, approved: 0, rejected: 0, month: 0 });
  for (const p of posts) {
    const a = agg.get(p.tenantId);
    if (!a) continue;
    a.total++;
    if (p.status === 'approved') a.approved++;
    else if (p.status === 'rejected') a.rejected++;
    if (p.month === month) a.month++;
  }

  return tenantIds.map((id) => {
    const a = agg.get(id)!;
    const decided = a.approved + a.rejected;
    const owner = ownerMap.get(id);
    const lastActivity = lastMap.get(id) ?? null;
    const firstLoginAt = owner?.firstLoginAt ?? null;
    const state: MemberState = !firstLoginAt
      ? 'never'
      : lastActivity && new Date(lastActivity).getTime() >= weekAgo
        ? 'active'
        : 'inactive';
    return {
      tenantId: id,
      name: nameMap.get(id)?.name ?? '—',
      email: owner?.email ?? '—',
      city: nameMap.get(id)?.city ?? null,
      postsThisMonth: a.month,
      totalPosts: a.total,
      approved: a.approved,
      approvalRate: decided > 0 ? Math.round((a.approved / decided) * 100) : 0,
      siteActive: siteMap.get(id) ?? false,
      lastActivity,
      firstLoginAt,
      lastLoginAt: owner?.lastLoginAt ?? null,
      state,
    };
  }).sort((x, y) => y.totalPosts - x.totalPosts);
}

// ── Brand kit ────────────────────────────────────────────────────────────────

export interface BrandKit {
  orgId: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  toneGuidelines: string | null;
  forbiddenWords: string[];
}

function parseWords(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return raw.split(',').map((w) => w.trim()).filter(Boolean);
  }
}

export async function getBrandKit(orgId: string): Promise<BrandKit | null> {
  const [row] = await db.select().from(orgBrandKit).where(eq(orgBrandKit.orgId, orgId)).limit(1);
  if (!row) return null;
  return {
    orgId: row.orgId,
    logoUrl: row.logoUrl,
    primaryColor: row.primaryColor,
    secondaryColor: row.secondaryColor,
    toneGuidelines: row.toneGuidelines,
    forbiddenWords: parseWords(row.forbiddenWords),
  };
}

export async function upsertBrandKit(
  orgId: string,
  patch: { logoUrl?: string | null; primaryColor?: string; secondaryColor?: string; toneGuidelines?: string; forbiddenWords?: string[] }
): Promise<void> {
  const now = new Date().toISOString();
  const set: Record<string, unknown> = { updatedAt: now };
  if (patch.logoUrl !== undefined) set.logoUrl = patch.logoUrl;
  if (patch.primaryColor !== undefined) set.primaryColor = patch.primaryColor;
  if (patch.secondaryColor !== undefined) set.secondaryColor = patch.secondaryColor;
  if (patch.toneGuidelines !== undefined) set.toneGuidelines = patch.toneGuidelines;
  if (patch.forbiddenWords !== undefined) set.forbiddenWords = JSON.stringify(patch.forbiddenWords);

  const [existing] = await db.select({ orgId: orgBrandKit.orgId }).from(orgBrandKit).where(eq(orgBrandKit.orgId, orgId)).limit(1);
  if (existing) await db.update(orgBrandKit).set(set).where(eq(orgBrandKit.orgId, orgId));
  else await db.insert(orgBrandKit).values({ orgId, updatedAt: now, ...set });
}

/** Brand kit applicable au tenant (via son org), pour la génération. Null si pas d'org. */
export interface TenantBrandConstraints {
  orgName: string;
  brandTone: string | null;
  toneGuidelines: string | null;
  forbiddenWords: string[];
}
export async function getBrandConstraintsForTenant(tenantId: string): Promise<TenantBrandConstraints | null> {
  const membership = await getOrgForTenant(tenantId);
  if (!membership) return null;
  const kit = await getBrandKit(membership.org.id);
  return {
    orgName: membership.org.name,
    brandTone: membership.org.brandTone,
    toneGuidelines: kit?.toneGuidelines ?? null,
    // Mots interdits de l'org + liste noire MLM par défaut (conformité allégations de revenus).
    forbiddenWords: mergeForbidden(kit?.forbiddenWords),
  };
}

// ── Templates validés ────────────────────────────────────────────────────────

export interface OrgTemplate {
  id: string;
  orgId: string;
  name: string;
  content: string;
  category: string | null;
  isLocked: boolean;
  createdAt: string;
}

export async function listOrgTemplates(orgId: string): Promise<OrgTemplate[]> {
  const rows = await db.select().from(orgTemplates).where(eq(orgTemplates.orgId, orgId)).orderBy(desc(orgTemplates.createdAt));
  return rows.map((r) => ({ id: r.id, orgId: r.orgId, name: r.name, content: r.content, category: r.category, isLocked: !!r.isLocked, createdAt: r.createdAt }));
}

export async function addOrgTemplate(orgId: string, t: { name: string; content: string; category?: string; isLocked?: boolean }): Promise<void> {
  await db.insert(orgTemplates).values({
    id: nanoid(),
    orgId,
    name: t.name.trim(),
    content: t.content.trim(),
    category: t.category ?? null,
    isLocked: t.isLocked ?? true,
    createdAt: new Date().toISOString(),
  });
}

// ── Reporting agrégé (Phase 5.4) ─────────────────────────────────────────────

export interface OrgReporting {
  memberCount: number;
  activeThisWeek: number;
  neverConnected: number; // jamais connecté (first_login_at null)
  inactiveConnected: number; // connecté mais sans action récente
  postsThisMonth: number;
  approved: number;
  rejected: number;
  approvalRate: number;
  sitesPublished: number;
  publishRate: number;
  top: OrgMemberStats[];
  bottom: OrgMemberStats[];
}

/** Rapport agrégé d'une org (période : 'week' | 'month' | 'all'). */
export async function getOrgReporting(orgId: string): Promise<OrgReporting> {
  const members = await listOrgMembersWithStats(orgId);
  const activeThisWeek = members.filter((m) => m.state === 'active').length;
  const neverConnected = members.filter((m) => m.state === 'never').length;
  const inactiveConnected = members.filter((m) => m.state === 'inactive').length;
  const postsThisMonth = members.reduce((s, m) => s + m.postsThisMonth, 0);
  const approved = members.reduce((s, m) => s + m.approved, 0);
  const totalPosts = members.reduce((s, m) => s + m.totalPosts, 0);
  const rejected = members.reduce((s, m) => s + (m.totalPosts > 0 ? m.totalPosts - m.approved : 0), 0);
  const decided = approved + Math.max(0, totalPosts - approved);
  const sitesPublished = members.filter((m) => m.siteActive).length;

  return {
    memberCount: members.length,
    activeThisWeek,
    neverConnected,
    inactiveConnected,
    postsThisMonth,
    approved,
    rejected,
    approvalRate: decided > 0 ? Math.round((approved / decided) * 100) : 0,
    sitesPublished,
    publishRate: members.length > 0 ? Math.round((sitesPublished / members.length) * 100) : 0,
    top: [...members].sort((a, b) => b.totalPosts - a.totalPosts).slice(0, 5),
    bottom: [...members].sort((a, b) => a.totalPosts - b.totalPosts).slice(0, 5),
  };
}

/** Compte les membres d'une org (sans charger les stats). */
export async function countOrgMembers(orgId: string): Promise<number> {
  const [row] = await db.select({ c: count() }).from(orgTenants).where(eq(orgTenants.orgId, orgId));
  return Number(row?.c ?? 0);
}
