import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { getPlan, FREE_TRIAL_DAYS } from '@/lib/plans';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';
import { logError } from '@/lib/logger';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const tenantId = session.user.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Session invalide' }, { status: 401 });

    // Cette route est exclue du rate-limit global du proxy (passthrough) → limite dédiée
    // par tenant pour éviter la création en masse de sessions de paiement.
    const rl = await checkAuthRateLimit(`checkout:${tenantId}`, 10, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const plan = getPlan(body?.plan);
    if (!plan || plan.id === 'starter') {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    // Sélection du Price ID : annuel si demandé ET disponible, sinon mensuel.
    const wantsAnnual = body?.annual === true;
    const priceId = wantsAnnual && plan.annualPriceId ? plan.annualPriceId : plan.priceId;

    // Mock propre : Stripe non configuré → on renvoie un message clair (pas d'erreur 500).
    if (!stripe || !priceId) {
      return NextResponse.json(
        { mocked: true, message: "Le paiement n'est pas encore activé. Configuration Stripe à venir." },
        { status: 200 }
      );
    }

    const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, session.user.id)).limit(1);

    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: u?.email,
      success_url: `${APP_URL}/dashboard/billing/success?plan=${plan.id}`,
      cancel_url: `${APP_URL}/dashboard/billing?canceled=1`,
      // Essai gratuit 14 jours (cohérent avec FREE_TRIAL_LABEL affiché partout).
      subscription_data: { trial_period_days: FREE_TRIAL_DAYS, metadata: { tenantId, plan: plan.id, billing: wantsAnnual ? 'annual' : 'monthly' } },
      metadata: { tenantId, plan: plan.id },
    });

    return NextResponse.json({ url: checkout.url }, { status: 200 });
  } catch (err) {
    logError('[create-checkout] erreur', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
