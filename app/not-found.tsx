import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ErrorArt } from '@/components/ErrorArt';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="aura-glow absolute inset-0" aria-hidden />
      <div className="relative z-10 flex flex-col items-center">
        <ErrorArt code="404" />
        <h1 className="mt-8 text-2xl font-bold">Page introuvable</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Button asChild variant="gradient" className="mt-6">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </main>
  );
}
