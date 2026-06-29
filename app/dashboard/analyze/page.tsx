import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import DashboardShell from '../DashboardShell';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const metadata = { title: 'Analyse de ta presence' };
export const dynamic = 'force-dynamic';

export default async function AnalyzePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return (
    <DashboardShell active="/dashboard/analyze">
      <h1 className="text-2xl font-bold">Analyse de ta presence en ligne</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Score et recommandations pour Instagram &amp; LinkedIn.
      </p>

      <Card className="mt-8 flex flex-col items-center gap-4 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="text-lg font-bold">Bientot disponible</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cette fonctionnalite est en cours de finalisation.<br />
            Elle sera disponible a la sortie de la beta.
          </p>
        </div>
      </Card>
    </DashboardShell>
  );
}
