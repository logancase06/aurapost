import { scrapeInstagram, isInstagramUrl, type InstagramData } from '@/lib/instagram';
import { extractJson } from '@/lib/parse-json';
import { logError } from '@/lib/logger';
import { runAnalysisLLM } from './llm';
import { InstagramAnalysisSchema, type InstagramAnalysis, type AnalyzeContext, type AnalyzeResult } from './types';

export interface InstagramAnalyzeInput {
  url?: string;
  /** Légendes collées manuellement (compte privé / repli). */
  manualCaptions?: string[];
  ctx?: AnalyzeContext;
}

/** Extrait les hashtags présents dans un ensemble de légendes. */
function extractHashtags(captions: string[]): string[] {
  const tags = new Set<string>();
  for (const c of captions) for (const m of c.matchAll(/#([\p{L}0-9_]+)/gu)) tags.add(m[1].toLowerCase());
  return [...tags].slice(0, 15);
}

function avgLen(captions: string[]): number {
  if (captions.length === 0) return 0;
  return Math.round(captions.reduce((s, c) => s + c.length, 0) / captions.length);
}

const SYSTEM = 'Tu es un expert en marketing Instagram pour les coachs sportifs. Tu réponds TOUJOURS en JSON strict valide, sans texte avant ni après.';

function buildPrompt(data: InstagramData, hashtags: string[], ctx?: AnalyzeContext): string {
  const niche = [ctx?.speciality, ctx?.city].filter(Boolean).join(' · ') || 'coaching sportif';
  return `Analyse ce profil Instagram et donne des recommandations précises et actionnables.

Données du profil :
- Nom : ${data.name || ctx?.displayName || 'Coach'}
- Niche : ${niche}
- Bio : ${data.bio || '(vide)'}
- Abonnés : ${data.followers ?? 'inconnu'}
- Longueur moyenne des légendes : ${avgLen(data.captions)} caractères
- 6 dernières légendes : ${data.captions.length ? data.captions.map((c, i) => `\n${i + 1}. ${c.slice(0, 300)}`).join('') : '(aucune)'}
- Hashtags utilisés : ${hashtags.length ? hashtags.map((h) => `#${h}`).join(' ') : '(aucun)'}

Retourne UNIQUEMENT ce JSON (notes sur 10, score_global sur 100) :
{
  "score_global": 0,
  "scores_detail": { "bio": {"note":0,"max":10}, "frequence": {"note":0,"max":10}, "contenu": {"note":0,"max":10}, "hashtags": {"note":0,"max":10}, "engagement": {"note":0,"max":10}, "appel_action": {"note":0,"max":10}, "coherence": {"note":0,"max":10}, "originalite": {"note":0,"max":10} },
  "points_forts": ["", "", ""],
  "problemes": [ { "titre": "", "description": "", "impact": "fort|moyen|faible", "correction": "" } ],
  "bio_actuelle": "${(data.bio || '').replace(/"/g, "'")}",
  "bio_proposee": "",
  "hashtags_actuels": ${JSON.stringify(hashtags)},
  "hashtags_proposes": ["", "", "", "", "", "", "", "", "", ""],
  "meilleur_post": "",
  "pourquoi_meilleur": "",
  "post_a_ameliorer": "",
  "comment_ameliorer": "",
  "creneaux_recommandes": ["", "", ""],
  "prochaine_action": ""
}`;
}

/** Analyse complète d'un profil Instagram (scrape ou légendes manuelles) + repli mock. */
export async function analyzeInstagramProfile(input: InstagramAnalyzeInput): Promise<AnalyzeResult<InstagramAnalysis>> {
  let data: InstagramData | null = null;

  if (input.url) {
    if (!isInstagramUrl(input.url)) return { ok: false, reason: 'invalid', message: 'URL Instagram invalide.' };
    const scrape = await scrapeInstagram(input.url);
    if (scrape.ok) data = scrape.data;
    else if (!input.manualCaptions?.length) {
      return { ok: false, reason: 'private', message: 'Compte privé ou illisible — colle manuellement tes 3 dernières légendes.' };
    }
  }

  if (!data) {
    const captions = (input.manualCaptions ?? []).map((c) => c.trim()).filter(Boolean).slice(0, 6);
    if (captions.length === 0) return { ok: false, reason: 'invalid', message: 'Fournis une URL publique ou des légendes.' };
    data = { name: input.ctx?.displayName ?? 'Coach', bio: '', followers: null, captions };
  }

  const hashtags = extractHashtags(data.captions);

  try {
    const text = await runAnalysisLLM(SYSTEM, buildPrompt(data, hashtags, input.ctx));
    const parsed = InstagramAnalysisSchema.safeParse(extractJson(text));
    if (parsed.success) return { ok: true, analysis: parsed.data, source: 'api' };
    logError('[analyze/instagram] parse échoué', { issues: parsed.error.issues.length });
  } catch (err) {
    logError('[analyze/instagram] LLM indisponible — mock', { error: String(err) });
  }

  return { ok: true, analysis: mockInstagram(data, hashtags, input.ctx), source: 'mock' };
}

// ── Mock déterministe (sans clé) — heuristiques simples mais cohérentes ──────────
function mockInstagram(data: InstagramData, hashtags: string[], ctx?: AnalyzeContext): InstagramAnalysis {
  const niche = ctx?.speciality ?? 'coaching sportif';
  const city = ctx?.city ?? null;
  const capCount = data.captions.length;
  const hasCTA = data.captions.some((c) => /(dm|message|réserve|réservez|lien|bio|écris|contacte)/i.test(c));
  const hasHash = hashtags.length > 0;
  const bioLen = (data.bio || '').length;

  const s = (n: number) => ({ note: Math.max(0, Math.min(10, n)), max: 10 });
  const scores = {
    bio: s(bioLen > 80 ? 7 : bioLen > 20 ? 5 : 3),
    frequence: s(capCount >= 6 ? 6 : 4),
    contenu: s(capCount >= 4 ? 7 : 5),
    hashtags: s(hasHash ? (hashtags.length >= 8 ? 7 : 5) : 2),
    engagement: s(5),
    appel_action: s(hasCTA ? 7 : 3),
    coherence: s(6),
    originalite: s(5),
  };
  const detailAvg = Object.values(scores).reduce((a, b) => a + b.note, 0) / 8;
  const score_global = Math.round(detailAvg * 10);

  const nicheTag = niche.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
  const cityTag = city ? city.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '') : null;
  const proposes = [
    nicheTag, 'coachsportif', 'coaching', 'fitnessfrance', 'objectifforme',
    'transformationphysique', 'motivationsport', 'preparationphysique',
    ...(cityTag ? [`coach${cityTag}`, `sport${cityTag}`] : ['coachindependant', 'sportsante']),
  ].slice(0, 10);

  const best = [...data.captions].sort((a, b) => b.length - a.length)[0] ?? '';
  const worst = [...data.captions].sort((a, b) => a.length - b.length)[0] ?? '';

  return {
    score_global,
    scores_detail: scores,
    points_forts: [
      hasHash ? 'Tu utilises déjà des hashtags' : 'Profil actif',
      capCount >= 4 ? 'Tu publies régulièrement du contenu' : 'Présence établie',
      bioLen > 20 ? 'Ta bio décrit ton activité' : 'Compte identifiable',
    ],
    problemes: [
      !hasCTA && { titre: 'Aucun appel à l’action clair', description: 'Tes légendes n’invitent pas à passer à l’étape suivante.', impact: 'fort' as const, correction: 'Termine chaque post par une action : « Envoie-moi GO en message ».' },
      !hasHash && { titre: 'Hashtags absents ou faibles', description: 'Sans hashtags ciblés, ta portée locale est limitée.', impact: 'moyen' as const, correction: `Ajoute 8-10 hashtags niche + ville (ex : #${nicheTag}${cityTag ? `, #coach${cityTag}` : ''}).` },
      bioLen <= 20 && { titre: 'Bio trop courte', description: 'Ta bio ne dit pas à qui tu t’adresses ni ce que tu apportes.', impact: 'moyen' as const, correction: 'Structure : qui tu aides + résultat + appel à l’action.' },
    ].filter(Boolean) as InstagramAnalysis['problemes'],
    bio_actuelle: data.bio || '',
    bio_proposee: `Coach ${niche}${city ? ` à ${city}` : ''} 💪 J'aide à atteindre tes objectifs sans te blesser. Programmes sur-mesure · Réserve ton bilan offert 👇`,
    hashtags_actuels: hashtags,
    hashtags_proposes: proposes,
    meilleur_post: best,
    pourquoi_meilleur: best ? 'Le plus développé : il raconte quelque chose et retient l’attention plus longtemps.' : 'Pas assez de données pour comparer.',
    post_a_ameliorer: worst && worst !== best ? worst : '',
    comment_ameliorer: 'Ajoute un hook en première ligne et un appel à l’action clair à la fin.',
    creneaux_recommandes: ['Lundi 7h', 'Mercredi 12h', 'Vendredi 18h'],
    prochaine_action: !hasCTA
      ? 'Ajoute un appel à l’action clair à ton prochain post (« Envoie-moi GO »).'
      : 'Optimise ta bio avec la version proposée ci-dessous.',
  };
}
