'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorArt } from '@/components/ErrorArt';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app:error]', error);
  }, [error]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="aura-glow absolute inset-0" aria-hidden />
      <div className="relative z-10 flex flex-col items-center">
        <ErrorArt code="500" />
        <h1 className="mt-8 text-2xl font-bold">Une erreur est survenue</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">Nous sommes désolés. Réessayez dans un instant.</p>
        <Button onClick={reset} variant="gradient" className="mt-6">
          Réessayer
        </Button>
      </div>
    </main>
  );
}
