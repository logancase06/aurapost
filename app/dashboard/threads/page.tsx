import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { coachProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getPlanLimits } from '@/lib/plans';
import DashboardShell from '@/app/dashboard/DashboardShell';
import ThreadsClient from './ThreadsClient';

export const metadata = { title: 'Fil Twitter/X — AuraPost' };
export const maxDuration = 60;

export default async function ThreadsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId ?? '';
  const limits = getPlanLimits(session.user.plan);
  let hasProfile = false;
  try {
    const [p] = await db.select({ id: coachProfiles.id }).from(coachProfiles).where(eq(coachProfiles.tenantId, tenantId)).limit(1);
    hasProfile = !!p;
  } catch {}
  return (
    <DashboardShell active="/dashboard/threads">
      <ThreadsClient canExport={limits.exportEnabled} hasProfile={hasProfile} />
    </DashboardShell>
  );
}
