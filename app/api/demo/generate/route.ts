import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { generateDemoPosts } from '@/lib/content-generator';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';

// Démo publique sans inscription : génère 3 posts exemple (mock, sans clé ni DB).
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-nf-client-connection-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';
  const rl = await checkAuthRateLimit(`demo:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: `Trop de tentatives. Réessayez dans ${rl.retryAfterSec}s.` }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const speciality = typeof body?.speciality === 'string' ? body.speciality.slice(0, 160) : '';
  const tone = typeof body?.tone === 'string' ? body.tone : 'motivant';
  const city = typeof body?.city === 'string' ? body.city.slice(0, 120) : '';
  if (!speciality.trim()) {
    return NextResponse.json({ error: 'Indiquez votre spécialité.' }, { status: 400 });
  }

  const posts = generateDemoPosts(speciality, tone, city);
  return NextResponse.json({ posts });
}
