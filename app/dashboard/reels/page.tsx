import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { canExportPost } from '@/lib/plans';
import DashboardShell from '@/app/dashboard/DashboardShell';
import ReelsClient from './ReelsClient';

export const metadata = { title: 'Script Reels' };
export const maxDuration = 60;

export default async function ReelsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const canExport = canExportPost(session.user.plan ?? 'starter');
  return (
    <DashboardShell active="/dashboard/reels">
      <ReelsClient canExport={canExport} />
    </DashboardShell>
  );
}
