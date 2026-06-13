import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { runMonthlyGeneration } from '@/lib/db/posts';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';
import { sendMonthlyPostsEmail } from '@/lib/email';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logError } from '@/lib/logger';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const tenantId = await requireTenantId();

    // Garde-fou anti-abus (en plus de la limite métier 1/mois) : 5 appels / 10 min / tenant.
    const rl = await checkAuthRateLimit(`generate:${tenantId}`, 5, 10 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: `Trop de tentatives. Réessayez dans ${rl.retryAfterSec}s.` }, { status: 429 });
    }

    const result = await runMonthlyGeneration(tenantId, session.user.id);

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
