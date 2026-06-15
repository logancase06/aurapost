import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { stripe } from '@/lib/stripe';
import { getSubscription } from '@/lib/db/subscription';
import { logError } from '@/lib/logger';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// Portail client Stripe : gestion CB, factures, annulation.
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const tenantId = await requireTenantId();

    if (!stripe) {
      return NextResponse.json({ error: 'Le portail de facturation n’est pas encore activé.' }, { status: 503 });
    }
    const sub = await getSubscription(tenantId);
    if (!sub?.stripeCustomerId) {
      return NextResponse.json({ error: 'Aucun abonnement actif à gérer.' }, { status: 400 });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${APP_URL}/dashboard/billing`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    logError('[stripe/portal]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
