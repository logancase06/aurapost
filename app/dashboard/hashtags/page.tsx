import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import DashboardShell from '@/app/dashboard/DashboardShell';
import HashtagsClient from './HashtagsClient';

export const metadata = { title: 'Hashtags — AuraPost' };
export const maxDuration = 60;

export default async function HashtagsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  return (
    <DashboardShell active="/dashboard/hashtags">
      <HashtagsClient />
    </DashboardShell>
  );
}
