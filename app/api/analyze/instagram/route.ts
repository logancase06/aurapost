import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { csrfGuard } from '@/lib/security';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';
import { analyzeInstagramProfile } from '@/lib/analyze/instagram';
import { getAnalyzeContext, saveAnalysis, setLastRecommendation } from '@/lib/db/analyses';
import { logError } from '@/lib/logger';

export const maxDuration = 45;
export const dynamic = 'force-dynamic';

const Schema = z.object({
  profileUrl: z.string().max(300).optional().or(z.literal('')),
  manualCaptions: z.array(z.string().max(2200)).max(6).optional(),
});

export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  let tenantId: string;
  try {
    tenantId = await requireTenantId();
  } catch {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  const rl = await checkAuthRateLimit(`analyze:ig:${tenantId}`, 3, 24 * 60 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: 'Limite de 3 analyses Instagram par jour atteinte.' }, { status: 429 });

  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });

  const ctx = await getAnalyzeContext(tenantId);
  const url = parsed.data.profileUrl?.trim() || ctx?.instagramUrl || undefined;

  try {
    const res = await analyzeInstagramProfile({
      url,
      manualCaptions: parsed.data.manualCaptions,
      ctx: ctx ? { displayName: ctx.displayName, speciality: ctx.speciality, city: ctx.city } : undefined,
    });
    if (!res.ok) return NextResponse.json({ error: res.message, reason: res.reason }, { status: res.reason === 'private' ? 422 : 400 });
    await saveAnalysis(tenantId, 'instagram', res.analysis.score_global, res.analysis, url ?? null);
    if (res.analysis.prochaine_action) await setLastRecommendation(tenantId, res.analysis.prochaine_action);
    return NextResponse.json({ ok: true, analysis: res.analysis, source: res.source });
  } catch (err) {
    logError('[analyze/instagram] erreur', { error: String(err) });
    return NextResponse.json({ error: 'Analyse impossible. Réessayez.' }, { status: 500 });
  }
}
