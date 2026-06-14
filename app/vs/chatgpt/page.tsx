import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, X } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AuraPost vs ChatGPT',
  description:
    'Pourquoi pas juste ChatGPT ? Comparatif honnête : ChatGPT est un généraliste à prompter ; AuraPost est pensé pour les coachs sportifs, en 1 clic, avec site et calendrier inclus.',
  alternates: { canonical: '/vs/chatgpt' },
  openGraph: { title: 'AuraPost vs ChatGPT', type: 'website' },
};

const ROWS = [
  { label: 'Pensé pour les coachs sportifs', aura: true, gpt: false },
  { label: 'Génère en 1 clic (zéro prompt à écrire)', aura: true, gpt: false },
  { label: 'Imite ton ton à partir de ton profil', aura: true, gpt: 'Si tu sais le prompter' },
  { label: 'Hashtags de niche + ville', aura: true, gpt: 'À demander à chaque fois' },
  { label: 'Calendrier éditorial + planification', aura: true, gpt: false },
  { label: 'Site vitrine inclus', aura: true, gpt: false },
  { label: 'Pack de 30 légendes en 1 clic', aura: true, gpt: 'À reformuler manuellement' },
  { label: 'Cohérence d’un mois sur l’autre', aura: true, gpt: 'Repart de zéro à chaque session' },
  { label: 'Mémorise ton style et tes retours', aura: true, gpt: false },
];

function Cell({ value, good }: { value: string | boolean; good?: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="mx-auto h-5 w-5 text-[hsl(var(--success))]" />
    ) : (
      <X className="mx-auto h-5 w-5 text-muted-foreground" />
    );
  }
  return <span className={good ? 'font-bold text-foreground' : 'text-xs text-muted-foreground'}>{value}</span>;
}

export default function VsChatGptPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16">
      <header className="text-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">AuraPost vs ChatGPT</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          « Pourquoi pas juste ChatGPT ? » Bonne question. ChatGPT est un couteau suisse génial — mais
          c’est un généraliste qu’il faut prompter, relancer, et qui ne connaît ni ta niche ni ton historique.
          AuraPost fait le travail de bout en bout, pour les coachs.
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
              <th className="p-4 text-center font-semibold text-muted-foreground">ChatGPT seul</th>
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
                  <Cell value={r.gpt} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-lg border border-border bg-card/60 p-6 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">En clair :</strong> ChatGPT peut écrire un bon post si tu lui
          donnes le bon prompt, à chaque fois. AuraPost te donne 12 posts calibrés, un site et un calendrier
          — sans rien prompter. Le temps que tu passerais à dompter ChatGPT, tu le passes à coacher.
        </p>
      </div>

      <div className="mt-10 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-8 text-center">
        <h2 className="text-2xl font-black uppercase tracking-tight">Teste sans prompter</h2>
        <p className="mt-2 text-muted-foreground">Génère ton premier mois de contenu en 2 minutes, gratuitement.</p>
        <Link href="/register" className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-primary to-accent px-8 py-3.5 font-bold text-white">
          Essayer gratuitement
        </Link>
      </div>
    </main>
  );
}
