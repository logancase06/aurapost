// Définition des plans AuraPost — SOURCE UNIQUE DE VÉRITÉ des prix.
// L'identifiant de plan (`content_only` / `pack_complet`) est stocké dans tenants.plan
// et subscriptions.plan. `starter` = gratuit par défaut.
//
// Offre d'essai unifiée partout : 14 jours gratuits (cf. FREE_TRIAL_LABEL).

export type PlanId = 'starter' | 'content_only' | 'pack_complet';

/** Libellé unique de l'offre d'essai (utilisé dans toute l'UI). */
export const FREE_TRIAL_LABEL = '14 jours gratuits';
/** Durée d'essai en jours — appliquée au checkout Stripe (trial_period_days). */
export const FREE_TRIAL_DAYS = 14;
/** Remise annuelle (paiement à l'année). */
export const ANNUAL_DISCOUNT = 0.2;

export interface PlanDef {
  id: PlanId;
  name: string;
  tagline: string;
  /** Stripe Price ID mensuel — défini via env quand Stripe sera configuré. */
  priceId?: string;
  /** Stripe Price ID annuel (facturation en une fois, -20%). */
  annualPriceId?: string;
  /** Montant mensuel en centimes. */
  amount: number;
  currency: string;
  featured?: boolean;
  features: string[];
}

export const PLANS: PlanDef[] = [
  {
    id: 'content_only',
    name: 'Coach',
    tagline: 'Le contenu social, en pilote automatique.',
    priceId: process.env.STRIPE_PRICE_CONTENT_ONLY,
    annualPriceId: process.env.STRIPE_PRICE_CONTENT_ONLY_ANNUAL,
    amount: 3900, // 39 € / mois
    currency: 'eur',
    features: [
      '12 posts / mois (8 Instagram + 4 LinkedIn)',
      'Calibrés sur ta spécialité et ton ton',
      'Variantes illimitées + pack de 30 légendes',
      'Calendrier éditorial + export iCal',
      'Export en 1 clic (Buffer / Later)',
      'Analyse de profil Instagram & LinkedIn',
    ],
  },
  {
    id: 'pack_complet',
    name: 'Coach+Site',
    tagline: 'Le contenu ET le site. Tout-en-un.',
    priceId: process.env.STRIPE_PRICE_PACK_COMPLET,
    annualPriceId: process.env.STRIPE_PRICE_PACK_COMPLET_ANNUAL,
    amount: 7900, // 79 € / mois
    currency: 'eur',
    featured: true,
    features: [
      'Tout le plan Coach',
      'Site vitrine loué sur sous-domaine',
      'Généré par l’IA depuis ton profil',
      'Planning de réservations + portail public',
      'Badge « Certifié AuraPost »',
      'Support prioritaire',
    ],
  },
];

/** Offre gratuite (hameçon) — affichée séparément, non « achetable ». */
export const FREE_PLAN = {
  id: 'starter' as const,
  name: 'Découverte',
  tagline: 'Teste AuraPost, gratuitement.',
  amount: 0,
  currency: 'eur',
  features: [
    '4 posts Instagram / mois',
    'Calibrés sur ta spécialité',
    'Watermark « Créé avec AuraPost »',
    'Sans site ni export',
  ],
};

/** Texte de watermark appliqué aux posts exportés/copiés des comptes gratuits. */
export const WATERMARK_TEXT = '— Créé avec AuraPost · aurapost.fr';

