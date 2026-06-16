import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { getJob } from '@/lib/generation-jobs';

export const dynamic = 'force-dynamic';

/** GET /api/generate/[jobId] — état d'un job de génération (polling côté client). */
export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  let tenantId: string;
  try {
    tenantId = await requireTenantId();
  } catch {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  const { jobId } = await params;
  const job = await getJob(jobId, tenantId);
  if (!job) return NextResponse.json({ error: 'Job introuvable' }, { status: 404 });

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    total: job.total,
    posts: job.posts,
    error: job.error,
    completedAt: job.completedAt,
  });
}
