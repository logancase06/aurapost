import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getPlanLimits } from '@/lib/plans';
import ThreadsClient from './ThreadsClient';

export const metadata = { title: 'Fil Twitter/X — AuraPost' };
export const maxDuration = 60;

export default async function ThreadsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const limits = getPlanLimits(session.user.plan);
  return <ThreadsClient canExport={limits.exportEnabled} />;
}
