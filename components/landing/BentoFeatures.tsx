'use client';

// Inspire de : https://21st.dev/community/components/designali-in/bento-grid
// (designali-in/bento-grid — installable via npx shadcn add https://21st.dev/r/designali-in/bento-grid
//  apres connexion 21st.dev)
//
// Adaptations par rapport a l'original :
// - Contenu specifique AuraPost (posts IA, calendrier, site vitrine, export)
// - Palette aura (tokens CSS du projet) au lieu des couleurs hardcodees
// - Icones lucide-react (deja installe) au lieu d'images externes
// - Pas d'image carousel (remplace par une demo de post generee)
// - Suppression du time-aware greeting (irrelevant pour une landing B2B)
// - Hover scale via classe Tailwind (pas de Framer Motion)

import { CalendarDays, Sparkles, Globe, Download, Zap, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BentoTile {
  title: string;
  description: string;
  icon: React.ElementType;
  className: string;
  gradient: string;
  demo?: React.ReactNode;
}

function PostDemo() {
  return (
    <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4 text-left">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-xs font-semibold text-muted-foreground">Instagram · Preparation physique</span>
      </div>
      <p className="text-xs leading-relaxed text-foreground/80">
        &ldquo;Ton corps ne ment jamais. Quand tu ignores la fatigue, il parle plus fort. Apprenez a l&apos;ecouter avant qu&apos;il crie. 3 signes que vous devez lever le pied...&rdquo;
      </p>
      <div className="mt-2 flex gap-1 flex-wrap">
        {['#coaching', '#performance', '#recuperation'].map((h) => (
          <span key={h} className="rounded text-[10px] font-medium text-primary">{h}</span>
        ))}
      </div>
    </div>
  );
}

const TILES: BentoTile[] = [
  {
    title: 'Posts generes par IA',
    description: '12 posts / mois calibres sur votre specialite, votre ton, vos clients cibles. Vous relisez, vous publiez.',
    icon: Sparkles,
    className: 'sm:col-span-2',
    gradient: 'from-white to-card',
    demo: <PostDemo />,
  },
  {
    title: 'Calendrier editorial',
    description: 'Planifiez vos posts par glisser-deposer. Export iCal pour Google Calendar et Apple Calendar.',
    icon: CalendarDays,
    className: '',
    gradient: 'from-card to-white',
  },
  {
    title: 'Site vitrine IA',
    description: 'Un site genere depuis votre profil. Trois styles visuels. Publie en un clic sur votre sous-domaine.',
    icon: Globe,
    className: '',
    gradient: 'from-white to-card',
  },
  {
    title: 'Export vers vos outils',
    description: 'Buffer, Later, ou copie directe. Vos posts partent exactement ou vous les voulez.',
    icon: Download,
    className: '',
    gradient: 'from-card to-white',
  },
  {
    title: 'Analyse de profil',
    description: 'Audit IA de votre presence Instagram et LinkedIn. Score, points forts, actions prioritaires.',
    icon: BarChart3,
    className: '',
    gradient: 'from-white to-card',
  },
  {
    title: 'Generation instantanee',
    description: 'Un mois de contenu en moins de 2 minutes. Le tout personnalise, pas de templates generiques.',
    icon: Zap,
    className: 'sm:col-span-2',
    gradient: 'from-card to-white',
  },
];

function BentoTile({ tile }: { tile: BentoTile }) {
  const Icon = tile.icon;
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-foreground/5',
        `bg-gradient-to-br ${tile.gradient}`,
        tile.className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">{tile.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{tile.description}</p>
        </div>
      </div>
      {tile.demo}
    </div>
  );
}

/**
 * Grille bento des fonctionnalites AuraPost.
 * Layout : 3 colonnes sur desktop, avec 2 tuiles large (col-span-2) et 4 tuiles standard.
 * Utilisable en remplacement ou complement de HowItWorks.tsx.
 */
export default function BentoFeatures() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">
            Tout ce dont vous avez besoin
          </h2>
          <p className="mt-3 text-muted-foreground">
            Un seul outil. Contenu, calendrier, site, analyse.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {TILES.map((tile) => (
            <BentoTile key={tile.title} tile={tile} />
          ))}
        </div>
      </div>
    </section>
  );
}
