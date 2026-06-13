import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, X } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AuraPost vs Agence de communication',
  description:
    'Comparatif honnête : AuraPost face à une agence de communication traditionnelle. Prix, délais, résultats — tout y est.',
  alternates: { canonical: '/vs/agence' },
  openGraph: { title: 'AuraPost vs Agence de communication', type: 'website' },
};

const ROWS = [
  { label: 'Prix mensuel', aura: '29–49 €', agence: '800–2 000 €' },
  { label: 'Délai de mise en place', aura: '2 minutes', agence: '2 à 4 semaines' },
  { label: 'Contenu / mois', aura: '12 posts + 30 légendes', agence: '8 à 12 posts' },
  { label: 'Respect de ton ton', aura: 'Imité automatiquement', agence: 'Variable selon le rédacteur' },
  { label: 'Site vitrine inclus', aura: true, agence: false },
  { label: 'Modifications', aura: 'Illimitées, instantanées', agence: 'Limitées, avec aller-retours' },
  { label: 'Engagement', aura: 'Aucun', agence: '3 à 12 mois' },
  { label: 'Disponibilité', aura: '24/7', agence: 'Heures de bureau' },
];

function Cell({ value, good }: { value: string | boolean; good?: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="mx-auto h-5 w-5 text-[hsl(var(--success))]" />
    ) : (
      <X className="mx-auto h-5 w-5 text-muted-foreground" />
    );
  }
  return <span className={good ? 'font-bold text-foreground' : 'text-muted-foreground'}>{value}</span>;
}

export default function VsAgencePage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16">
      <header className="text-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">AuraPost vs Agence</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Une agence fait du bon travail. Mais pour un coach indépendant, le rapport prix / délais / flexibilité
          n’a tout simplement pas de sens. Voici pourquoi.
        </p>
      </header>

      <div className="mt-12 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-card">
              <th className="p-4 text-left font-semibold text-muted-foreground"></th>
              <th className="p-4 text-center">
                <span className="text-base font-black uppercase tracking-tight text-primary">AuraPost</span>
              </th>
              <th className="p-4 text-center font-semibold text-muted-foreground">Agence classique</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={r.label} className={i % 2 ? 'bg-card/40' : ''}>
                <td className="p-4 font-medium">{r.label}</td>
                <td className="p-4 text-center">
                  <Cell value={r.aura} good />
                </td>
                <td className="p-4 text-center">
                  <Cell value={r.agence} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-8 text-center">
        <h2 className="text-2xl font-black uppercase tracking-tight">Le calcul est vite fait</h2>
        <p className="mt-2 text-muted-foreground">
          Le prix d’une seule journée d’agence = près d’un an d’AuraPost. Et tu gardes le contrôle.
        </p>
        <Link href="/register" className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-primary to-accent px-8 py-3.5 font-bold text-white">
          Essayer gratuitement
        </Link>
      </div>
    </main>
  );
}
