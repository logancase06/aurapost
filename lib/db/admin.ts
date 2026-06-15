import { db } from './index';
import { tenants, users, coachProfiles, generatedPosts, subscriptions, supportTickets, activityLogs, websites, coachPhotos } from './schema';
import { and, eq, sql, desc, isNotNull, count, countDistinct, max } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { currentMonth } from '@/lib/utils';
import { isPlanActive, type PlanId } from '@/lib/plans';
import { logActivity } from './activity';

export interface AdminStats {
  tenantCount: number;
  postsThisMonth: number;
  activeSubscriptions: number;
  mockRevenue: string;
}

export async function getAdminStats(): Promise<AdminStats> {
  const [[t], [p], [s]] = await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(tenants),
    db
      .select({ c: sql<number>`count(*)` })
      .from(generatedPosts)
      .where(eq(generatedPosts.month, currentMonth())),
    db
      .select({ c: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active')),
  ]);

  const tenantCount = Number(t?.c ?? 0);
  const activeSubscriptions = Number(s?.c ?? 0);
  // Revenu mocké tant que Stripe n'est pas configuré (prix non figés).
  const mockRevenue = `${activeSubscriptions * 0} €`;

  return {
    tenantCount,
    postsThisMonth: Number(p?.c ?? 0),
    activeSubscriptions,
    mockRevenue,
  };
}

export interface AdminCoachRow {
  tenantId: string;
  tenantName: string;
  status: string;
  plan: string;
  ownerEmail: string;
  ownerName: string;
  speciality: string | null;
  city: string | null;
  createdAt: string;
  postCount: number;
}

export async function listCoaches(): Promise<AdminCoachRow[]> {
  const rows = await db
    .select({
      tenantId: tenants.id,
      tenantName: tenants.name,
      status: tenants.status,
      plan: tenants.plan,
      ownerEmail: users.email,
      ownerName: users.fullName,
      speciality: coachProfiles.speciality,
      city: coachProfiles.city,
      createdAt: tenants.createdAt,
    })
    .from(tenants)
    .leftJoin(users, eq(users.id, tenants.ownerId))
    .leftJoin(coachProfiles, eq(coachProfiles.tenantId, tenants.id))
    .orderBy(desc(tenants.createdAt))
    .limit(500);

  // Comptage de posts par tenant.
  const counts = await db
    .select({ tenantId: generatedPosts.tenantId, c: sql<number>`count(*)` })
    .from(generatedPosts)
    .groupBy(generatedPosts.tenantId);
  const countMap = new Map(counts.map((r) => [r.tenantId, Number(r.c)]));

  return rows.map((r) => ({
    tenantId: r.tenantId,
    tenantName: r.tenantName,
    status: r.status,
    plan: r.plan,
    ownerEmail: r.ownerEmail ?? '—',
    ownerName: r.ownerName ?? '—',
    speciality: r.speciality,
    city: r.city,
    createdAt: r.createdAt,
    postCount: countMap.get(r.tenantId) ?? 0,
  }));
}

export async function recentSignups(limit = 8): Promise<{ name: string; email: string; createdAt: string }[]> {
  const rows = await db
    .select({ name: users.fullName, email: users.email, createdAt: users.createdAt })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit);
  return rows;
}

export async function setTenantStatus(
  adminUserId: string,
  tenantId: string,
  status: 'active' | 'disabled'
): Promise<void> {
  await db
    .update(tenants)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(tenants.id, tenantId));
  await logActivity(null, adminUserId, 'admin_tenant_status', tenantId, { status });
}

// ── Intelligence business (Step 6 + 19) ──────────────────────────────────────

export interface SupportTicketRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export async function listSupportTickets(limit = 25): Promise<SupportTicketRow[]> {
  return db
    .select({
      id: supportTickets.id,
      name: supportTickets.name,
      email: supportTickets.email,
      subject: supportTickets.subject,
      message: supportTickets.message,
      status: supportTickets.status,
      createdAt: supportTickets.createdAt,
    })
    .from(supportTickets)
    .orderBy(desc(supportTickets.createdAt))
    .limit(limit);
}

export interface InactiveCoach {
  tenantId: string;
  name: string;
  email: string;
  lastActivity: string | null;
  daysInactive: number;
}

