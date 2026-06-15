import { z } from 'zod';

// Schémas tolérants : chaque champ a un `.catch` → une réponse Claude légèrement
// malformée ne fait jamais échouer le parse (les champs manquants prennent un défaut).

const ScoreItem = z.object({ note: z.coerce.number().catch(0), max: z.coerce.number().catch(10) }).catch({ note: 0, max: 10 });

const Probleme = z.object({
  titre: z.string().catch(''),
  description: z.string().catch(''),
  impact: z.enum(['fort', 'moyen', 'faible']).catch('moyen'),
  correction: z.string().catch(''),
});

const DEFAULT_SCORE = { note: 0, max: 10 };

export const InstagramAnalysisSchema = z.object({
  score_global: z.coerce.number().catch(0),
  scores_detail: z
    .object({
      bio: ScoreItem,
      frequence: ScoreItem,
      contenu: ScoreItem,
      hashtags: ScoreItem,
      engagement: ScoreItem,
      appel_action: ScoreItem,
      coherence: ScoreItem,
      originalite: ScoreItem,
    })
    .catch({
      bio: DEFAULT_SCORE, frequence: DEFAULT_SCORE, contenu: DEFAULT_SCORE, hashtags: DEFAULT_SCORE,
      engagement: DEFAULT_SCORE, appel_action: DEFAULT_SCORE, coherence: DEFAULT_SCORE, originalite: DEFAULT_SCORE,
    }),
  points_forts: z.array(z.string()).catch([]),
  problemes: z.array(Probleme).catch([]),
  bio_actuelle: z.string().catch(''),
  bio_proposee: z.string().catch(''),
  hashtags_actuels: z.array(z.string()).catch([]),
  hashtags_proposes: z.array(z.string()).catch([]),
  meilleur_post: z.string().catch(''),
  pourquoi_meilleur: z.string().catch(''),
  post_a_ameliorer: z.string().catch(''),
  comment_ameliorer: z.string().catch(''),
  creneaux_recommandes: z.array(z.string()).catch([]),
  prochaine_action: z.string().catch(''),
});
export type InstagramAnalysis = z.infer<typeof InstagramAnalysisSchema>;

export const LinkedInAnalysisSchema = z.object({
  score_global: z.coerce.number().catch(0),
  scores_detail: z
    .object({
      titre: ScoreItem,
      resume: ScoreItem,
      experience: ScoreItem,
      publications: ScoreItem,
      reseau: ScoreItem,
      recommandations: ScoreItem,
    })
    .catch({
      titre: DEFAULT_SCORE, resume: DEFAULT_SCORE, experience: DEFAULT_SCORE,
      publications: DEFAULT_SCORE, reseau: DEFAULT_SCORE, recommandations: DEFAULT_SCORE,
    }),
  titre_actuel: z.string().catch(''),
  titre_propose: z.string().catch(''),
  resume_actuel: z.string().catch(''),
  resume_propose: z.string().catch(''),
  points_forts: z.array(z.string()).catch([]),
  problemes: z.array(Probleme).catch([]),
  prochaine_action: z.string().catch(''),
});
export type LinkedInAnalysis = z.infer<typeof LinkedInAnalysisSchema>;

export type Platform = 'instagram' | 'linkedin';

/** Contexte profil (spécialité/ville/nom) pour enrichir prompt et mock. */
export interface AnalyzeContext {
  displayName?: string | null;
  speciality?: string | null;
  city?: string | null;
}

export type AnalyzeOk<T> = { ok: true; analysis: T; source: 'api' | 'mock' };
export type AnalyzeErr = { ok: false; reason: 'private' | 'invalid' | 'error'; message: string };
export type AnalyzeResult<T> = AnalyzeOk<T> | AnalyzeErr;
