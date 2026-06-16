import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getOrgForTenant, getBrandKit } from '@/lib/db/organizations';
import { listPendingApprovals } from '@/lib/db/approvals';
import { mergeForbidden } from '@/lib/compliance';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import DashboardShell from '../../DashboardShell';
import ApprovalsClient from './ApprovalsClient';

export const metadata = { title: 'Validation des posts' };
export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;
  const m = await getOrgForTenant(tenantId);
  if (!m || m.role !== 'owner') redirect('/dashboard/org');

  const [posts, kit] = await Promise.all([listPendingApprovals(m.org.id), getBrandKit(m.org.id)]);
  const forbidden = mergeForbidden(kit?.forbiddenWords);

  return (
    <DashboardShell active="/dashboard/org">
      <Link href="/dashboard/org" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {m.org.name}
      </Link>
      <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold"><ShieldCheck className="h-6 w-6 text-primary" /> Validation des posts</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {posts.length > 0 ? `${posts.length} post(s) en attente de votre validation.` : 'Les posts des distributeurs apparaissent ici avant publication.'}
      </p>
      <ApprovalsClient posts={posts} forbidden={forbidden} />
    </DashboardShell>
  );
}
