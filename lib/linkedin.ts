import { logError, logInfo } from './logger';

// Récupération best-effort d'un profil LinkedIn PUBLIC (headline + résumé) depuis les
// balises og:. LinkedIn bloque agressivement le scraping non authentifié : on extrait
// ce qui est exposé publiquement, avec fallback propre vers la saisie manuelle.

export interface LinkedinData {
  name: string;
  headline: string; // titre pro (ex: "Coach sportif & préparateur Hyrox")
  summary: string; // résumé / description publique si dispo
}

export type LinkedinResult = { ok: true; data: LinkedinData } | { ok: false; reason: string };

export function isLinkedinUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+\/?/.test(url.trim());
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\\n/g, ' ')
    .trim();
}

export async function scrapeLinkedin(url: string): Promise<LinkedinResult> {
  if (!isLinkedinUrl(url)) return { ok: false, reason: 'invalid_url' };

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
      logInfo('[linkedin] réponse non-OK', { status: res.status });
      return { ok: false, reason: 'blocked' };
    }
    const html = await res.text();
    const ogTitle = decode(html.match(/<meta property="og:title" content="([^"]*)"/)?.[1] ?? '');
    const ogDesc = decode(html.match(/<meta property="og:description" content="([^"]*)"/)?.[1] ?? '');

    // og:title : "Prénom Nom - Headline | LinkedIn"
    const name = ogTitle.split(/\s[-|]\s/)[0]?.trim() || 'Coach';
    const headline = ogTitle.includes(' - ') ? ogTitle.split(' - ').slice(1).join(' - ').replace(/\s*\|\s*LinkedIn.*/i, '').trim() : '';
    const summary = ogDesc.slice(0, 600);

    if (!headline && !summary) return { ok: false, reason: 'private_or_blocked' };
    return { ok: true, data: { name, headline, summary } };
  } catch (err) {
    logError('[linkedin] scraping échoué', { error: String(err) });
    return { ok: false, reason: 'error' };
  }
}
