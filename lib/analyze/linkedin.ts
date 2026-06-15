import { extractJson } from '@/lib/parse-json';
import { logError } from '@/lib/logger';
import { runAnalysisLLM } from './llm';
import { LinkedInAnalysisSchema, type LinkedInAnalysis, type AnalyzeContext, type AnalyzeResult } from './types';

// LinkedIn = saisie 100 % manuelle (les CGU LinkedIn interdisent le scraping) :
// le coach colle son titre, son résumé et quelques posts. Pas d'URL automatique.
export interface LinkedInAnalyzeInput {
  headline: string;
  summary?: string;
  posts?: string[];
  ctx?: AnalyzeContext;
}

const SYSTEM = 'Tu es un expert LinkedIn pour les coachs et indépendants. Tu réponds TOUJOURS en JSON strict valide, sans texte avant ni après.';

function buildPrompt(input: LinkedInAnalyzeInput): string {
  const niche = [input.ctx?.speciality, input.ctx?.city].filter(Boolean).join(' · ') || 'coaching';
  return `Analyse ce profil LinkedIn et donne des recommandations précises et actionnables.

Données (saisies par le coach) :
- Niche : ${niche}
- Titre (headline) : ${input.headline || '(vide)'}
- Résumé : ${input.summary || '(vide)'}
- Exemples de posts : ${input.posts?.length ? input.posts.map((p, i) => `\n${i + 1}. ${p.slice(0, 400)}`).join('') : '(aucun)'}

Retourne UNIQUEMENT ce JSON (notes sur 10, score_global sur 100) :
{
  "score_global": 0,
  "scores_detail": { "titre": {"note":0,"max":10}, "resume": {"note":0,"max":10}, "experience": {"note":0,"max":10}, "publications": {"note":0,"max":10}, "reseau": {"note":0,"max":10}, "recommandations": {"note":0,"max":10} },
  "titre_actuel": "${(input.headline || '').replace(/"/g, "'")}",
  "titre_propose": "",
  "resume_actuel": "${(input.summary || '').replace(/"/g, "'").slice(0, 200)}",
  "resume_propose": "",
  "points_forts": ["", ""],
  "problemes": [ { "titre": "", "description": "", "impact": "fort|moyen|faible", "correction": "" } ],
  "prochaine_action": ""
}`;
}

export async function analyzeLinkedInProfile(input: LinkedInAnalyzeInput): Promise<AnalyzeResult<LinkedInAnalysis>> {
  if (!input.headline?.trim() && !input.summary?.trim() && !(input.posts?.length)) {
    return { ok: false, reason: 'invalid', message: 'Colle au moins ton titre LinkedIn.' };
  }
  try {
    const text = await runAnalysisLLM(SYSTEM, buildPrompt(input));
    const parsed = LinkedInAnalysisSchema.safeParse(extractJson(text));
    if (parsed.success) return { ok: true, analysis: parsed.data, source: 'api' };
    logError('[analyze/linkedin] parse échoué', { issues: parsed.error.issues.length });
  } catch (err) {
    logError('[analyze/linkedin] LLM indisponible — mock', { error: String(err) });
  }
  return { ok: true, analysis: mockLinkedIn(input), source: 'mock' };
}

function mockLinkedIn(input: LinkedInAnalyzeInput): LinkedInAnalysis {
  const niche = input.ctx?.speciality ?? 'coaching';
  const headLen = (input.headline || '').length;
  const sumLen = (input.summary || '').length;
  const postCount = input.posts?.length ?? 0;
  const s = (n: number) => ({ note: Math.max(0, Math.min(10, n)), max: 10 });
  const scores = {
    titre: s(headLen > 60 ? 7 : headLen > 20 ? 5 : 3),
    resume: s(sumLen > 200 ? 7 : sumLen > 50 ? 5 : 3),
    experience: s(6),
    publications: s(postCount >= 2 ? 6 : postCount === 1 ? 4 : 2),
    reseau: s(5),
    recommandations: s(4),
  };
  const score_global = Math.round((Object.values(scores).reduce((a, b) => a + b.note, 0) / 6) * 10);

  return {
    score_global,
    scores_detail: scores,
    titre_actuel: input.headline || '',
    titre_propose: `Coach ${niche} | J'aide [ta cible] à [résultat concret] | Programmes sur-mesure`,
    resume_actuel: input.summary || '',
    resume_propose: `J'accompagne [ta cible] vers [résultat]. Méthode : [3 piliers]. Résultats clients : [preuve]. Échangeons sur ton objectif — message ouvert.`,
    points_forts: [headLen > 20 ? 'Titre renseigné' : 'Profil présent', postCount >= 1 ? 'Tu publies déjà' : 'Base à activer'],
    problemes: [
      postCount < 2 && { titre: 'Trop peu de publications', description: 'Sur LinkedIn, la régularité construit l’autorité.', impact: 'fort' as const, correction: 'Publie 1 post d’expertise par semaine (réutilise tes posts AuraPost LinkedIn).' },
      headLen <= 20 && { titre: 'Titre peu vendeur', description: 'Ton titre ne dit pas qui tu aides ni le résultat.', impact: 'moyen' as const, correction: 'Format : Coach [niche] | J’aide [cible] à [résultat].' },
      sumLen <= 50 && { titre: 'Résumé trop court', description: 'Le résumé est ta page de vente — il est sous-exploité.', impact: 'moyen' as const, correction: 'Structure : à qui tu t’adresses + ta méthode + une preuve + un CTA.' },
    ].filter(Boolean) as LinkedInAnalysis['problemes'],
    prochaine_action: postCount < 2 ? 'Publie un post d’expertise cette semaine.' : 'Réécris ton titre avec la version proposée.',
  };
}
