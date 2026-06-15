import Link from 'next/link';

export const metadata = { title: 'Réabonné', robots: { index: false, follow: false } };

/** Page de confirmation de réabonnement aux emails marketing. */
export default function ResubscribedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="aura-glow absolute inset-0" aria-hidden />
      <div className="relative z-10 max-w-md">
        <span className="text-4xl">📬</span>
        <h1 className="mt-4 text-2xl font-bold">Te revoilà parmi nous</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Tu recevras de nouveau les emails d’AuraPost (relances mensuelles, conseils). Tu peux te désabonner à tout
          moment depuis le lien en bas de chaque email.
        </p>
        <p className="mt-6 text-xs text-muted-foreground">
          <Link href="/dashboard" className="text-primary hover:underline">
            Aller à mon espace
          </Link>
        </p>
      </div>
    </main>
  );
}
