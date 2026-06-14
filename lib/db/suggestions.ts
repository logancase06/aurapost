import { and, eq, sql } from 'drizzle-orm';
import { db } from './index';
import { generatedPosts } from './schema';
import { listGeneratedMonths } from './posts';
import { currentMonth } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Suggestions intelligentes : après ≥ 1 mois d'utilisation, on analyse les posts
// les plus approuvés et on propose 3 thèmes à creuser le mois suivant.
//
// Analyse déterministe (pas d'appel réseau) : classe les thèmes par taux
// d'approbation, puis mappe vers des angles complémentaires. Fiable et instantané.
// ─────────────────────────────────────────────────────────────────────────────

// ── Streak de régularité ─────────────────────────────────────────────────────
// Encourage le coach à générer son contenu chaque mois (boucle de rétention).

/** Mois précédent au format 'YYYY-MM'. */
function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return ym;
  const d = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  return d;
}

export interface StreakResult {
  /** Nb de mois consécutifs générés en terminant au mois le plus récent. */
  streak: number;
  /** true si la série est « à jour » (mois courant ou précédent généré). */
  current: boolean;
}

/** Calcule la série de mois consécutifs depuis une liste 'YYYY-MM' triée desc. */
export function computeStreak(monthsDesc: string[], now: string): StreakResult {
  if (!monthsDesc.length) return { streak: 0, current: false };
  let streak = 1;
  for (let i = 1; i < monthsDesc.length; i++) {
    if (monthsDesc[i] === prevMonth(monthsDesc[i - 1])) streak++;
    else break;
  }
  const latest = monthsDesc[0];
  const current = latest === now || latest === prevMonth(now);
  return { streak, current };
}

/** Série de régularité du coach (mois consécutifs avec génération). */
export async function getGenerationStreak(tenantId: string): Promise<StreakResult> {
  if (!tenantId) return { streak: 0, current: false };
  const months = await listGeneratedMonths(tenantId);
  return computeStreak(months, currentMonth());
}

export interface ThemeSuggestion {
  theme: string;
  angle: string;
  approvedCount: number;
}

export interface SuggestionsResult {
  available: boolean; // false tant que pas assez de données
  topThemes: string[];
  suggestions: ThemeSuggestion[];
}

// Angles complémentaires proposés pour un thème donné (heuristique éditoriale).
const ANGLE_MAP: Record<string, string> = {
  'conseil du jour': 'Transforme tes meilleurs conseils en mini-série « 1 conseil / jour ».',
  'exercice phare': 'Décline cet exercice en 3 niveaux (débutant → confirmé) sur une semaine.',
  'erreur à éviter': 'Crée un format « mythe vs réalité » sur les erreurs les plus fréquentes.',
  'témoignage client': 'Mets en avant une transformation avec un avant/après chiffré.',
  'routine matinale': 'Propose une routine de 5 minutes filmable en story.',
  nutrition: 'Partage 1 recette/snack pré-entraînement par semaine.',
  motivation: 'Lance un challenge de 7 jours pour engager ta communauté.',
  coulisses: 'Montre l’envers du décor d’une séance type.',
  expertise: 'Publie une analyse d’actualité de ton secteur.',
  'vision du métier': 'Donne ton point de vue sur une idée reçue du coaching.',
  'étude de cas': 'Détaille un protocole client de A à Z (anonymisé).',
  'tendance du secteur': 'Réagis à une tendance fitness du moment.',
};

function angleFor(theme: string): string {
  const key = theme.toLowerCase().trim();
  return ANGLE_MAP[key] ?? `Approfondis « ${theme} » avec un format carrousel pédagogique.`;
}

/**
 * Analyse les posts approuvés d'un tenant et retourne 3 thèmes à creuser.
 * `available` = false tant qu'il n'y a pas ≥ 1 mois d'historique et ≥ 3 posts approuvés.
 */
export async function getSmartSuggestions(tenantId: string): Promise<SuggestionsResult> {
  if (!tenantId) return { available: false, topThemes: [], suggestions: [] };

  const months = await listGeneratedMonths(tenantId);

  const rows = await db
    .select({ theme: generatedPosts.theme, n: sql<number>`count(*)` })
    .from(generatedPosts)
    .where(and(eq(generatedPosts.tenantId, tenantId), eq(generatedPosts.status, 'approved')))
    .groupBy(generatedPosts.theme);

  const ranked = rows
    .filter((r) => r.theme)
    .map((r) => ({ theme: r.theme as string, approvedCount: Number(r.n) }))
    .sort((a, b) => b.approvedCount - a.approvedCount);

  const totalApproved = ranked.reduce((sum, r) => sum + r.approvedCount, 0);
  const available = months.length >= 1 && totalApproved >= 3 && ranked.length > 0;

  const suggestions: ThemeSuggestion[] = ranked.slice(0, 3).map((r) => ({
    theme: r.theme,
    angle: angleFor(r.theme),
    approvedCount: r.approvedCount,
  }));

  return { available, topThemes: ranked.slice(0, 3).map((r) => r.theme), suggestions };
}
