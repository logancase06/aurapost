import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { auth } from '@/lib/auth';
import { canGenerateSite } from '@/lib/plans';
import { DEMO_SITES } from '@/lib/explore/sites';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardShell from '../../DashboardShell';
import ExploreClient from './ExploreClient';

export const metadata = { title: 'Explorer des styles' };

export default async function ExplorePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // Réservé au Pack Complet (cohérent avec la page « Mon site ») — écran d'upgrade sinon.
  if (!canGenerateSite(session.user.plan)) {
    return (
      <DashboardShell active="/dashboard/website/explore">
        <Card className="mx-auto mt-10 max-w-lg border-primary/30 bg-primary/5 p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-4 text-xl font-bold">L’explorateur de sites est dans le Pack Complet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Parcours 10 exemples de sites de coachs, choisis ton style, et laisse l’IA personnaliser le tien.
          </p>
          <Button asChild variant="gradient" className="mt-5">
            <Link href="/dashboard/billing">Passer au Pack Complet →</Link>
          </Button>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell active="/dashboard/website/explore">
      <ExploreClient sites={DEMO_SITES} />
    </DashboardShell>
  );
}
