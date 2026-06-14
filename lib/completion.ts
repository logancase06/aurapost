// ─────────────────────────────────────────────────────────────────────────────
// Score de complétion du profil coach. Plus le profil est riche (photos, avis,
// Instagram), meilleur est le contenu généré — le score incite à compléter.
// Pur (pas d'accès DB) → réutilisable côté serveur (dashboard) et client (onboarding).
// ─────────────────────────────────────────────────────────────────────────────

export interface CompletionInput {
  displayName?: string | null;
  speciality?: string | null;
  city?: string | null;
  bio?: string | null;
  targetAudience?: string | null;
  photosCount?: number;
  hasInstagram?: boolean;
  hasReviews?: boolean;
}

export interface CompletionItem {
  key: string;
  label: string;
  done: boolean;
  points: number;
}

export interface CompletionResult {
  score: number; // 0–100
  items: CompletionItem[];
  /** Prochaine action à fort impact (le 1er item non fait), ou null si complet. */
  nextHint: string | null;
}

export function computeCompletion(input: CompletionInput): CompletionResult {
  const photos = input.photosCount ?? 0;
  // Poids alignés sur le brief : base profil 50 %, puis photos +20, avis +15, instagram +15.
  const items: CompletionItem[] = [
    { key: 'identity', label: 'Nom + spécialité', done: !!(input.displayName && input.speciality), points: 30 },
    { key: 'city', label: 'Ville', done: !!input.city, points: 5 },
    { key: 'bio', label: 'Bio ou audience cible', done: !!(input.bio || input.targetAudience), points: 15 },
    { key: 'photos', label: 'Tes photos', done: photos >= 1, points: 20 },
    { key: 'reviews', label: 'Tes avis clients', done: !!input.hasReviews, points: 15 },
    { key: 'instagram', label: 'Ton URL Instagram', done: !!input.hasInstagram, points: 15 },
  ];

  const score = Math.min(100, items.reduce((sum, it) => sum + (it.done ? it.points : 0), 0));
  const next = items.find((it) => !it.done);

  const hints: Record<string, string> = {
    identity: 'Renseigne ton nom et ta spécialité',
    city: 'Ajoute ta ville',
    bio: 'Décris ton audience ou ta bio',
    photos: 'Ajoute tes photos (+20 %)',
    reviews: 'Colle tes avis clients (+15 %)',
    instagram: 'Ajoute ton URL Instagram (+15 %)',
  };

  return { score, items, nextHint: next ? hints[next.key] ?? next.label : null };
}
