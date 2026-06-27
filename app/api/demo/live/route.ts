import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseBody } from '@/lib/validation';
import { sanitizeText } from '@/lib/security';
import { generateSingleDemoPost } from '@/lib/content-generator';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const LiveSchema = z.object({
  speciality: z.string().min(2, 'Spécialité requise').max(80),
  city: z.string().max(80).optional(),
});

/**
 * POST /api/demo/live — mini-générateur public de la landing (sans inscription).
 * Génère UN post Instagram via le chemin actif (api/tunnel) ou le mock enrichi.
 */
export async function POST(req: NextRequest) {
  // Rate limit strict : endpoint public qui appelle Claude en prod.
  const ip =
    req.headers.get('x-nf-client-connection-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';
  const rl = await checkAuthRateLimit(`demo-live:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: `Trop de tentatives. Réessayez dans ${rl.retryAfterSec}s.` }, { status: 429 });
  }

  const raw = await req.json().catch(() => null);
  const parsed = parseBody(LiveSchema, raw);
  if (!parsed.ok) return parsed.response;

  try {
    const post = await generateSingleDemoPost(
      sanitizeText(parsed.data.speciality),
      parsed.data.city ? sanitizeText(parsed.data.city) : undefined
    );
    return NextResponse.json({
      content: post.content,
      hashtags: post.hashtags,
      callToAction: post.callToAction,
    });
  } catch (err) {
    logError('[demo/live] génération échouée', { error: String(err) });
    return NextResponse.json({ error: 'Génération momentanément indisponible.' }, { status: 503 });
  }
}