/** Coachs sans activité depuis `days` jours (dernier log < seuil). */
export async function listInactiveCoaches(days = 14): Promise<InactiveCoach[]> {
  const owners = await db
    .select({ tenantId: tenants.id, name: users.fullName, email: users.email })
    .from(tenants)
    .leftJoin(users, eq(users.id, tenants.ownerId))
    .where(eq(tenants.status, 'active'))
    .limit(500);

  const lastLogs = await db
    .select({ tenantId: activityLogs.tenantId, last: sql<string>`max(${activityLogs.createdAt})` })
    .from(activityLogs)
    .groupBy(activityLogs.tenantId);
  const lastMap = new Map(lastLogs.map((r) => [r.tenantId, r.last]));

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const out: InactiveCoach[] = [];
  for (const o of owners) {
    const last = lastMap.get(o.tenantId) ?? null;
    const lastMs = last ? new Date(last).getTime() : 0;
    if (lastMs < cutoff) {
      out.push({
        tenantId: o.tenantId,
        name: o.name ?? '—',
        email: o.email ?? '—',
        lastActivity: last,
        daysInactive: last ? Math.floor((Date.now() - lastMs) / 86400000) : 999,
      });
    }
  }
  return out.sort((a, b) => b.daysInactive - a.daysInactive).slice(0, 30);
}

/** Répartition horaire des générations (heatmap 0–23h) à partir des logs. */
export async function getGenerationHeatmap(): Promise<number[]> {
  const rows = await db
    .select({ createdAt: activityLogs.createdAt })
    .from(activityLogs)
    .where(eq(activityLogs.action, 'content_generated'))
    .limit(5000);
  const hours = new Array(24).fill(0);
  for (const r of rows) {
    const h = new Date(r.createdAt).getHours();
    if (h >= 0 && h < 24) hours[h]++;
  }
  return hours;
}

/** Taux d'approbation réel des posts (approved / approved+rejected). */
export async function getApprovalRate(): Promise<number> {
  const [a, r] = await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(generatedPosts).where(eq(generatedPosts.status, 'approved')),
    db.select({ c: sql<number>`count(*)` }).from(generatedPosts).where(eq(generatedPosts.status, 'rejected')),
  ]);
  const approved = Number(a[0]?.c ?? 0);
  const rejected = Number(r[0]?.c ?? 0);
  const total = approved + rejected;
  return total === 0 ? 0 : Math.round((approved / total) * 100);
}

export interface BusinessMetrics {
  /** Posts réellement générés par mois (12 derniers) — données réelles, jamais simulées. */
  postsByMonth: { month: string; count: number }[];
  approvalRate: number; // réel
  conversionRate: number; // réel — % de coachs sur un plan payant actif
  mrr: number; // réel — € mensuels estimés depuis les plans payants actifs
  activeCoaches: number; // réel — coachs ayant généré ≥ 1 fois
  heatmap: number[]; // réel — répartition horaire des générations
}

/**
 * Métriques business agrégées — 100 % RÉELLES (aucune valeur inventée).
 * Quand la base est vide, les compteurs valent 0 et l'UI affiche un état « en attente ».
 */
