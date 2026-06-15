import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { runMonthlyGeneration } from '@/lib/db/posts';
import { isPlanActive } from '@/lib/plans';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';
import { sendMonthlyPostsEmail } from '@/lib/email';
import { db } from '@/lib/db';
import { users, tenants } from '@/lib/db/schema';
import { and, eq, or, isNull, lt } from 'drizzle-orm';
import { logError } from '@/lib/logger';

// Au-delà de ce délai, un verrou est considéré périmé (génération crashée).
const LOCK_STALE_MS = 5 * 60 * 1000;

// Génération des 12 posts en un appel Claude (~20-40 s en mode API) → relève le
// timeout par défaut de la fonction (~10 s sur Netlify/Vercel) pour éviter les 502.
export const maxDuration = 60;

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    if (!isPlanActive(session.user.plan, session.user.planExpiresAt)) {
      return NextResponse.json({ error: 'Abonnement expiré.', upgrade: '/dashboard/billing' }, { status: 403 });
    }
    const tenantId = await requireTenantId();

    // Garde-fou anti-abus (en plus de la limite métier 1/mois) : 5 appels / 10 min / tenant.
    const rl = await checkAuthRateLimit(`generate:${tenantId}`, 5, 10 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: `Trop de tentatives. Réessayez dans ${rl.retryAfterSec}s.` }, { status: 429 });
    }

    // Verrou anti double-soumission (2 onglets / double-clic) : pose generating_at
    // seulement s'il est libre ou périmé. Si 0 ligne affectée → génération en cours.
    const now = Date.now();
    const staleBefore = new Date(now - LOCK_STALE_MS).toISOString();
    const lock = await db
      .update(tenants)
      .set({ generatingAt: new Date(now).toISOString() })
      .where(and(eq(tenants.id, tenantId), or(isNull(tenants.generatingAt), lt(tenants.generatingAt, staleBefore))));
    if (((lock as { rowsAffected?: number }).rowsAffected ?? 0) === 0) {
      return NextResponse.json({ error: 'Génération déjà en cours.' }, { status: 429 });
    }

    let result: Awaited<ReturnType<typeof runMonthlyGeneration>>;
    try {
      result = await runMonthlyGeneration(tenantId, session.user.id);
    } finally {
      await db.update(tenants).set({ generatingAt: null }).where(eq(tenants.id, tenantId));
    }

    if (!result.ok) {
      const map = {
        no_profile: { msg: 'Complétez d’abord votre profil coach.', status: 400 },
        already_generated: { msg: 'Vous avez déjà généré votre contenu ce mois-ci.', status: 409 },
        internal: { msg: 'La génération a échoué. Réessayez.', status: 500 },
      } as const;
      const e = map[result.error];
      return NextResponse.json({ error: e.msg }, { status: e.status });
    }

    // Email « vos posts du mois sont prêts » — fire-and-forget.
    (async () => {
      const [u] = await db
        .select({ email: users.email, fullName: users.fullName })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);
      if (u) await sendMonthlyPostsEmail({ email: u.email, name: u.fullName }, result.count, result.month);
    })().catch((err) => logError('[generate] email mensuel', { error: String(err) }));

    return NextResponse.json({ ok: true, count: result.count, month: result.month }, { status: 201 });
  } catch (err) {
    logError('[generate] erreur interne', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
