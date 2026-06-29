import { logError, logInfo } from './logger';
import { runClaudeCode } from './claude-code';
import { runAnalysisLLM } from './analyze/llm';
import { extractJson } from './parse-json';

// Scraping Instagram via Apify (priorite) ou HTML direct (fallback).
// Apify contourne les blocages Instagram via leur infrastructure managee.
// Si APIFY_API_KEY absent : direct scrape best-effort (souvent bloque).

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

function extractUsername(url: string): string | null {
  const m = url.match(/instagram\.com\/([A-Za-z0-9._]+)/);
  return m?.[1] ?? null;
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

// ── Apify Instagram Scraper ───────────────────────────────────────────────────

const APIFY_ACTOR = 'apify~instagram-scraper';
const POLL_INTERVAL_MS = 3_000;
const MAX_WAIT_MS = 60_000;

async function scrapeViaApify(url: string): Promise<ScrapeResult> {
  const apiKey = process.env.APIFY_API_KEY;
  if (!apiKey) return { ok: false, reason: 'not_configured' };

  const username = extractUsername(url);
  if (!username) return { ok: false, reason: 'invalid_url' };

  // 1. Lance le run Apify
  let runId: string;
  try {
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR}/runs`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          directUrls: [`https://www.instagram.com/${username}/`],
          resultsType: 'posts',
          resultsLimit: 10,
          addParentData: true,
        }),
        signal: AbortSignal.timeout(15_000),
      }
    );
    if (!runRes.ok) {
      logError('[instagram/apify] demarrage run echoue', { status: runRes.status });
      return { ok: false, reason: 'error' };
    }
    const runData = (await runRes.json()) as { data?: { id?: string } };
    runId = runData?.data?.id ?? '';
    if (!runId) {
      logError('[instagram/apify] pas de runId dans la reponse', {});
      return { ok: false, reason: 'error' };
    }
  } catch (err) {
    logError('[instagram/apify] erreur reseau au demarrage', { error: String(err) });
    return { ok: false, reason: 'error' };
  }

  // 2. Poll jusqu'a SUCCEEDED (max 60s)
  const deadline = Date.now() + MAX_WAIT_MS;
  let status = 'RUNNING';
  while (Date.now() < deadline && status !== 'SUCCEEDED' && status !== 'FAILED' && status !== 'ABORTED') {
    await new Promise<void>((r) => setTimeout(r, POLL_INTERVAL_MS));
    try {
      const statusRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}`,
        { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(10_000) }
      );
      const statusData = (await statusRes.json()) as { data?: { status?: string } };
      status = statusData?.data?.status ?? 'RUNNING';
    } catch {
      // continue polling
    }
  }

  if (status !== 'SUCCEEDED') {
    logInfo('[instagram/apify] run non termine', { status, runId });
    return { ok: false, reason: 'private_or_blocked' };
  }

  // 3. Recupere les items du dataset
  try {
    const dataRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?limit=10`,
      { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(10_000) }
    );
    const items = (await dataRes.json()) as Record<string, unknown>[];
    if (!Array.isArray(items) || items.length === 0) {
      return { ok: false, reason: 'private_or_blocked' };
    }

    // 4. Extrait captions + donnees profil (addParentData=true injecte les infos owner)
    const captions = items
      .map((item) => String(item.caption ?? '').trim())
      .filter((c) => c.length > 5)
      .slice(0, 6);

    const first = items[0];
    const name = String(first.ownerFullName ?? first.ownerUsername ?? username);
    const bio = String(first.biography ?? first.ownerBiography ?? '').slice(0, 300);
    const rawFollowers = first.followersCount ?? first.videoViewCount ?? null;
    const followers = rawFollowers != null ? String(rawFollowers) : null;

    logInfo('[instagram/apify] scrape reussi', { username, captions: captions.length });
    return { ok: true, data: { name, bio, followers, captions } };
  } catch (err) {
    logError('[instagram/apify] erreur recuperation dataset', { error: String(err), runId });
    return { ok: false, reason: 'error' };
  }
}

// ── Scrape direct HTML (fallback si Apify absent) ─────────────────────────────

