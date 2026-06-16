// Helpers PURS de la description de site (réutilisés par la zone guidée « Décris ton site »
// et par le questionnaire de création). Aucune dépendance React → importables partout.

export interface Suggestion {
  label: string; // texte de la chip
  sentence: string; // phrase complète insérée dans la description
}
export interface SuggestionGroup {
  title: string;
  items: Suggestion[];
}

/** Suggestions cliquables, groupées par intention (ton / mise en avant / actions). */
export const SUGGESTION_GROUPS: SuggestionGroup[] = [
  {
    title: 'Ton souhaité',
    items: [
      { label: 'Sérieux et professionnel', sentence: 'Je veux un site sérieux et professionnel.' },
      { label: 'Chaleureux et motivant', sentence: 'Je veux un ton chaleureux et motivant.' },
      { label: 'Épuré et minimaliste', sentence: 'Je veux un style épuré et minimaliste.' },
    ],
  },
  {
    title: 'Ce qui doit ressortir',
    items: [
      { label: 'Mon parcours', sentence: 'Mets en avant mon parcours et mon expérience.' },
      { label: 'Mes résultats clients', sentence: 'Mets en avant mes résultats clients.' },
      { label: 'Mes tarifs', sentence: 'Affiche clairement mes tarifs.' },
    ],
  },
  {
    title: 'Ce qu’on doit pouvoir faire',
    items: [
      { label: 'Réserver facilement', sentence: 'Les visiteurs doivent pouvoir réserver une séance facilement.' },
      { label: 'Me contacter par WhatsApp', sentence: 'Les visiteurs doivent pouvoir me contacter par WhatsApp.' },
      { label: 'Découvrir mes offres', sentence: 'Les visiteurs doivent pouvoir découvrir mes offres.' },
    ],
  },
];

/** Ajoute une phrase à une description, sans doublon ni ponctuation bancale. */
export function appendSentence(current: string, sentence: string): string {
  const base = current.trimEnd();
  if (base.includes(sentence)) return current; // déjà présent → no-op
  return base ? `${base} ${sentence} ` : `${sentence} `;
}

const TONE_LABEL: Record<string, string> = {
  motivant: 'motivant',
  educatif: 'pédagogique',
  personnel: 'personnel et chaleureux',
};

/** Placeholder contextuel : utilise la spécialité réelle du coach si connue. */
export function briefPlaceholder(specialty?: string | null): string {
  return specialty
    ? `ex : Un site sérieux et professionnel, qui met en avant mon parcours de ${specialty} et mes tarifs clairement. Plutôt épuré.`
    : 'ex : Un ton chaleureux et motivant, avec mes résultats clients mis en avant et un bouton de réservation visible.';
}

/**
 * Description par défaut (non bloquante) construite depuis le profil quand le coach
 * soumet un champ vide/trop court. Ne renvoie jamais une chaîne vide.
 */
export function buildDefaultBrief(profile: { specialty?: string | null; tone?: string | null; city?: string | null }): string {
  const bits: string[] = [];
  if (profile.specialty) bits.push(`pour ${profile.specialty}`);
  if (profile.city) bits.push(`à ${profile.city}`);
  const toneLabel = profile.tone ? TONE_LABEL[profile.tone] : '';
  let out = `Un site ${bits.join(' ')}`.trim();
  if (toneLabel) out += `, dans un style ${toneLabel}`;
  out = `${out}.`.replace(/\s+/g, ' ').replace(' .', '.').trim();
  // Filet ultime si aucune donnée profil exploitable.
  if (out === 'Un site.' || out.length < 12) return 'Un site professionnel et clair pour présenter mon activité.';
  return out;
}
