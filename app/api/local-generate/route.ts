import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runClaudeCode } from '@/lib/claude-code';
import { logError, logInfo } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 180; // Claude Code (mode print) peut être lent pour 12 posts

// ─────────────────────────────────────────────────────────────────────────────
// Route locale du tunnel Cloudflare (Chemin 2).
//
// Tourne sur la machine du dev/beta (où le SDK Claude Code `query()` est disponible).
// Netlify (production) appelle ${CLAUDE_TUNNEL_URL}/api/local-generate avec le header
// X-Tunnel-Secret. On exécute le prompt via Claude Code et on renvoie le texte généré.
//
// Sécurité : seule une requête portant le bon X-Tunnel-Secret est acceptée (401 sinon).
// ─────────────────────────────────────────────────────────────────────────────

/** Comparaison à temps constant pour éviter les timing attacks sur le secret. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(req: NextRequest) {
  const expected = process.env.TUNNEL_SECRET ?? '';
  const provided = req.headers.get('x-tunnel-secret') ?? '';

  // Si aucun secret n'est configuré, l'endpoint reste fermé (pas d'accès anonyme).
  if (!expected || !safeEqual(provided, expected)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  logInfo('[local-generate] requête tunnel authentifiée', {});

  const body = (await req.json().catch(() => ({}))) as { prompt?: string };
  const prompt = typeof body.prompt === 'string' ? body.prompt : '';
  if (!prompt.trim()) {
    return NextResponse.json({ error: 'Prompt manquant' }, { status: 400 });
  }

  try {
    const text = await runClaudeCode(prompt);
    return NextResponse.json({ text });
  } catch (err) {
    logError('[local-generate] échec Claude Code', { error: String(err) });
    return NextResponse.json({ error: 'Génération locale impossible' }, { status: 502 });
  }
}
