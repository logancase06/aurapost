// Thème visuel du site vitrine dérivé de la spécialité du coach.
// Source unique des couleurs/mood par niche (consommé par templates/coach-site/theme.ts
// pour l'accent, et par lib/site-content.ts pour orienter la génération).

export interface CoachTheme {
  bg: string; // couleur de fond hero (style sombre/clair selon la niche)
  accent: string; // couleur d'accent principale
  accentLight: string; // version claire (badges, fonds de section)
  font: 'aggressive' | 'bold' | 'soft' | 'dynamic' | 'clean' | 'modern' | 'elegant';
  mood: string; // guide le registre de la génération de contenu
}

const themes: Record<string, CoachTheme> = {
  hyrox: { bg: '#0A0A0A', accent: '#FF4D00', accentLight: '#FFF0EB', font: 'aggressive', mood: 'performance' },
  crossfit: { bg: '#0D1117', accent: '#FFB300', accentLight: '#FFFDE7', font: 'bold', mood: 'warrior' },
  yoga: { bg: '#F5F0E8', accent: '#7A9E7E', accentLight: '#EAF3EA', font: 'soft', mood: 'zen' },
  pilates: { bg: '#FAF8F5', accent: '#C4956A', accentLight: '#FDF3E7', font: 'elegant', mood: 'balance' },
  running: { bg: '#0A1628', accent: '#1A56DB', accentLight: '#E6F1FB', font: 'dynamic', mood: 'endurance' },
  trail: { bg: '#0A1628', accent: '#1A56DB', accentLight: '#E6F1FB', font: 'dynamic', mood: 'endurance' },
  marathon: { bg: '#0A1628', accent: '#1A56DB', accentLight: '#E6F1FB', font: 'dynamic', mood: 'endurance' },
  nutrition: { bg: '#0F1A0F', accent: '#4CAF50', accentLight: '#E8F5E9', font: 'clean', mood: 'health' },
  boxe: { bg: '#0A0A0A', accent: '#DC2626', accentLight: '#FEE2E2', font: 'aggressive', mood: 'combat' },
  mma: { bg: '#0A0A0A', accent: '#DC2626', accentLight: '#FEE2E2', font: 'aggressive', mood: 'combat' },
  muscu: { bg: '#0D1117', accent: '#E8590C', accentLight: '#FFF2E8', font: 'bold', mood: 'force' },
  force: { bg: '#0D1117', accent: '#E8590C', accentLight: '#FFF2E8', font: 'bold', mood: 'force' },
  fitness: { bg: '#111118', accent: '#7C3AED', accentLight: '#EDE9FE', font: 'modern', mood: 'transformation' },
  default: { bg: '#0A0A0A', accent: '#7C3AED', accentLight: '#EDE9FE', font: 'modern', mood: 'coaching' },
};

// Synonymes → clés canoniques (la spécialité peut être écrite de plusieurs façons).
const ALIASES: Record<string, string> = {
  cross: 'crossfit',
  wod: 'crossfit',
  conditioning: 'hyrox',
  metcon: 'hyrox',
  mobilit: 'yoga',
  souplesse: 'yoga',
  stretch: 'yoga',
  course: 'running',
  cardio: 'running',
  endurance: 'running',
  dietet: 'nutrition',
  combat: 'boxe',
  krav: 'boxe',
  halt: 'muscu',
  powerlift: 'muscu',
  body: 'fitness',
  'remise en forme': 'fitness',
};

/** Thème complet (couleurs + mood) déduit de la spécialité du coach. */
export function getCoachTheme(specialty: string): CoachTheme {
  const key = (specialty || '').toLowerCase();
  for (const k of Object.keys(themes)) {
    if (k !== 'default' && key.includes(k)) return themes[k];
  }
  for (const [alias, canonical] of Object.entries(ALIASES)) {
    if (key.includes(alias)) return themes[canonical];
  }
  return themes.default;
}
