import { NextResponse } from 'next/server';
import { REFERRAL_COOKIE_TTL } from '@/lib/constants';

/**
 * GET /ref/[code] — point d'entrée d'un lien de parrainage.
 * Pose un cookie HttpOnly de 30 jours AVANT la redirection vers /register,
 * de sorte que le code soit préservé même si l'utilisateur ferme l'onglet
 * et revient plus tard sans le paramètre ?ref= dans l'URL.
 */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clean = (code || '').trim().toUpperCase().slice(0, 16);
  const encoded = encodeURIComponent(clean);

  const res = NextResponse.redirect(new URL(`/register?ref=${encoded}`, req.url));

  if (clean) {
    res.cookies.set('aurapost_ref', clean, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: REFERRAL_COOKIE_TTL,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return res;
}
