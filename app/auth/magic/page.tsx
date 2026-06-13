'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function MagicLinkContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    if (!token) return;
    signIn('credentials', { type: 'magic', token, redirect: false }).then((result) => {
      if (result?.error) {
        setStatus('error');
        return;
      }
      router.push('/dashboard');
    });
  }, [token, router]);

  if (token && status === 'loading') {
    return (
      <Centered>
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Connexion en cours…</p>
      </Centered>
    );
  }

  return (
    <Centered>
      <Card className="max-w-sm border-border/80 bg-card/80 p-8 text-center backdrop-blur-xl">
        <XCircle className="mx-auto h-12 w-12 text-destructive" />
        <p className="mt-4 font-semibold">Lien invalide ou expiré</p>
        <p className="mt-1 text-sm text-muted-foreground">Ce lien a déjà été utilisé ou a expiré (1 heure).</p>
        <Button variant="gradient" className="mt-6" onClick={() => router.push('/login')}>
          Retour à la connexion
        </Button>
      </Card>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="aura-glow absolute inset-0" aria-hidden />
      <div className="relative z-10 flex flex-col items-center text-center">{children}</div>
    </div>
  );
}

export default function MagicPage() {
  return (
    <Suspense
      fallback={
        <Centered>
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </Centered>
      }
    >
      <MagicLinkContent />
    </Suspense>
  );
}
