import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import DashboardShell from '../../DashboardShell';
import BillingSuccessClient from './BillingSuccessClient';

export const metadata = { title: 'Abonnement active !' };
export const dynamic = 'force-dynamic';

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const params = await searchParams;
  const plan = params.plan ?? session.user.plan ?? 'content_only';

  return (
    <DashboardShell active="/dashboard/billing">
      <BillingSuccessClient plan={plan} />
    </DashboardShell>
  );
}
