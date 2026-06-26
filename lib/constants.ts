// ─────────────────────────────────────────────────────────────────────────────
// Constantes transverses d'AuraPost — catalogue central des "magic numbers".
// Les limites par plan vivent dans lib/plans.ts (getPlanLimits) ; les comptes de
// posts (8 IG / 4 LI) dans lib/content-generator.ts (domaine génération).
// ─────────────────────────────────────────────────────────────────────────────

/** Posts générés par lot mensuel (8 Instagram + 4 LinkedIn). */
export const POSTS_PER_MONTH = 12;
/** Photos max (plan le plus haut). Le gating réel = getPlanLimits().photosMax. */
export const MAX_PHOTOS = 10;
/** Durée de validité d'une URL R2 signée (1 an). */
export const SIGNED_URL_TTL = 60 * 60 * 24 * 365;
/** Débounce de l'autosave (onboarding, profil, éditeur de site). */
export const AUTOSAVE_DEBOUNCE_MS = 1000;
/** Essai gratuit (jours). */
export const TRIAL_DAYS = 14;
/** Période de grâce après échec de paiement avant blocage (jours). */
export const GRACE_PERIOD_DAYS = 7;
/** Verrou de génération considéré périmé au-delà (ms). */
export const GENERATION_LOCK_STALE_MS = 5 * 60 * 1000;
/** Nombre maximum de mois gratuits cumulables via parrainage (parrain uniquement). */
export const REFERRAL_MAX_MONTHS = 12;
/** Durée de vie du cookie d'attribution de parrainage (secondes). */
export const REFERRAL_COOKIE_TTL = 30 * 24 * 60 * 60;
