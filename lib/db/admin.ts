import { db } from './index';
import { tenants, users, coachProfiles, generatedPosts, subscriptions, supportTickets, activityLogs } from './schema';
import { and, eq, sql, desc } from 'drizzle-orm';
import { currentMonth } from '@/lib/utils';
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
  mrrSeries: { month: string; mrr: number }[];
  approvalRate: number;
  demoConversion: number; // % (simulé)
  nps: number; // simulé
  heatmap: number[];
}

/** Métriques business agrégées (MRR seedé, conversion/NPS simulés, reste réel). */
export async function getBusinessMetrics(): Promise<BusinessMetrics> {
  const [approvalRate, heatmap, [{ c: activeSubs } = { c: 0 }]] = await Promise.all([
    getApprovalRate(),
    getGenerationHeatmap(),
    db.select({ c: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.status, 'active')),
  ]);

  // Série MRR simulée et croissante (12 mois), ancrée sur le nb d'abonnements actifs.
  const months = ['Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
  const anchor = Math.max(8, Number(activeSubs) || 0);
  const mrrSeries = months.map((month, i) => ({
    month,
    mrr: Math.round((anchor * 39 * (i + 1)) / 4 + (i % 3) * 120),
  }));

  return { mrrSeries, approvalRate, demoConversion: 32, nps: 58, heatmap };
}

export async function setTicketStatus(adminUserId: string, ticketId: string, status: 'open' | 'closed'): Promise<void> {
  await db.update(supportTickets).set({ status }).where(and(eq(supportTickets.id, ticketId)));
  await logActivity(null, adminUserId, 'admin_ticket_status', ticketId, { status });
}
