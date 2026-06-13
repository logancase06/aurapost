// Définition des plans AuraPost. Prix à figer plus tard — placeholder à 0.
// L'identifiant de plan (`content_only` / `pack_complet`) est stocké dans tenants.plan
// et subscriptions.plan. `starter` = gratuit par défaut.

export type PlanId = 'starter' | 'content_only' | 'pack_complet';

export interface PlanDef {
  id: PlanId;
  name: string;
  /** Stripe Price ID — défini via env quand Stripe sera configuré. */
  priceId?: string;
  /** Montant mensuel en centimes. 0 = à définir (placeholder). */
  amount: number;
  currency: string;
  features: string[];
}

export const PLANS: PlanDef[] = [
  {
    id: 'content_only',
    name: 'Content Only',
    priceId: process.env.STRIPE_PRICE_CONTENT_ONLY,
    amount: 0,
    currency: 'eur',
    features: [
      '12 posts générés / mois (8 Instagram + 4 LinkedIn)',
      'Approbation, rejet et variantes illimitées',
      'Export et copie en un clic',
    ],
  },
  {
    id: 'pack_complet',
    name: 'Pack Complet',
    priceId: process.env.STRIPE_PRICE_PACK_COMPLET,
    amount: 0,
    currency: 'eur',
    features: [
      'Tout le plan Content Only',
      'Site web vitrine loué sur sous-domaine',
      'Portail public partageable à vos clients',
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

export function formatPrice(plan: PlanDef): string {
  if (plan.amount <= 0) return 'Prix à venir';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: plan.currency }).format(plan.amount / 100);
}
