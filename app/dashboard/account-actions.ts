'use server';

import { nanoid } from 'nanoid';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { magicTokens } from '@/lib/db/schema';
import { sendEmail, verifyEmailHtml } from '@/lib/email';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';
import { logError } from '@/lib/logger';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/** Renvoie l'email de vérification (token 48h). Rate-limit 3/h pour éviter le spam. */
export async function resendVerificationEmail(): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: 'Non autorisé' };
  if (session.user.emailVerifiedAt) return { ok: true }; // déjà vérifié

  const rl = await checkAuthRateLimit(`verify-resend:${session.user.email.toLowerCase()}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) return { ok: false, error: `Trop de tentatives. Réessaie dans ${rl.retryAfterSec}s.` };

  try {
    const token = nanoid(32);
    await db.insert(magicTokens).values({
      id: nanoid(),
      email: session.user.email.toLowerCase(),
      token,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });
    await sendEmail(
      { email: session.user.email, name: session.user.name ?? 'Coach' },
      'Vérifiez votre adresse email — AuraPost',
      verifyEmailHtml(session.user.name ?? 'Coach', `${APP_URL}/api/auth/verify-email?token=${token}`)
    );
    return { ok: true };
  } catch (err) {
    logError('[resendVerificationEmail]', { error: String(err) });
    return { ok: false, error: 'Envoi impossible.' };
  }
}
