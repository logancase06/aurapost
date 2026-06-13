'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const MESSAGES: Record<string, { title: string; desc: string; ok: boolean }> = {
  success: { title: 'Email vérifié ✦', desc: 'Votre adresse est confirmée. Vous pouvez profiter de toutes les fonctionnalités.', ok: true },
  expired: { title: 'Lien expiré', desc: 'Ce lien de vérification a expiré (48h). Demandez-en un nouveau depuis votre compte.', ok: false },
  invalid: { title: 'Lien invalide', desc: 'Ce lien de vérification est invalide ou a déjà été utilisé.', ok: false },
  error: { title: 'Erreur', desc: 'Une erreur est survenue. Réessayez plus tard.', ok: false },
};

function VerifyContent() {
  const status = useSearchParams().get('status') ?? 'invalid';
  const msg = MESSAGES[status] ?? MESSAGES.invalid;

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="aura-glow absolute inset-0" aria-hidden />
      <Card className="relative z-10 w-full max-w-md border-border/80 bg-card/80 p-8 text-center backdrop-blur-xl">
        {msg.ok ? (
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        ) : (
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
        )}
        <h1 className="mt-4 text-xl font-bold">{msg.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{msg.desc}</p>
        <Button asChild variant="gradient" className="mt-6">
          <Link href="/dashboard">Aller au tableau de bord</Link>
        </Button>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
