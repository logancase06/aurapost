import { WifiOff } from 'lucide-react';

export const metadata = { title: 'Hors ligne' };

export default function OfflinePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="aura-glow absolute inset-0" aria-hidden />
      <div className="relative z-10 flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
          <WifiOff className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Vous êtes hors ligne</h1>
        <p className="mt-2 text-sm text-muted-foreground">Vérifiez votre connexion internet et réessayez.</p>
      </div>
    </main>
  );
}
