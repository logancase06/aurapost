// Limites par plan AuraPost — valeurs indicatives, à figer avec la grille tarifaire.

export const STARTER_LIMITS = {
  coachProfiles: 1,
  generationsPerMonth: 1,
  websites: 0,
} as const;

export const PRO_LIMITS = {
  coachProfiles: 1,
  generationsPerMonth: Infinity,
  websites: 1,
} as const;

export const ENTERPRISE_LIMITS = {
  coachProfiles: 10,
  generationsPerMonth: Infinity,
  websites: 5,
} as const;

export function limitsForPlan(plan: string | undefined | null) {
  if (plan === 'enterprise') return ENTERPRISE_LIMITS;
  if (plan === 'pro') return PRO_LIMITS;
  return STARTER_LIMITS;
}
