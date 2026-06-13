import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';
import { magicTokens, users } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { sendEmail, magicLinkHtml } from '@/lib/email';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';
import { parseBody, MagicLinkSchema } from '@/lib/validation';
import { logError } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    // Rate limit : 3 magic links / IP / 15 min.
    const ip =
      req.headers.get('x-nf-client-connection-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown';
    const rl = await checkAuthRateLimit(`magic:${ip}`, 3, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: `Trop de tentatives. Réessayez dans ${rl.retryAfterSec}s.` }, { status: 429 });
    }

    const raw = await req.json().catch(() => null);
    const parsed = parseBody(MagicLinkSchema, raw);
    if (!parsed.ok) return parsed.response;
    const email = parsed.data.email.toLowerCase().trim();

    const [user] = await db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Réponse identique si l'utilisateur n'existe pas (anti-énumération + anti-timing).
    if (!user) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
      return NextResponse.json({ ok: true });
    }

    // Invalide tous les magic links précédents non utilisés pour cet email.
    await db
      .update(magicTokens)
      .set({ usedAt: new Date().toISOString() })
      .where(and(eq(magicTokens.email, email), isNull(magicTokens.usedAt)));

    const token = nanoid(48);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await db.insert(magicTokens).values({
      id: nanoid(),
      email,
      token,
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const link = `${baseUrl}/auth/magic?token=${token}`;

    await sendEmail({ email, name: user.fullName }, 'Votre lien de connexion AuraPost', magicLinkHtml(user.fullName, link));

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('[magic-link]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
