import { db } from './index';
import { coachProfiles, generatedPosts, websites, tenants, users } from './schema';
import { and, eq, isNull, lt, sql } from 'drizzle-orm';

export interface OnboardingProgress {
  profile: boolean; // profil coach rempli
  generation: boolean; // au moins un lot de posts généré
  site: boolean; // site loué actif
  subscription: boolean; // plan payant actif
  completedCount: number;
  total: number;
  complete: boolean;
}

/**
 * Calcule l'avancement du parcours d'onboarding (4 étapes).
 */
export async function getOnboardingProgress(tenantId: string): Promise<OnboardingProgress> {
  const [[prof], [posts], [site], [tenant]] = await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(coachProfiles).where(eq(coachProfiles.tenantId, tenantId)),
    db
      .select({ c: sql<number>`count(*)` })
      .from(generatedPosts)
      .where(and(eq(generatedPosts.tenantId, tenantId), isNull(generatedPosts.variantOfId))),
    db
      .select({ c: sql<number>`count(*)` })
      .from(websites)
      .where(and(eq(websites.tenantId, tenantId), eq(websites.status, 'active'))),
    db.select({ plan: tenants.plan }).from(tenants).where(eq(tenants.id, tenantId)).limit(1),
  ]);

  const profile = Number(prof?.c ?? 0) > 0;
  const generation = Number(posts?.c ?? 0) > 0;
  const hasSite = Number(site?.c ?? 0) > 0;
  const subscription = !!tenant?.plan && tenant.plan !== 'starter';

  const steps = [profile, generation, hasSite, subscription];
  const completedCount = steps.filter(Boolean).length;

  return {
    profile,
    generation,
    site: hasSite,
    subscription,
    completedCount,
    total: 4,
    complete: completedCount === 4,
  };
}

/** Utilisateurs à relancer : non onboardés, inscrits il y a +24h. (cron) */
export async function usersToRemind(): Promise<{ id: string; email: string; fullName: string; tenantId: string }[]> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const rows = await db
    .select({ id: users.id, email: users.email, fullName: users.fullName, tenantId: users.tenantId })
    .from(users)
    .where(and(eq(users.onboardingCompleted, false), lt(users.createdAt, cutoff)))
    .limit(200);
  return rows;
}
