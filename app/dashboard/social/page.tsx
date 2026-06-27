// Z-2.5 — Page "Mes réseaux" : gestion des connexions sociales Zernio.
// Server Component — charge les connexions actives et passe au Client Panel.

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { getPlanLimits, MAX_SOCIAL_ACCOUNTS } from '@/lib/plans';
import { getConnectionsByTenant } from '@/lib/db/social-connections';
import { Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardShell from '../DashboardShell';
import ConnectNetworksPanel from '@/components/social/ConnectNetworksPanel';

export const metadata = { title: 'Mes réseaux' };

export default async function SocialPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;

  const limits = getPlanLimits(session.user.plan);

  // Gating : socialPublishEnabled réservé au pack_complet.
  if (!limits.socialPublishEnabled) {
    return (
      <DashboardShell active="/dashboard/social">
        <Card className="mx-auto mt-10 max-w-lg border-primary/30 bg-primary/5 p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-4 text-xl font-bold">Publication sociale dans le Pack Complet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connecte LinkedIn et Instagram depuis AuraPost et publie tes posts en un clic — sans quitter l'app.
          </p>
          <Button asChild variant="gradient" className="mt-5">
            <Link href="/dashboard/billing">Passer au Pack Complet →</Link>
          </Button>
        </Card>
      </DashboardShell>
    );
  }

  const connections = await getConnectionsByTenant(tenantId);

  // Serialize les données pour le Client Component (évite de passer des objets Drizzle non sérialisables).
  const serializedConnections = connections.map((c) => ({
    id: c.id,
    platform: c.platform as 'linkedin' | 'instagram',
    accountName: c.accountName,
    accountAvatar: c.accountAvatar,
    connectedAt: c.connectedAt,
  }));

  const { success, error } = await searchParams;

  return (
    <DashboardShell active="/dashboard/social">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mes réseaux</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connecte tes comptes LinkedIn et Instagram pour publier directement depuis AuraPost.
        </p>
      </div>

      <ConnectNetworksPanel
        initialConnections={serializedConnections}
        maxAccounts={MAX_SOCIAL_ACCOUNTS}
        successParam={success}
        errorParam={error}
      />
    </DashboardShell>
  );
}
