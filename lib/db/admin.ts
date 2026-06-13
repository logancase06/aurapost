import { db } from './index';
import { tenants, users, coachProfiles, generatedPosts, subscriptions } from './schema';
import { eq, sql, desc } from 'drizzle-orm';
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
