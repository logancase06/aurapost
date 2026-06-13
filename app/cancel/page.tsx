import type { Metadata } from 'next';
import CancelClient from './CancelClient';

export const metadata: Metadata = {
  title: 'Annuler mon abonnement',
  description: 'Gérer ou mettre en pause votre abonnement AuraPost.',
  robots: { index: false, follow: false },
};

export default function CancelPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto mb-10 max-w-lg text-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter">On est triste de te voir hésiter</h1>
        <p className="mt-2 text-muted-foreground">Avant tout, regarde si une pause ne suffirait pas.</p>
      </div>
      <CancelClient />
    </main>
  );
}
