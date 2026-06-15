import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, magicTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { createTenantAndOwner, hashPassword } from '@/lib/db/users-actions';
import { logActivity } from '@/lib/db/activity';
import { sendEmail, welcomeEmail, verifyEmailHtml } from '@/lib/email';
import { checkAuthRateLimit, validatePassword } from '@/lib/auth-rate-limit';
import { parseBody, RegisterSchema } from '@/lib/validation';
import { csrfGuard } from '@/lib/security';
import { recordReferral, notifyReferrerByEmail } from '@/lib/db/referrals';
import { createNotification } from '@/lib/db/notifications';
import { logError, logInfo, logEvent } from '@/lib/logger';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET() {
  // Accès direct en GET → renvoie vers le formulaire d'inscription.
  return NextResponse.redirect(new URL('/register', APP_URL));
}

export async function POST(req: NextRequest) {
  try {
    // Protection CSRF (origine same-site obligatoire pour les mutations).
    const csrf = csrfGuard(req);
    if (csrf) return csrf;

    // Rate limit : 5 inscriptions / IP / heure.
    const ip =
      req.headers.get('x-nf-client-connection-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown';
    const rl = await checkAuthRateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: `Trop de tentatives. Réessayez dans ${rl.retryAfterSec}s.` }, { status: 429 });
    }

    const raw = await req.json().catch(() => null);
    const parsed = parseBody(RegisterSchema, raw);
    if (!parsed.ok) return parsed.response;

    const { name, email, password, brandName, consentGivenAt } = parsed.data;

    const pwdError = validatePassword(password);
    if (pwdError) return NextResponse.json({ error: pwdError }, { status: 400 });

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      // Égalisation de temps — empêche l'énumération d'emails par timing.
      await bcrypt.hash(password, 12);
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    let userId: string;
    let tenantId: string;
    try {
      ({ userId, tenantId } = await createTenantAndOwner({
        email: normalizedEmail,
        passwordHash,
        fullName: name,
        brandName,
        consentGivenAt: consentGivenAt.trim(),
      }));
    } catch (err) {
      const msg = String(err);
      if (msg.includes('UNIQUE') || msg.includes('unique')) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
      }
      logError('[register] création tenant/user échouée', { error: msg });
      return NextResponse.json({ error: 'Erreur lors de la création du compte.' }, { status: 500 });
    }

    await logActivity(tenantId, userId, 'register', userId, { email: normalizedEmail });

    // Parrainage : si inscrit via /ref/[code], crédite 1 mois aux deux coachs.
    if (parsed.data.ref) {
      const referrerTenantId = await recordReferral({
        code: parsed.data.ref,
        refereeTenantId: tenantId,
        refereeEmail: normalizedEmail,
      });
      if (referrerTenantId) {
        await createNotification({
          tenantId: referrerTenantId,
          type: 'referral',
          title: 'Quelqu’un a rejoint AuraPost grâce à vous ✦',
          body: '1 mois gratuit vient d’être crédité sur votre compte.',
          href: '/dashboard/referral',
        });
        void notifyReferrerByEmail(referrerTenantId, name.trim());
      }
    }

    // Email de bienvenue — fire-and-forget, dans la langue détectée du navigateur.
    const welcomeSubject = parsed.data.locale === 'en' ? 'Welcome to AuraPost ✦' : 'Bienvenue sur AuraPost ✦';
    sendEmail(
      { email: normalizedEmail, name: name.trim() },
      welcomeSubject,
      welcomeEmail(name.trim(), undefined, parsed.data.locale ?? 'fr')
    ).catch((err) => logError('[register] welcome email', { error: String(err) }));

    // Email de vérification — séquencé pour garantir la persistance du token avant envoi.
    (async () => {
      try {
        const verifyToken = nanoid(32);
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        await db.insert(magicTokens).values({
          id: nanoid(),
          email: normalizedEmail,
          token: verifyToken,
          expiresAt,
          createdAt: new Date().toISOString(),
        });
        const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${verifyToken}`;
        await sendEmail(
          { email: normalizedEmail, name: name.trim() },
          'Vérifiez votre adresse email — AuraPost',
          verifyEmailHtml(name.trim(), verifyUrl)
        );
      } catch (err) {
        logError('[register] verify email flow', { error: String(err) });
      }
    })();

    logInfo('[register] Compte créé', { userId, tenantId });
    logEvent('auth.register', tenantId, { userId });
    return NextResponse.json({ message: 'Compte créé avec succès' }, { status: 201 });
  } catch (err) {
    logError('[register] Erreur interne', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
