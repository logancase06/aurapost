import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { getRecentAnalyses } from '@/lib/db/analyses';

export const dynamic = 'force-dynamic';

/** GET /api/analyze/history — 3 dernières analyses par plateforme. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  let tenantId: string;
  try {
    tenantId = await requireTenantId();
  } catch {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  const [instagram, linkedin] = await Promise.all([
    getRecentAnalyses(tenantId, 'instagram', 3),
    getRecentAnalyses(tenantId, 'linkedin', 3),
  ]);
  return NextResponse.json({ ok: true, instagram, linkedin });
}
