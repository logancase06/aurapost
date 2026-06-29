import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getPlanLimits } from '@/lib/plans';
import DashboardShell from '@/app/dashboard/DashboardShell';
import SubtitlesClient from './SubtitlesClient';

export const metadata = { title: 'Sous-titres — AuraPost' };

export default async function SubtitlesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const limits = getPlanLimits(session.user.plan);
  return (
    <DashboardShell active="/dashboard/subtitles">
      <SubtitlesClient canTranscribe={limits.exportEnabled} />
    </DashboardShell>
  );
}
