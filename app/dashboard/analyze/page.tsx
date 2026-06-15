import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getRecentAnalyses, getAnalyzeContext } from '@/lib/db/analyses';
import DashboardShell from '../DashboardShell';
import AnalyzeClient from './AnalyzeClient';
import type { InstagramAnalysis, LinkedInAnalysis } from '@/lib/analyze/types';

export const metadata = { title: 'Analyse de ta présence' };
export const dynamic = 'force-dynamic';

export default async function AnalyzePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;

  const [ig, li, ctx] = await Promise.all([
    getRecentAnalyses(tenantId, 'instagram', 3),
    getRecentAnalyses(tenantId, 'linkedin', 3),
    getAnalyzeContext(tenantId),
  ]);

  return (
    <DashboardShell active="/dashboard/analyze">
      <h1 className="text-2xl font-bold">Analyse de ta présence en ligne</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Obtiens un score et des recommandations concrètes pour Instagram &amp; LinkedIn.
      </p>
      <AnalyzeClient
        instagramUrl={ctx?.instagramUrl ?? ''}
        initialInstagram={(ig[0]?.analysis as InstagramAnalysis) ?? null}
        instagramHistory={ig.map((a) => ({ score: a.scoreGlobal ?? 0, date: a.createdAt }))}
        initialLinkedIn={(li[0]?.analysis as LinkedInAnalysis) ?? null}
        linkedinHistory={li.map((a) => ({ score: a.scoreGlobal ?? 0, date: a.createdAt }))}
      />
    </DashboardShell>
  );
}
