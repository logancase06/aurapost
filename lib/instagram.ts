import { logError, logInfo } from './logger';

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
