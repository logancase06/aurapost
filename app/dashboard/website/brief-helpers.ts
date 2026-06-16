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

// ── Questionnaire de création (Mandat 2) ────────────────────────────────────
export type QuestionKey = 'photos' | 'tarifs' | 'highlight' | 'tone' | 'action';
export interface QuestionDef {
  key: QuestionKey;
  label: string;
  options: string[]; // chips de réponse rapide
}

// Labels « spéciaux » qui déclenchent une ACTION post-création (pas du texte de prompt).
export const PHOTO_HAVE = 'J’ai déjà mes photos';
export const TARIFS_PRECISE = 'Oui, avec mes tarifs précis';

export const QUESTIONNAIRE: QuestionDef[] = [
  { key: 'photos', label: 'As-tu des photos à utiliser pour ton site ?', options: [PHOTO_HAVE, 'Pas encore, utilise un visuel par défaut'] },
  { key: 'tarifs', label: 'Veux-tu afficher tes tarifs sur le site ?', options: [TARIFS_PRECISE, 'Non, juste un bouton de contact'] },
  { key: 'highlight', label: 'Qu’est-ce qui doit ressortir le plus ?', options: ['Mon parcours / mon expérience', 'Mes résultats clients', 'Ma personnalité / mon approche'] },
  { key: 'tone', label: 'Quel ton veux-tu pour ce site ?', options: ['Sérieux et professionnel', 'Chaleureux et motivant', 'Épuré et minimaliste'] },
  { key: 'action', label: 'Que doit faire un visiteur en arrivant ?', options: ['Réserver une séance', 'Te contacter par WhatsApp', 'Découvrir tes offres'] },
];

/** Pré-sélection de la chip « ton » depuis le ton du profil onboarding (modifiable). */
export const TONE_CHIP_FOR_PROFILE: Record<string, string> = {
  motivant: 'Chaleureux et motivant',
  educatif: 'Sérieux et professionnel',
  personnel: 'Chaleureux et motivant',
};

export type QuestionnaireAnswers = Partial<Record<QuestionKey, string>> & { brief?: string };

/** Quelle zone ouvrir dans l'éditeur après création, selon les réponses Q1/Q2. */
export function focusFromAnswers(a: QuestionnaireAnswers): 'offers' | 'photos' | undefined {
  if (a.tarifs === TARIFS_PRECISE) return 'offers';
  if (a.photos === PHOTO_HAVE) return 'photos';
  return undefined;
}

/**
 * Assemble les réponses structurées + la description libre (Q6) en une description
 * textuelle cohérente pour l'IA. Q1 (photos) / Q2 (tarifs) « presse-bouton » ne sont
 * pas du texte de prompt (gérés en actions) — mais une réponse LIBRE y est conservée.
 */
export function buildSiteDescriptionFromQuestionnaire(a: QuestionnaireAnswers): string {
  const lines: string[] = [];
  if (a.tone) lines.push(`Ton souhaité : ${a.tone.toLowerCase()}.`);
  if (a.highlight) lines.push(`Mettre en avant : ${a.highlight.toLowerCase()}.`);
  if (a.action) lines.push(`Action principale attendue : ${a.action.toLowerCase()}.`);
  if (a.tarifs === TARIFS_PRECISE) lines.push('Afficher mes tarifs sur le site.');
  else if (a.tarifs && a.tarifs !== 'Non, juste un bouton de contact') lines.push(`Tarifs : ${a.tarifs}`);
  // Photos : seule une réponse libre porte du sens pour le prompt.
  if (a.photos && a.photos !== PHOTO_HAVE && a.photos !== 'Pas encore, utilise un visuel par défaut') lines.push(`Photos : ${a.photos}`);
  const brief = (a.brief ?? '').trim();
  if (brief) lines.push(brief);
  return lines.join(' ').trim();
}

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
