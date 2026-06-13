import fr from '@/locales/fr.json';
import en from '@/locales/en.json';

// ─────────────────────────────────────────────────────────────────────────────
// i18n FR/EN. Toutes les chaînes UI sont extraites dans locales/{fr,en}.json.
// L'app est francophone par défaut ; la langue est détectée à l'inscription
// (navigator.language / Accept-Language) puis stockée sur coach_profiles.language.
// La langue du CONTENU généré suit la même valeur (cf. content-generator).
// ─────────────────────────────────────────────────────────────────────────────

export type Locale = 'fr' | 'en';
export const LOCALES: Locale[] = ['fr', 'en'];
export const DEFAULT_LOCALE: Locale = 'fr';

type Messages = typeof fr;
const DICTS: Record<Locale, Messages> = { fr, en: en as Messages };

export function normalizeLocale(input: string | null | undefined): Locale {
  return input === 'en' ? 'en' : 'fr';
}

/** Détecte la locale depuis un en-tête Accept-Language (ex: "en-US,en;q=0.9,fr;q=0.8"). */
export function detectLocaleFromHeader(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const first = acceptLanguage.split(',')[0]?.trim().toLowerCase() ?? '';
  return first.startsWith('en') ? 'en' : 'fr';
}

/** Détecte la locale côté navigateur (client). */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

/** Résout une clé pointée (ex: "dashboard.generate") dans le dictionnaire. */
function resolve(dict: Messages, key: string): string | undefined {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict) as string | undefined;
}

/**
 * Traducteur pour une locale donnée. Supporte l'interpolation `{var}`.
 * Retombe sur le français puis sur la clé brute si introuvable.
 */
export function getTranslator(locale: Locale) {
  const dict = DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
  return (key: string, vars?: Record<string, string | number>): string => {
    let value = resolve(dict, key) ?? resolve(DICTS[DEFAULT_LOCALE], key) ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return value;
  };
}

/** Renvoie le dictionnaire complet d'une locale (pour passer au client). */
export function getMessages(locale: Locale): Messages {
  return DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
}