async function scrapeDirectHtml(url: string): Promise<ScrapeResult> {
  try {
    const res = await fetch(url.trim(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Accept: 'text/html',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      logInfo('[instagram/direct] reponse non-OK', { status: res.status });
      return { ok: false, reason: 'blocked' };
    }

    const html = await res.text();
    const ogTitle = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1] ?? '';
    const ogDesc = html.match(/<meta property="og:description" content="([^"]*)"/)?.[1] ?? '';
    const followers = ogDesc.match(/([\d.,]+[KMkm]?)\s+Followers/)?.[1] ?? null;
    const name = decode(ogTitle.split('(')[0]) || decode(ogTitle) || 'Coach';
    const bioPart = ogDesc.includes(' - ') ? ogDesc.split(' - ').slice(1).join(' - ') : '';
    const bio = decode(bioPart).slice(0, 300);
    const captionMatches = [...html.matchAll(/"caption":\s*"((?:[^"\\]|\\.){10,})"/g)]
      .map((m) => decode(m[1]))
      .filter((c) => c.length > 15)
      .slice(0, 6);

    if (!followers && captionMatches.length === 0 && !bio) {
      return { ok: false, reason: 'private_or_blocked' };
    }
    return { ok: true, data: { name, bio, followers, captions: captionMatches } };
  } catch (err) {
    logError('[instagram/direct] scraping echoue', { error: String(err) });
    return { ok: false, reason: 'error' };
  }
}

// ── Point d'entree public ─────────────────────────────────────────────────────

export async function scrapeInstagram(url: string): Promise<ScrapeResult> {
  if (!isInstagramUrl(url)) return { ok: false, reason: 'invalid_url' };

  // Apify en priorite si configure
  if (process.env.APIFY_API_KEY) {
    const apifyResult = await scrapeViaApify(url);
    // Si Apify a tourne et confirme compte prive/bloque : on arrete la
    if (apifyResult.ok || apifyResult.reason === 'private_or_blocked') return apifyResult;
    // Erreur reseau ou demarrage Apify echoue -> fallback direct
    logInfo('[instagram] fallback direct apres erreur Apify', { reason: apifyResult.reason });
  }

  return scrapeDirectHtml(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Analyse du profil scrape via Claude
// ─────────────────────────────────────────────────────────────────────────────

export interface InstagramAnalysis {
  ton_dominant: string;
  style_ecriture: string;
  themes_recurrents: string[];
  phrase_caracteristique: string;
  bio_reformulee: string;
}

const ANALYSIS_PROMPT = `Analyse ce profil Instagram d'un coach sportif et extrais :
- ton_dominant : un seul mot parmi motivant/educatif/humoristique/personnel/inspirant
- style_ecriture : courte description (longueur des posts, usage emojis, ponctuation)
- themes_recurrents : liste des sujets abordes (3 a 5 items)
- phrase_caracteristique : une phrase typique de ce coach (max 15 mots)
- bio_reformulee : bio reformulee de facon plus percutante (max 30 mots)
Reponds UNIQUEMENT en JSON strict : { "ton_dominant": "...", "style_ecriture": "...", "themes_recurrents": ["..."], "phrase_caracteristique": "...", "bio_reformulee": "..." }`;

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
    data.followers ? `Abonnes : ${data.followers}` : '',
    data.bio ? `Bio : ${data.bio}` : '',
    data.captions.length ? `Dernieres legendes :\n- ${data.captions.join('\n- ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const user = `${ANALYSIS_PROMPT}\n\nProfil :\n"""${corpus.slice(0, 4000)}"""`;

  try {
    const text = await runAnalysisLLM('Tu reponds UNIQUEMENT en JSON strict valide.', user);
    const parsed = normalizeAnalysis(extractJson(text));
    if (parsed) return parsed;
  } catch (err) {
    logInfo('[instagram] API indisponible, essai Claude Code CLI', { error: String(err) });
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const text = await runClaudeCode(user);
      const parsed = normalizeAnalysis(extractJson(text));
      if (parsed) return parsed;
    } catch (err) {
      logError('[instagram] analyse echouee', { attempt, error: String(err) });
    }
  }
  return mockAnalysis(data);
}

function mockAnalysis(data: InstagramData): InstagramAnalysis {
  const text = `${data.bio} ${data.captions.join(' ')}`.toLowerCase();
  const ton = /\u{1F602}|mdr|haha|lol/u.test(text)
    ? 'humoristique'
    : /astuce|conseil|technique|comment/.test(text)
      ? 'educatif'
      : /mon parcours|je me souviens/.test(text)
        ? 'personnel'
        : 'motivant';
  const phrase =
    data.captions.find((c) => c.length > 15)?.split(/[.!?\n]/)[0]?.split(' ').slice(0, 15).join(' ') ?? '';
  return {
    ton_dominant: ton,
    style_ecriture: 'Posts courts et rythmes, emojis frequents, ton direct.',
    themes_recurrents: ['entrainement', 'motivation', 'resultats'],
    phrase_caracteristique: phrase,
    bio_reformulee: (data.bio || '').split(' ').slice(0, 30).join(' '),
  };
}
