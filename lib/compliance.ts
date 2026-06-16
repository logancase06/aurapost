// Conformité de contenu pour les réseaux (MLM, franchises) : liste noire par défaut
// + mots interdits propres à l'organisation. Utilisé à la génération (prompt) et pour
// l'affichage du badge « Conforme marque ✅ ».

/** Liste noire MLM par défaut — allégations interdites (revenus, santé, garanties). */
export const DEFAULT_MLM_FORBIDDEN = [
  // Allégations de revenus
  'revenus',
  'gagner de l’argent',
  "gagner de l'argent",
  'liberté financière',
  'devenir riche',
  'argent facile',
  'revenu passif',
  // Allégations de santé (cadre légal strict, secteur surveillé)
  'guérir',
  'guérit',
  'traiter',
  'soigne',
  'cliniquement prouvé',
  'certifié',
  // Garanties / promesses de résultats
  'résultats garantis',
  'garanti',
  'perdre 10 kg',
  'perdre 5 kg',
];

/** Fusionne la liste noire par défaut avec les mots propres à l'org (dédupliqué, minuscules). */
export function mergeForbidden(orgWords: string[] | null | undefined): string[] {
  const all = [...DEFAULT_MLM_FORBIDDEN, ...(orgWords ?? [])].map((w) => w.trim().toLowerCase()).filter(Boolean);
  return Array.from(new Set(all));
}

/** Retourne les mots interdits effectivement présents dans le texte (insensible à la casse). */
export function findForbidden(text: string, words: string[]): string[] {
  const lower = (text ?? '').toLowerCase();
  return words.filter((w) => w && lower.includes(w.toLowerCase()));
}

/** true si le texte ne contient aucun mot interdit. */
export function isCompliant(text: string, words: string[]): boolean {
  return findForbidden(text, words).length === 0;
}
