import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Wand2, Pencil, Send, Globe, Gift } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Centre d’aide',
  description: 'Tout pour bien démarrer avec AuraPost : générer, modifier, publier, partager, parrainer.',
  alternates: { canonical: '/help' },
};

const ARTICLES = [
  {
    icon: Wand2,
    title: 'Comment générer mon contenu',
    steps: [
      'Va dans le tableau de bord et clique sur « Créer mes 12 posts ».',
      'AuraPost génère 8 posts Instagram + 4 LinkedIn calibrés sur ton profil (≈ 2 minutes).',
      'Tu peux aussi générer un « Pack de 30 légendes » pour tes stories.',
    ],
  },
  {
    icon: Pencil,
    title: 'Comment modifier un post',
    steps: [
      'Ouvre un post depuis le tableau de bord (icône agrandir).',
      'Copie le texte pour l’ajuster, ou clique sur « Variante » pour un autre angle.',
      'Approuve les posts qui te conviennent, rejette les autres.',
    ],
  },
  {
    icon: Send,
    title: 'Comment publier mes posts',
    steps: [
      'Copie un post approuvé en un clic, ou exporte-le vers Buffer / Later.',
      'Programme tes posts dans le calendrier éditorial (glisser-déposer).',
      'Exporte ton calendrier au format iCal pour le suivre où tu veux.',
    ],
  },
  {
    icon: Globe,
    title: 'Comment partager mon site',
    steps: [
      'Avec le Pack Complet, ton site vitrine est généré sur ton-nom.aurapost.fr.',
      'Active-le depuis l’onglet « Mon site », puis copie le lien.',
      'Partage-le à tes prospects, ajoute-le à ta bio Instagram.',
    ],
  },
  {
    icon: Gift,
    title: 'Comment parrainer un coach',
    steps: [
      'Va dans l’onglet « Parrainage » et copie ton lien unique.',
      'Partage-le : à chaque inscription via ton lien, vous gagnez 1 mois gratuit chacun.',
      'Suis tes filleuls et tes mois gagnés depuis la même page.',
    ],
  },
];

export default function HelpPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
          <BookOpen className="h-5 w-5 text-white" />
        </span>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Centre d’aide</h1>
          <p className="text-sm text-muted-foreground">Les bases pour tirer le meilleur d’AuraPost.</p>
        </div>
      </div>

      <div className="mt-10 space-y-5">
        {ARTICLES.map((a) => (
          <article key={a.title} className="rounded-lg border border-border bg-card p-6">
            <h2 className="flex items-center gap-2 text-xl font-black tracking-tight">
              <a.icon className="h-5 w-5 text-primary" /> {a.title}
            </h2>
            <ol className="mt-3 space-y-2 pl-1">
              {a.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Tu ne trouves pas ta réponse ?{' '}
        <Link href="/support" className="font-semibold text-primary hover:underline">
          Contacte le support
        </Link>
        .
      </p>
    </main>
  );
}
