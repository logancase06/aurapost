// ─────────────────────────────────────────────────────────────────────────────
// A/B test du titre hero. Deux variantes stockées en config ; la sélection se fait
// via la variable d'env AB_HERO_VARIANT (a | b) ou le paramètre ?hero=b (test manuel),
// sans toucher au code. Le composant rend la variante choisie côté serveur.
// ─────────────────────────────────────────────────────────────────────────────

export type HeroVariant = 'a' | 'b';

export interface HeroCopy {
  line1: string;
  line2: string; // mis en gradient
  subtitle: { text: string; highlight: string };
}

export const HERO_VARIANTS: Record<HeroVariant, HeroCopy> = {
  a: {
    line1: 'Ton contenu.',
    line2: 'Ton style.',
    subtitle: { text: 'Généré en', highlight: '2 minutes.' },
  },
  b: {
    line1: 'Arrête de',
    line2: 'galérer.',
    subtitle: { text: 'Un mois de posts en', highlight: '1 clic.' },
  },
};

/** Sélectionne la variante hero : ?hero= prioritaire, sinon AB_HERO_VARIANT, sinon 'a'. */
export function resolveHeroVariant(override?: string | null): HeroCopy {
  const fromOverride = override === 'a' || override === 'b' ? (override as HeroVariant) : null;
  const fromEnv = process.env.AB_HERO_VARIANT === 'b' ? 'b' : process.env.AB_HERO_VARIANT === 'a' ? 'a' : null;
  const variant: HeroVariant = fromOverride ?? fromEnv ?? 'a';
  return HERO_VARIANTS[variant];
}
