// Définition des plans AuraPost — SOURCE UNIQUE DE VÉRITÉ des prix.
// L'identifiant de plan (`content_only` / `pack_complet`) est stocké dans tenants.plan
// et subscriptions.plan. `starter` = gratuit par défaut.
//
// Offre d'essai unifiée partout : 14 jours gratuits (cf. FREE_TRIAL_LABEL).

export type PlanId = 'starter' | 'content_only' | 'pack_complet';

/** Libellé unique de l'offre d'essai (utilisé dans toute l'UI). */
export const FREE_TRIAL_LABEL = '14 jours gratuits';
/** Remise annuelle (paiement à l'année). */
export const ANNUAL_DISCOUNT = 0.2;

export interface PlanDef {
  id: PlanId;
  name: string;
  tagline: string;
  /** Stripe Price ID — défini via env quand Stripe sera configuré. */
  priceId?: string;
  /** Montant mensuel en centimes. */
  amount: number;
  currency: string;
  featured?: boolean;
  features: string[];
}

export const PLANS: PlanDef[] = [
  {
    id: 'content_only',
    name: 'Content Only',
    tagline: 'Le contenu social, en pilote automatique.',
    priceId: process.env.STRIPE_PRICE_CONTENT_ONLY,
    amount: 14900, // 149 € / mois
    currency: 'eur',
    features: [
      '12 posts / mois (8 Instagram + 4 LinkedIn)',
      'Calibrés sur ta spécialité et ton ton',
      'Approbation, rejet & variantes illimitées',
      'Pack de 30 légendes (stories)',
      'Calendrier éditorial + export iCal',
      'Export Buffer / Later',
    ],
  },
  {
    id: 'pack_complet',
    name: 'Pack Complet',
    tagline: 'Le contenu ET le site. Tout-en-un.',
    priceId: process.env.STRIPE_PRICE_PACK_COMPLET,
    amount: 20900, // 209 € / mois
    currency: 'eur',
    featured: true,
    features: [
      'Tout le plan Content Only',
      'Site vitrine loué sur sous-domaine',
      'Généré par l’IA depuis ton profil',
      'Portail public partageable à tes clients',
      'Badge « Certifié AuraPost »',
      'Support prioritaire',
    ],
  },
];

export function getPlan(id: string | null | undefined): PlanDef | null {
  return PLANS.find((p) => p.id === id) ?? null;
}

/** Retrouve l'id de plan correspondant à un Stripe Price ID (webhook). */
export function planIdForPrice(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  const match = PLANS.find((p) => p.priceId && p.priceId === priceId);
  return match ? match.id : null;
}

/** Prix mensuel formaté (ex: "149 €"). */
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
