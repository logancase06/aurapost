import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { generateAndStoreSite } from '@/lib/db/coach-site';
import { canGenerateSite } from '@/lib/plans';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';
import { logError } from '@/lib/logger';

// La génération IA du site (retry + fallback) peut être longue → relève le timeout.
export const maxDuration = 60;

// Génère le contenu du site à partir de TOUTES les données réelles du coach (IA + retry + fallback).
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    if (!canGenerateSite(session.user.plan)) {
      return NextResponse.json({ error: 'Le site vitrine est inclus dans le Pack Complet.', upgrade: '/dashboard/billing' }, { status: 403 });
    }
    const tenantId = await requireTenantId();

    const rl = await checkAuthRateLimit(`sitegen:${tenantId}`, 10, 10 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: `Trop de générations. Réessayez dans ${rl.retryAfterSec}s.` }, { status: 429 });
    }

    const result = await generateAndStoreSite(tenantId, session.user.id);
    if (!result.ok) {
      return NextResponse.json({ error: 'Complétez d’abord votre profil coach.' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, site: result.site }, { status: 201 });
  } catch (err) {
    logError('[websites/generate]', { error: String(err) });
    return NextResponse.json({ error: 'La génération a échoué. Réessayez.' }, { status: 500 });
  }
}
