import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getAnalyzeContext, getLatestAnalysis, getRecentAnalyses } from '@/lib/db/analyses';
import type { InstagramAnalysis, LinkedInAnalysis } from '@/lib/analyze/types';
import DashboardShell from '../DashboardShell';
import AnalyzeClient from './AnalyzeClient';

export const metadata = { title: 'Analyse de ta presence en ligne' };
export const dynamic = 'force-dynamic';

export default async function AnalyzePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId ?? '';

  let ctx: Awaited<ReturnType<typeof getAnalyzeContext>> = null;
  let igLatest: Awaited<ReturnType<typeof getLatestAnalysis>> = null;
  let liLatest: Awaited<ReturnType<typeof getLatestAnalysis>> = null;
  let igHistory: Awaited<ReturnType<typeof getRecentAnalyses>> = [];
  let liHistory: Awaited<ReturnType<typeof getRecentAnalyses>> = [];

  try {
    [ctx, igLatest, liLatest, igHistory, liHistory] = await Promise.all([
      getAnalyzeContext(tenantId),
      getLatestAnalysis(tenantId, 'instagram'),
      getLatestAnalysis(tenantId, 'linkedin'),
      getRecentAnalyses(tenantId, 'instagram', 3),
      getRecentAnalyses(tenantId, 'linkedin', 3),
    ]);
  } catch {
    // DB indisponible ou tables manquantes : render avec donnees vides
  }

  return (
    <DashboardShell active="/dashboard/analyze">
      <AnalyzeClient
        instagramUrl={ctx?.instagramUrl ?? ''}
        initialInstagram={(igLatest?.analysis ?? null) as InstagramAnalysis | null}
        instagramHistory={igHistory
          .filter((a) => a.scoreGlobal !== null)
          .map((a) => ({ score: a.scoreGlobal as number, date: a.createdAt }))}
        initialLinkedIn={(liLatest?.analysis ?? null) as LinkedInAnalysis | null}
        linkedinHistory={liHistory
          .filter((a) => a.scoreGlobal !== null)
          .map((a) => ({ score: a.scoreGlobal as number, date: a.createdAt }))}
      />
    </DashboardShell>
  );
}
