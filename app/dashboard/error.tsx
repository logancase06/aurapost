'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Error boundary du segment dashboard — isole les pannes du tableau de bord. */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[dashboard:error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h1 className="mt-6 text-xl font-black uppercase tracking-tight">Cette section a planté</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Le reste de votre tableau de bord reste accessible. Réessayez cette vue.
      </p>
      <Button onClick={reset} variant="gradient" className="mt-6">
        Réessayer
      </Button>
    </div>
  );
}
