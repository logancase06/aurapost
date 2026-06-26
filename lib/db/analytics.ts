import { db } from './index';
import { generatedPosts, coachProfiles, siteVisits } from './schema';
import { and, eq, gte, sql } from 'drizzle-orm';

export interface CoachAnalytics {
  total: number;
  approved: number;
  rejected: number;
  approvalRate: number; // 0–100
  byTheme: { theme: string; count: number; approved: number }[];
  byMonth: { month: string; count: number }[];
  suggestion: string | null;
}

export async function getCoachAnalytics(tenantId: string): Promise<CoachAnalytics> {
  const rows = await db
    .select({ status: generatedPosts.status, theme: generatedPosts.theme, month: generatedPosts.month })
    .from(generatedPosts)
    .where(eq(generatedPosts.tenantId, tenantId));

  let approved = 0;
  let rejected = 0;
  const themeMap = new Map<string, { count: number; approved: number }>();
  const monthMap = new Map<string, number>();

  for (const r of rows) {
    if (r.status === 'approved') approved++;
    else if (r.status === 'rejected') rejected++;

    const theme = r.theme || 'général';
    const t = themeMap.get(theme) ?? { count: 0, approved: 0 };
    t.count++;
    if (r.status === 'approved') t.approved++;
    themeMap.set(theme, t);

    if (r.month) monthMap.set(r.month, (monthMap.get(r.month) ?? 0) + 1);
  }

  const total = rows.length;
  const decided = approved + rejected;
  const approvalRate = decided > 0 ? Math.round((approved / decided) * 100) : 0;

  const byTheme = Array.from(themeMap.entries())
    .map(([theme, v]) => ({ theme, count: v.count, approved: v.approved }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const byMonth = Array.from(monthMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Suggestion : thème le plus approuvé.
  const bestTheme = [...themeMap.entries()].sort((a, b) => b[1].approved - a[1].approved)[0];
  const [tone] = await db
    .select({ tone: coachProfiles.tone })
    .from(coachProfiles)
    .where(eq(coachProfiles.tenantId, tenantId))
    .limit(1);

  let suggestion: string | null = null;
  if (bestTheme && bestTheme[1].approved > 0) {
    suggestion = `Vos posts « ${bestTheme[0]} » sont les plus approuvés. On en génère davantage le mois prochain ?`;
  } else if (tone?.tone) {
    suggestion = `Vous utilisez le ton « ${tone.tone} ». Essayez une variante d'un autre ton pour diversifier.`;
  }

  return { total, approved, rejected, approvalRate, byTheme, byMonth, suggestion };
}

export interface SiteVisitStats {
  totalVisits: number;
  last30Days: number;
  byDay: { day: string; count: number }[];          // 30 derniers jours, format YYYY-MM-DD
  byDevice: { device: string; count: number }[];
  byCountry: { country: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
}

/**
 * Stats de visite pour le site vitrine d'un tenant.
 * Données agrégées uniquement — aucune donnée personnelle dans la réponse.
 */
export async function getSiteVisitStats(tenantId: string): Promise<SiteVisitStats> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(siteVisits)
    .where(eq(siteVisits.tenantId, tenantId));

  const [last30Row] = await db
    .select({ c: sql<number>`count(*)` })
    .from(siteVisits)
    .where(and(eq(siteVisits.tenantId, tenantId), gte(siteVisits.visitedAt, thirtyDaysAgo)));

  const rawDays = await db
    .select({
      day: sql<string>`strftime('%Y-%m-%d', datetime(visited_at, 'unixepoch'))`,
      count: sql<number>`count(*)`,
    })
    .from(siteVisits)
    .where(and(eq(siteVisits.tenantId, tenantId), gte(siteVisits.visitedAt, thirtyDaysAgo)))
    .groupBy(sql`strftime('%Y-%m-%d', datetime(visited_at, 'unixepoch'))`)
    .orderBy(sql`1`);

  const rawDevices = await db
    .select({ device: siteVisits.device, count: sql<number>`count(*)` })
    .from(siteVisits)
    .where(eq(siteVisits.tenantId, tenantId))
    .groupBy(siteVisits.device)
    .orderBy(sql`count(*) desc`)
    .limit(5);

  const rawCountries = await db
    .select({ country: siteVisits.country, count: sql<number>`count(*)` })
    .from(siteVisits)
    .where(eq(siteVisits.tenantId, tenantId))
    .groupBy(siteVisits.country)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  const rawReferrers = await db
    .select({ referrer: siteVisits.referrer, count: sql<number>`count(*)` })
    .from(siteVisits)
    .where(and(eq(siteVisits.tenantId, tenantId), sql`referrer IS NOT NULL`))
    .groupBy(siteVisits.referrer)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  return {
    totalVisits: Number(totalRow?.c ?? 0),
    last30Days: Number(last30Row?.c ?? 0),
    byDay: rawDays.map((r) => ({ day: r.day, count: Number(r.count) })),
    byDevice: rawDevices.map((r) => ({ device: r.device ?? 'inconnu', count: Number(r.count) })),
    byCountry: rawCountries.map((r) => ({ country: r.country ?? '??', count: Number(r.count) })),
    topReferrers: rawReferrers.map((r) => ({ referrer: r.referrer ?? '', count: Number(r.count) })),
  };
}

/** Nombre de posts en attente d'approbation (badge). */
export async function pendingApprovalCount(tenantId: string): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`count(*)` })
    .from(generatedPosts)
    .where(and(eq(generatedPosts.tenantId, tenantId), eq(generatedPosts.status, 'draft')));
  return Number(row?.c ?? 0);
}
