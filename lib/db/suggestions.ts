import { and, eq, sql } from 'drizzle-orm';
import { db } from './index';
import { generatedPosts } from './schema';
import { listGeneratedMonths } from './posts';

// ─────────────────────────────────────────────────────────────────────────────
// Suggestions intelligentes : après ≥ 1 mois d'utilisation, on analyse les posts
// les plus approuvés et on propose 3 thèmes à creuser le mois suivant.
//
// Analyse déterministe (pas d'appel réseau) : classe les thèmes par taux
// d'approbation, puis mappe vers des angles complémentaires. Fiable et instantané.
// ─────────────────────────────────────────────────────────────────────────────

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
