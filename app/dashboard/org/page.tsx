import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getOrgForTenant, listOrgMembersWithStats, getBrandKit, listOrgTemplates } from '@/lib/db/organizations';
import { Card } from '@/components/ui/card';
import DashboardShell from '../DashboardShell';
import CreateOrgForm from './CreateOrgForm';
import OrgManager from './OrgManager';

export const metadata = { title: 'Mon organisation' };

export default async function OrgPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;

  const membership = await getOrgForTenant(tenantId);

  if (!membership) {
    return (
      <DashboardShell active="/dashboard/org">
        <h1 className="text-2xl font-bold">Organisation</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gérez un réseau de distributeurs avec une charte commune.</p>
        <CreateOrgForm />
      </DashboardShell>
    );
  }

  if (membership.role !== 'owner') {
    return (
      <DashboardShell active="/dashboard/org">
        <h1 className="text-2xl font-bold">Organisation</h1>
        <Card className="mt-6 p-6">
          <p className="text-sm">
            Vous faites partie de <strong>{membership.org.name}</strong>. Votre contenu suit la charte du réseau.
          </p>
        </Card>
      </DashboardShell>
    );
  }

  const [members, brandKit, templates] = await Promise.all([
    listOrgMembersWithStats(membership.org.id),
    getBrandKit(membership.org.id),
    listOrgTemplates(membership.org.id),
  ]);

  return (
    <DashboardShell active="/dashboard/org">
      <OrgManager orgName={membership.org.name} members={members} brandKit={brandKit} templates={templates} />
    </DashboardShell>
  );
}
