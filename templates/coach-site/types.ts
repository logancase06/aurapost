// Types partagés du site vitrine coach. Isolés ici pour éviter les cycles d'import
// entre l'assembleur (CoachSite.tsx) et les composants de section.

export type SiteStyle = 'impact' | 'clarte' | 'authenticite';

/**
 * Garde-fou TypeScript pour l'ajout de nouveaux styles.
 * Toute branche switch/if-else qui gère SiteStyle doit se terminer par :
 *   `return assertStyleUnreachable(style);`
 * TypeScript vérifie alors que `style` est bien `never` à ce point — si un nouveau
 * style est ajouté à l'union sans être traité dans la branche, la compilation échoue.
 * En production le throw ne sera jamais atteint (styles exhaustivement couverts).
 */
export function assertStyleUnreachable(style: never): never {
  throw new Error(`[coach-site] Style non géré : ${String(style)}`);
}

export interface CoachServiceItem {
  title: string;
  description: string;
  icon?: string;
}
export interface CoachTestimonialItem {
  name: string;
  quote: string;
}
export interface CoachResultItem {
  result: string;
  name: string;
  city?: string;
}
export interface CoachSiteData {
  subdomain?: string;
  displayName: string;
  speciality: string;
  city?: string | null;
  bio?: string | null;
  themeColor: string;
  style?: SiteStyle;
  tone?: string | null;
  contactEmail?: string | null;
  bookingUrl?: string | null;
  instagramUrl?: string | null;
  whatsapp?: string | null;
  services: CoachServiceItem[];
  testimonials: CoachTestimonialItem[];
  strengths?: string[];
  forces?: { title: string; description?: string }[];
  // Contenu généré (optionnel) :
  heroTitle?: string;
  heroSubtitle?: string;
  heroTagline?: string;
  about?: string;
  story?: string;
  storyQuote?: string;
  results?: CoachResultItem[];
  accentColor?: string | null;
  cta?: string;
  photoUrl?: string | null;
  seoDescription?: string;
}

export type Force = { title: string; description?: string };

/** Contexte de rendu partagé, calculé une fois par l'assembleur et passé aux sections. */
export interface SiteCtx {
  style: SiteStyle;
  accent: string;
  ctaLabel: string;
  ctaHref: string;
}
