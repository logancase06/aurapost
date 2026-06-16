import { runClaudeCode } from './claude-code';
import { runAnalysisLLM } from './analyze/llm';
import { extractJson } from './parse-json';
import { logError, logInfo } from './logger';

// Analyse des avis clients (texte libre) via le SDK Claude Code, avec fallback mock.

export interface ReviewsAnalysis {
  strengths: string[]; // 3 points forts
  testimonial: string; // phrase percutante (max 20 mots)
  tone: string; // 'motivant' | 'technique' | 'humain'
}

const SYSTEM_PROMPT = `Tu es un expert en copywriting. Analyse ces avis clients d'un coach sportif et extrais :
1. Les 3 points forts principaux (ex: "disponible", "résultats rapides", "bienveillant")
2. Une phrase de témoignage percutante pour une landing page (max 20 mots)
3. Le ton général du coach perçu par ses clients (motivant / technique / humain)
Réponds uniquement en JSON structuré : { "strengths": ["...","...","..."], "testimonial": "...", "tone": "motivant|technique|humain" }`;

function normalize(raw: unknown): ReviewsAnalysis | null {
  const o = raw as Record<string, unknown>;
  const strengths = Array.isArray(o?.strengths) ? o.strengths.map((s) => String(s)).filter(Boolean).slice(0, 3) : [];
  const testimonial = typeof o?.testimonial === 'string' ? o.testimonial.trim() : '';
  const toneRaw = typeof o?.tone === 'string' ? o.tone.toLowerCase() : '';
  const tone = ['motivant', 'technique', 'humain'].includes(toneRaw) ? toneRaw : 'motivant';
  if (strengths.length === 0 || !testimonial) return null;
  return { strengths, testimonial, tone };
}

export async function analyzeReviews(reviewsText: string): Promise<ReviewsAnalysis> {
  const corpus = `Avis clients :\n"""${reviewsText.slice(0, 4000)}"""`;

  // 1) Chemin production : API Anthropic (fonctionne sur serverless). Sans ce chemin,
  //    l'analyse tombait silencieusement en mock même avec ANTHROPIC_API_KEY (la CLI
  //    Claude Code n'existe pas en serverless). Cf. même fix sur analyzeInstagram.
  try {
    const text = await runAnalysisLLM(SYSTEM_PROMPT, corpus);
    const parsed = normalize(extractJson(text));
    if (parsed) return parsed;
  } catch (err) {
    logInfo('[reviews] API indisponible, essai Claude Code CLI', { error: String(err) });
  }

  // 2) Repli : Claude Code CLI (dev local / tunnel).
  const prompt = `${SYSTEM_PROMPT}\n\n${corpus}`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const text = await runClaudeCode(prompt);
      const parsed = normalize(extractJson(text));
      if (parsed) return parsed;
    } catch (err) {
      logError('[reviews] analyse échouée', { attempt, error: String(err) });
    }
  }
  return mockAnalyze(reviewsText);
}

// Fallback déterministe : déduit des points forts depuis des mots-clés fréquents.
function mockAnalyze(text: string): ReviewsAnalysis {
  const lower = text.toLowerCase();
  const candidates: [string, string][] = [
    ['disponible', 'Toujours disponible'],
    ['résultat', 'Résultats rapides'],
    ['bienveil', 'Bienveillant'],
    ['écoute', 'À l’écoute'],
    ['motiv', 'Très motivant'],
    ['professionn', 'Professionnel'],
    ['patient', 'Patient et pédagogue'],
    ['adapt', 'Programmes adaptés'],
  ];
  const found = candidates.filter(([k]) => lower.includes(k)).map(([, label]) => label);
  const strengths = (found.length >= 3 ? found : [...found, 'Accompagnement sur-mesure', 'Suivi régulier', 'Résultats durables']).slice(0, 3);
  const firstSentence = text.split(/[.!?\n]/).map((s) => s.trim()).find((s) => s.length > 15);
  const testimonial = firstSentence
    ? firstSentence.split(' ').slice(0, 20).join(' ')
    : 'Un accompagnement qui change vraiment les résultats.';
  const tone = lower.includes('technique') ? 'technique' : lower.includes('humain') || lower.includes('écoute') ? 'humain' : 'motivant';
  return { strengths, testimonial, tone };
}
