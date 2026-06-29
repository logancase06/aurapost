import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getPlanLimits } from '@/lib/plans';
import DashboardShell from '@/app/dashboard/DashboardShell';
import CarouselsClient from './CarouselsClient';

export const metadata = { title: 'Carrousels — AuraPost' };
export const maxDuration = 60;

export default async function CarouselsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const limits = getPlanLimits(session.user.plan);
  return (
    <DashboardShell active="/dashboard/carousels">
      <CarouselsClient canGenerate={limits.socialPublishEnabled} />
    </DashboardShell>
  );
}
