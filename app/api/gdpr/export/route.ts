import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { db } from '@/lib/db';
import {
  users, coachProfiles, generatedPosts, websites, subscriptions,
  referrals, referralCodes, notifications, activityLogs,
} from '@/lib/db/schema';
import { logActivity } from '@/lib/db/activity';
import { logUnauthorized } from '@/lib/security';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gdpr/export — export RGPD : toutes les données du coach en JSON téléchargeable.
 * Scellé au tenant courant (jamais les données d'un autre coach).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    logUnauthorized('session manquante', { path: '/api/gdpr/export' });
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const tenantId = await requireTenantId();

  const [user, profile, posts, sites, subs, refs, refCodes, notifs, logs] = await Promise.all([
    db.select().from(users).where(eq(users.id, session.user.id)),
    db.select().from(coachProfiles).where(eq(coachProfiles.tenantId, tenantId)),
    db.select().from(generatedPosts).where(eq(generatedPosts.tenantId, tenantId)),
    db.select().from(websites).where(eq(websites.tenantId, tenantId)),
    db.select().from(subscriptions).where(eq(subscriptions.tenantId, tenantId)),
    db.select().from(referrals).where(eq(referrals.referrerTenantId, tenantId)),
    db.select().from(referralCodes).where(eq(referralCodes.tenantId, tenantId)),
    db.select().from(notifications).where(eq(notifications.tenantId, tenantId)),
    db.select().from(activityLogs).where(eq(activityLogs.tenantId, tenantId)),
  ]);

  // On retire les hash de mot de passe de l'export.
  const safeUser = user.map(({ passwordHash, ...rest }) => rest);

  await logActivity(tenantId, session.user.id, 'gdpr_export', null, {});

  const payload = {
    exportedAt: new Date().toISOString(),
    tenantId,
    account: safeUser,
    coachProfile: profile,
    posts,
    websites: sites,
    subscriptions: subs,
    referrals: refs,
    referralCodes: refCodes,
    notifications: notifs,
    activityLogs: logs,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="aurapost-donnees-${tenantId}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