export async function getBusinessMetrics(): Promise<BusinessMetrics> {
  const [approvalRate, heatmap, monthRows, tenantRows, activeRows] = await Promise.all([
    getApprovalRate(),
    getGenerationHeatmap(),
    db.select({ month: generatedPosts.month, c: count() }).from(generatedPosts).groupBy(generatedPosts.month),
    db.select({ plan: tenants.plan, planExpiresAt: tenants.planExpiresAt }).from(tenants).limit(5000),
    db.select({ c: countDistinct(generatedPosts.tenantId) }).from(generatedPosts),
  ]);

  const postsByMonth = monthRows
    .filter((r) => r.month)
    .map((r) => ({ month: r.month, count: Number(r.c) }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

  const total = tenantRows.length;
  const paid = tenantRows.filter((t) => PLAN_PRICE[t.plan] && isPlanActive(t.plan, t.planExpiresAt)).length;
  const conversionRate = total > 0 ? Math.round((paid / total) * 100) : 0;
  const mrr = tenantRows
    .filter((t) => isPlanActive(t.plan, t.planExpiresAt))
    .reduce((s, t) => s + (PLAN_PRICE[t.plan] ?? 0), 0);
  const activeCoaches = Number(activeRows[0]?.c ?? 0);

  return { postsByMonth, approvalRate, conversionRate, mrr, activeCoaches, heatmap };
}

export async function setTicketStatus(adminUserId: string, ticketId: string, status: 'open' | 'closed'): Promise<void> {
  await db.update(supportTickets).set({ status }).where(and(eq(supportTickets.id, ticketId)));
  await logActivity(null, adminUserId, 'admin_ticket_status', ticketId, { status });
}

// ── Métriques de lancement (vue complète) ─────────────────────────────────────
// Sections : vue d'ensemble, contenu, site, profil, facturation, santé technique.
// Toutes les requêtes sont parallélisées (Promise.all) et le résultat est caché 5 min
// (unstable_cache) — ces chiffres n'ont pas besoin d'être temps réel.

export interface MetricItem {
  label: string;
  value: string;
  hint?: string;
}
export interface MetricSection {
  title: string;
  items: MetricItem[];
}
export interface LaunchMetrics {
  sections: MetricSection[];
  generatedAt: string;
}

/** Prix mensuel (€) par plan payant — pour l'estimation MRR. */
const PLAN_PRICE: Record<string, number> = { content_only: 39, pack_complet: 79 };

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
function toNum(v: unknown): number {
  return Number(v ?? 0);
}

async function computeLaunchMetrics(): Promise<LaunchMetrics> {
  const month = currentMonth(); // 'YYYY-MM'
  const monthStart = `${month}-01`; // comparaison lexicographique sûre sur des dates ISO

  const [
    tenantRows,
    websiteRows,
    postStatusRows,
    postModeRows,
    monthModeRows,
    variantsThisMonth,
    activeCoachRows,
    approvedTenantRows,
    withPhotos,
    withReviews,
    subStatusRows,
    canceledThisMonth,
    lastGenRow,
  ] = await Promise.all([
    // Petites tables → on lit les lignes et on agrège en mémoire (1 round-trip chacune).
    db.select({ plan: tenants.plan, status: tenants.status, createdAt: tenants.createdAt, planExpiresAt: tenants.planExpiresAt, paymentFailedAt: tenants.paymentFailedAt }).from(tenants).limit(5000),
    db.select({ tenantId: websites.tenantId, status: websites.status, template: websites.template }).from(websites).limit(5000),
    // Grosse table → agrégats GROUP BY.
    db.select({ status: generatedPosts.status, c: count() }).from(generatedPosts).groupBy(generatedPosts.status),
    db.select({ mode: generatedPosts.generatedMode, c: count() }).from(generatedPosts).groupBy(generatedPosts.generatedMode),
    db.select({ mode: generatedPosts.generatedMode, c: count() }).from(generatedPosts).where(eq(generatedPosts.month, month)).groupBy(generatedPosts.generatedMode),
    db.select({ c: count() }).from(generatedPosts).where(and(eq(generatedPosts.month, month), isNotNull(generatedPosts.variantOfId))),
    db.select({ c: countDistinct(generatedPosts.tenantId) }).from(generatedPosts),
    db.selectDistinct({ tenantId: generatedPosts.tenantId }).from(generatedPosts).where(eq(generatedPosts.status, 'approved')),
    db.select({ c: countDistinct(coachPhotos.tenantId) }).from(coachPhotos),
    db.select({ c: count() }).from(coachProfiles).where(isNotNull(coachProfiles.reviewsAnalysis)),
    db.select({ status: subscriptions.status, c: count() }).from(subscriptions).groupBy(subscriptions.status),
    db.select({ c: count() }).from(subscriptions).where(and(eq(subscriptions.status, 'canceled'), sql`${subscriptions.updatedAt} >= ${monthStart}`)),
    db.select({ last: max(activityLogs.createdAt) }).from(activityLogs).where(eq(activityLogs.action, 'content_generated')),
  ]);

  // ── Vue d'ensemble ──
  const totalCoaches = tenantRows.length;
  const coachesThisMonth = tenantRows.filter((t) => t.createdAt >= monthStart).length;
  const paidCoaches = tenantRows.filter((t) => PLAN_PRICE[t.plan] && isPlanActive(t.plan, t.planExpiresAt)).length;
  const activeCoaches = toNum(activeCoachRows[0]?.c);

  // ── Contenu ──
  const statusMap = new Map(postStatusRows.map((r) => [r.status, toNum(r.c)]));
  const approved = statusMap.get('approved') ?? 0;
  const rejected = statusMap.get('rejected') ?? 0;
  const totalPosts = [...statusMap.values()].reduce((a, b) => a + b, 0);
  const apiCount = toNum(postModeRows.find((r) => r.mode === 'api')?.c);
  const mockCount = toNum(postModeRows.find((r) => r.mode === 'mock')?.c);
  const monthApi = toNum(monthModeRows.find((r) => r.mode === 'api')?.c);
  const monthMock = toNum(monthModeRows.find((r) => r.mode === 'mock')?.c);
  const postsThisMonth = monthApi + monthMock + toNum(monthModeRows.find((r) => r.mode == null)?.c);

  // ── Site ──
  const sitesCreated = websiteRows.length;
  const sitesPublished = websiteRows.filter((w) => w.status === 'active').length;
  const templateCounts = new Map<string, number>();
  for (const w of websiteRows) templateCounts.set(w.template, (templateCounts.get(w.template) ?? 0) + 1);
  const templateLabel = [...templateCounts.entries()].map(([k, v]) => `${k} ${v}`).join(' · ') || '—';

  // ── Profil & engagement ──
  const activeSiteTenants = new Set(websiteRows.filter((w) => w.status === 'active').map((w) => w.tenantId));
  const approvedTenants = new Set(approvedTenantRows.map((r) => r.tenantId));
  const engaged = [...approvedTenants].filter((id) => activeSiteTenants.has(id)).length;

  // ── Facturation ──
  const planCounts = new Map<string, number>();
  for (const t of tenantRows) planCounts.set(t.plan, (planCounts.get(t.plan) ?? 0) + 1);
  const planLabel = (['pack_complet', 'content_only', 'starter'] as PlanId[])
    .filter((p) => planCounts.get(p))
    .map((p) => `${p} ${planCounts.get(p)}`)
    .join(' · ') || '—';
  const subMap = new Map(subStatusRows.map((r) => [r.status, toNum(r.c)]));
  const trial = subMap.get('trialing') ?? 0;
  // past_due : la vérité applicative est tenants.paymentFailedAt (posé par le webhook Stripe).
  const pastDue = tenantRows.filter((t) => t.paymentFailedAt).length || (subMap.get('past_due') ?? 0);
  const mrr = tenantRows
    .filter((t) => isPlanActive(t.plan, t.planExpiresAt))
    .reduce((sum, t) => sum + (PLAN_PRICE[t.plan] ?? 0), 0);

  // ── Santé technique ──
  const lastGen = lastGenRow[0]?.last ?? null;

  const sections: MetricSection[] = [
    {
      title: 'Vue d’ensemble',
      items: [
        { label: 'Coachs inscrits', value: String(totalCoaches) },
        { label: 'Inscrits ce mois', value: String(coachesThisMonth) },
        { label: 'Coachs actifs', value: String(activeCoaches), hint: 'ont généré ≥ 1 fois' },
        { label: 'Coachs payants', value: String(paidCoaches) },
        { label: 'Conversion → payant', value: `${pct(paidCoaches, totalCoaches)} %` },
      ],
    },
    {
      title: 'Contenu',
      items: [
        { label: 'Posts générés (total)', value: String(totalPosts) },
        { label: 'Posts ce mois', value: String(postsThisMonth) },
        { label: 'Mode IA vs mock', value: `${apiCount} / ${mockCount}`, hint: 'api / mock (total)' },
        { label: 'Posts approuvés', value: String(approved) },
        { label: 'Taux d’approbation', value: `${pct(approved, approved + rejected)} %` },
        { label: 'Variantes ce mois', value: String(toNum(variantsThisMonth[0]?.c)) },
      ],
    },
    {
      title: 'Site vitrine',
      items: [
        { label: 'Sites créés', value: String(sitesCreated) },
        { label: 'Sites publiés', value: String(sitesPublished) },
        { label: 'Taux de publication', value: `${pct(sitesPublished, sitesCreated)} %` },
        { label: 'Répartition styles', value: templateLabel },
      ],
    },
    {
      title: 'Profil & engagement',
      items: [
        { label: 'Coachs avec photos', value: String(toNum(withPhotos[0]?.c)) },
        { label: 'Coachs avec avis', value: String(toNum(withReviews[0]?.c)), hint: 'analyse d’avis clients' },
        { label: 'Coachs engagés', value: String(engaged), hint: 'site publié + posts approuvés' },
      ],
    },
    {
      title: 'Facturation',
      items: [
        { label: 'Répartition plans', value: planLabel },
        { label: 'En essai', value: String(trial) },
        { label: 'Paiement en échec', value: String(pastDue) },
        { label: 'Annulés ce mois', value: String(toNum(canceledThisMonth[0]?.c)) },
        { label: 'MRR estimé', value: `${mrr} €`, hint: 'plans payants actifs' },
      ],
    },
    {
      title: 'Santé technique',
      items: [
        { label: 'Taux fallback mock (mois)', value: `${pct(monthMock, monthApi + monthMock)} %` },
        { label: 'Dernière génération', value: lastGen ? new Date(lastGen).toLocaleString('fr-FR') : '—' },
      ],
    },
  ];

  return { sections, generatedAt: new Date().toISOString() };
}

/** Métriques de lancement, cachées 5 min (revalidate=300). */
export const getLaunchMetrics = unstable_cache(computeLaunchMetrics, ['admin-launch-metrics'], { revalidate: 300 });
