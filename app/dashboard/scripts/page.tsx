import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import DashboardShell from '@/app/dashboard/DashboardShell';
import ScriptsClient from './ScriptsClient';

export const metadata = { title: 'Scripts video — AuraPost' };
export const maxDuration = 60;

export default async function ScriptsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  return (
    <DashboardShell active="/dashboard/scripts">
      <ScriptsClient />
    </DashboardShell>
  );
}
