import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { analyzeReviews } from '@/lib/reviews';
import { saveReviews } from '@/lib/db/coach-site';
import { logError } from '@/lib/logger';

// Analyse des avis collés par le coach (texte libre) via le SDK Claude Code.
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const tenantId = await requireTenantId();

    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (text.length < 20) {
      return NextResponse.json({ error: 'Collez au moins quelques avis (20 caractères min).' }, { status: 400 });
    }

    const analysis = await analyzeReviews(text);
    await saveReviews(tenantId, text, analysis);
    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    logError('[onboarding/site/reviews]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
