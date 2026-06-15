import { logError, logInfo } from './logger';
import { runClaudeCode } from './claude-code';
import { runAnalysisLLM } from './analyze/llm';
import { extractJson } from './parse-json';

// Scraping de page Instagram PUBLIQUE, côté serveur uniquement, sans authentification.
// Instagram bloque massivement les requêtes non authentifiées : on tente une extraction
// best-effort depuis les balises og: et le JSON embarqué, avec un fallback propre.

export interface InstagramData {
  name: string;
  bio: string;
  followers: string | null;
  captions: string[];
}

export type ScrapeResult = { ok: true; data: InstagramData } | { ok: false; reason: string };

export function isInstagramUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?/.test(url.trim());
}

function decode(s: string): string {
  return s
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\\n/g, ' ')
    .trim();
}

export async function scrapeInstagram(url: string): Promise<ScrapeResult> {
  if (!isInstagramUrl(url)) return { ok: false, reason: 'invalid_url' };

  try {
    const res = await fetch(url.trim(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Accept: 'text/html',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
      // Timeout via AbortController
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      logInfo('[instagram] réponse non-OK', { status: res.status });
      return { ok: false, reason: 'blocked' };
    }

    const html = await res.text();

    // og:title contient souvent "Nom (@handle) • Instagram photos and videos"
    const ogTitle = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1] ?? '';
    const ogDesc = html.match(/<meta property="og:description" content="([^"]*)"/)?.[1] ?? '';

    // og:description : "X Followers, Y Following, Z Posts - <bio/caption>"
    const followers = ogDesc.match(/([\d.,]+[KMkm]?)\s+Followers/)?.[1] ?? null;
    const name = decode(ogTitle.split('(')[0]) || decode(ogTitle) || 'Coach';
    const bioPart = ogDesc.includes(' - ') ? ogDesc.split(' - ').slice(1).join(' - ') : '';
    const bio = decode(bioPart).slice(0, 300);

    // Légendes : on tente d'extraire des "caption":"..." du JSON embarqué (limité à 6).
    const captionMatches = [...html.matchAll(/"caption":\s*"((?:[^"\\]|\\.){10,})"/g)]
      .map((m) => decode(m[1]))
      .filter((c) => c.length > 15)
      .slice(0, 6);

    // Compte privé / blocage : aucune donnée exploitable.
    if (!followers && captionMatches.length === 0 && !bio) {
      return { ok: false, reason: 'private_or_blocked' };
    }

    return {
      ok: true,
      data: { name, bio, followers, captions: captionMatches },
    };
  } catch (err) {
    logError('[instagram] scraping échoué', { error: String(err) });
    return { ok: false, reason: 'error' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Analyse du profil scrapé via Claude : extrait le ton, le style et une bio
// reformulée — injectés ensuite dans la génération pour que les posts sonnent
// EXACTEMENT comme le coach écrit. Fallback déterministe si Claude indisponible.
// ─────────────────────────────────────────────────────────────────────────────

export interface InstagramAnalysis {
  ton_dominant: string; // motivant | educatif | humoristique | personnel | inspirant
  style_ecriture: string; // longueur, emojis, ponctuation
  themes_recurrents: string[];
  phrase_caracteristique: string; // max 15 mots
  bio_reformulee: string; // max 30 mots
}

const ANALYSIS_PROMPT = `Analyse ce profil Instagram d'un coach sportif et extrais :
- ton_dominant : un seul mot parmi motivant/educatif/humoristique/personnel/inspirant
- style_ecriture : courte description (longueur des posts, usage emojis, ponctuation)
- themes_recurrents : liste des sujets abordés (3 à 5 items)
- phrase_caracteristique : une phrase typique de ce coach (max 15 mots)
- bio_reformulee : bio reformulée de façon plus percutante (max 30 mots)
Réponds UNIQUEMENT en JSON strict : { "ton_dominant": "...", "style_ecriture": "...", "themes_recurrents": ["..."], "phrase_caracteristique": "...", "bio_reformulee": "..." }`;

const TONES = ['motivant', 'educatif', 'humoristique', 'personnel', 'inspirant'];

function normalizeAnalysis(raw: unknown): InstagramAnalysis | null {
  const o = raw as Record<string, unknown>;
  if (!o) return null;
  const tonRaw = typeof o.ton_dominant === 'string' ? o.ton_dominant.toLowerCase().trim() : '';
  const ton = TONES.find((t) => tonRaw.includes(t)) ?? 'motivant';
  const themes = Array.isArray(o.themes_recurrents)
    ? o.themes_recurrents.map((t) => String(t).trim()).filter(Boolean).slice(0, 5)
    : [];
  const style = typeof o.style_ecriture === 'string' ? o.style_ecriture.trim() : '';
  const phrase = typeof o.phrase_caracteristique === 'string' ? o.phrase_caracteristique.trim() : '';
  const bio = typeof o.bio_reformulee === 'string' ? o.bio_reformulee.trim() : '';
  if (!style && themes.length === 0 && !phrase) return null;
  return {
    ton_dominant: ton,
    style_ecriture: style || 'Posts courts, directs, avec emojis.',
    themes_recurrents: themes,
    phrase_caracteristique: phrase,
    bio_reformulee: bio,
  };
}

export async function analyzeInstagram(data: InstagramData): Promise<InstagramAnalysis> {
  const corpus = [
    `Nom : ${data.name}`,
    data.followers ? `Abonnés : ${data.followers}` : '',
    data.bio ? `Bio : ${data.bio}` : '',
    data.captions.length ? `Dernières légendes :\n- ${data.captions.join('\n- ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const user = `${ANALYSIS_PROMPT}\n\nProfil :\n"""${corpus.slice(0, 4000)}"""`;

  // 1) Chemin production : API Anthropic (ANTHROPIC_API_KEY) — fonctionne sur serverless.
  //    Sans ça, l'analyse du ton tombait silencieusement en mock même avec une clé configurée.
  try {
    const text = await runAnalysisLLM('Tu réponds UNIQUEMENT en JSON strict valide.', user);
    const parsed = normalizeAnalysis(extractJson(text));
    if (parsed) return parsed;
  } catch (err) {
    logInfo('[instagram] API indisponible, essai Claude Code CLI', { error: String(err) });
  }

  // 2) Repli : Claude Code CLI (dev local / tunnel).
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const text = await runClaudeCode(user);
      const parsed = normalizeAnalysis(extractJson(text));
      if (parsed) return parsed;
    } catch (err) {
      logError('[instagram] analyse échouée', { attempt, error: String(err) });
    }
  }
  return mockAnalysis(data);
}

// Fallback : déduit un ton depuis les emojis/mots-clés des légendes.
function mockAnalysis(data: InstagramData): InstagramAnalysis {
  const text = `${data.bio} ${data.captions.join(' ')}`.toLowerCase();
  const ton = /😂|mdr|haha|lol/.test(text)
    ? 'humoristique'
    : /astuce|conseil|technique|comment/.test(text)
      ? 'educatif'
      : /mon parcours|je me souviens|honnêtement/.test(text)
        ? 'personnel'
        : 'motivant';
  const phrase =
    data.captions.find((c) => c.length > 15)?.split(/[.!?\n]/)[0]?.split(' ').slice(0, 15).join(' ') ?? '';
  return {
    ton_dominant: ton,
    style_ecriture: 'Posts courts et rythmés, emojis fréquents, ton direct.',
    themes_recurrents: ['entraînement', 'motivation', 'résultats'],
    phrase_caracteristique: phrase,
    bio_reformulee: (data.bio || '').split(' ').slice(0, 30).join(' '),
  };
}
