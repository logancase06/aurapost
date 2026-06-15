import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { csrfGuard, sanitizeText } from '@/lib/security';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';
import { analyzeLinkedInProfile } from '@/lib/analyze/linkedin';
import { getAnalyzeContext, saveAnalysis, setLastRecommendation } from '@/lib/db/analyses';
import { logError } from '@/lib/logger';

export const maxDuration = 45;
export const dynamic = 'force-dynamic';

// LinkedIn = saisie manuelle (CGU : pas de scraping). Le coach colle titre/résumé/posts.
const Schema = z.object({
  headline: z.string().max(400).optional().or(z.literal('')),
  summary: z.string().max(4000).optional().or(z.literal('')),
  posts: z.array(z.string().max(4000)).max(5).optional(),
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

  const rl = await checkAuthRateLimit(`analyze:li:${tenantId}`, 3, 24 * 60 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: 'Limite de 3 analyses LinkedIn par jour atteinte.' }, { status: 429 });

  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });

  const ctx = await getAnalyzeContext(tenantId);
  try {
    const res = await analyzeLinkedInProfile({
      headline: sanitizeText(parsed.data.headline ?? ''),
      summary: parsed.data.summary ? sanitizeText(parsed.data.summary) : undefined,
      posts: parsed.data.posts?.map((p) => sanitizeText(p)).filter(Boolean),
      ctx: ctx ? { displayName: ctx.displayName, speciality: ctx.speciality, city: ctx.city } : undefined,
    });
    if (!res.ok) return NextResponse.json({ error: res.message, reason: res.reason }, { status: 400 });
    await saveAnalysis(tenantId, 'linkedin', res.analysis.score_global, res.analysis, null);
    if (res.analysis.prochaine_action) await setLastRecommendation(tenantId, res.analysis.prochaine_action);
    return NextResponse.json({ ok: true, analysis: res.analysis, source: res.source });
  } catch (err) {
    logError('[analyze/linkedin] erreur', { error: String(err) });
    return NextResponse.json({ error: 'Analyse impossible. Réessayez.' }, { status: 500 });
  }
}