/** Plans réseau / agence (source unique ; cohérent avec /agency-pricing). */
export const TEAMS_PLANS = [
  { id: 'teams_starter', name: 'Teams Starter', limit: 'jusqu’à 50 distributeurs', amount: 49000 },
  { id: 'teams_growth', name: 'Teams Growth', limit: 'jusqu’à 200 distributeurs', amount: 190000 },
  { id: 'teams_enterprise', name: 'Enterprise', limit: '500+ distributeurs', amount: null },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Limites par plan — SOURCE UNIQUE de gating (appliqué CÔTÉ SERVEUR).
// 'starter' = gratuit (hameçon) : 12 posts génériques, mais pas de site, pas
// d'export, peu de variantes/photos, et profil limité au socle (pas d'analyse
// IG/avis → posts moins personnalisés). Payer débloque la personnalisation.
// ─────────────────────────────────────────────────────────────────────────────

export type ProfileSection = 'base' | 'presence' | 'photos' | 'results';

export interface PlanLimits {
  postsPerMonth: number;
  /** Génère uniquement des posts Instagram (offre gratuite). */
  instagramOnly: boolean;
  sitesEnabled: boolean;
  photosMax: number;
  variantesMax: number; // par mois
  exportEnabled: boolean;
  /** Ajoute un watermark « Créé avec AuraPost » aux posts copiés/exportés. */
  watermark: boolean;
  profileSections: ProfileSection[];
  /**
   * Nombre d'éditions IA d'images par mois.
   * Réservé à pack_complet (0 pour starter et content_only en v1).
   * Calcul : 20 img × €0.046/img = €0.92 → coût IA total = €0.98 = 1.24% du plan (objectif < 2%).
   */
  aiEditsMax: number;
  /**
   * Publication directe sur les réseaux sociaux (Zernio) depuis l'app.
   * Réservé à pack_complet en v1. MAX_SOCIAL_ACCOUNTS comptes par tenant en beta.
   */
  socialPublishEnabled: boolean;
}

// Les deux plans payants partagent la même limite de variantes intentionnellement.
// Si on différencie un jour, changer cette valeur + le message d'erreur dans post-actions.ts.
const VARIANTS_UNLIMITED = 9_999;

// 'starter' = Découverte (gratuit, hameçon) : 4 posts Instagram avec watermark, pas de
// site, pas d'export, pas de variantes. Payer débloque le volume, LinkedIn, l'export, le site.
/** Nombre max de comptes sociaux par tenant en beta Zernio (2 = tier gratuit Zernio). */
export const MAX_SOCIAL_ACCOUNTS = 2;

const LIMITS: Record<PlanId, PlanLimits> = {
  starter:      { postsPerMonth: 4,  instagramOnly: true,  sitesEnabled: false, photosMax: 1,  variantesMax: 0,                exportEnabled: false, watermark: true,  profileSections: ['base'],                                      aiEditsMax: 0,  socialPublishEnabled: false },
  content_only: { postsPerMonth: 12, instagramOnly: false, sitesEnabled: false, photosMax: 10, variantesMax: VARIANTS_UNLIMITED, exportEnabled: true,  watermark: false, profileSections: ['base', 'presence', 'photos', 'results'],    aiEditsMax: 0,  socialPublishEnabled: false },
  pack_complet: { postsPerMonth: 12, instagramOnly: false, sitesEnabled: true,  photosMax: 10, variantesMax: VARIANTS_UNLIMITED, exportEnabled: true,  watermark: false, profileSections: ['base', 'presence', 'photos', 'results'],    aiEditsMax: 20, socialPublishEnabled: true  },
};

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  return LIMITS[(plan as PlanId) in LIMITS ? (plan as PlanId) : 'starter'];
}
export function canGenerateSite(plan: string | null | undefined): boolean {
  return getPlanLimits(plan).sitesEnabled;
}
export function canExportPost(plan: string | null | undefined): boolean {
  return getPlanLimits(plan).exportEnabled;
}

/** true si le plan a expiré (planExpiresAt dépassé). Sans date = pas d'expiration. */
function isExpired(planExpiresAt: string | null | undefined): boolean {
  return !!planExpiresAt && new Date(planExpiresAt) < new Date();
}

/** Le plan donne-t-il accès au produit ? (gratuit = toujours actif ; payant = non expiré) */
export function isPlanActive(plan: string | null | undefined, planExpiresAt: string | null | undefined): boolean {
  if (!plan || plan === 'starter') return true;
  return !isExpired(planExpiresAt);
}

export function getPlan(id: string | null | undefined): PlanDef | null {
  return PLANS.find((p) => p.id === id) ?? null;
}

/** Retrouve l'id de plan correspondant à un Stripe Price ID (webhook). */
export function planIdForPrice(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  const match = PLANS.find((p) => p.priceId && p.priceId === priceId);
  return match ? match.id : null;
}

/** Prix mensuel formaté (ex: "39 €"). */
export function formatPrice(plan: PlanDef): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: plan.currency, maximumFractionDigits: 0 }).format(
    plan.amount / 100
  );
}

/** Prix mensuel équivalent en cas de paiement annuel (-20%), formaté. */
export function formatAnnualMonthly(plan: PlanDef): string {
  const monthly = Math.round((plan.amount * (1 - ANNUAL_DISCOUNT)) / 100);
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: plan.currency, maximumFractionDigits: 0 }).format(monthly);
}
