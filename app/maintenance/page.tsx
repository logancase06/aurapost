import { Sparkles } from 'lucide-react';

export const metadata = { title: 'Maintenance' };

// Page de maintenance élégante — activée via MAINTENANCE_MODE=true (cf. proxy.ts).
export default function MaintenancePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="aura-glow absolute inset-0" aria-hidden />
      <div className="relative z-10 flex flex-col items-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
          <Sparkles className="h-7 w-7 text-white" />
        </span>
        <h1 className="mt-8 text-4xl font-black uppercase tracking-tighter">On revient vite.</h1>
        <p className="mt-3 max-w-sm text-muted-foreground">
          AuraPost est en maintenance pour quelques minutes. Ton contenu t&apos;attend juste après.
        </p>
      </div>
    </main>
  );
}
