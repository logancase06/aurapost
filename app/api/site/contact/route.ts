import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getCoachContactEmail } from '@/lib/db/public';
import { sendContactEmail } from '@/lib/email';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';
import { isValidEmail } from '@/lib/utils';
import { logError } from '@/lib/logger';
import { db } from '@/lib/db';
import { siteLeads } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

// Formulaire de contact public d'un site coach → email au coach via Resend.
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-nf-client-connection-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown';
    const rl = await checkAuthRateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) return NextResponse.json({ error: 'Trop de messages. Réessayez plus tard.' }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const subdomain = typeof body?.subdomain === 'string' ? body.subdomain : '';
    const name = typeof body?.name === 'string' ? body.name.slice(0, 120).trim() : '';
    const email = typeof body?.email === 'string' ? body.email.slice(0, 254).trim() : '';
    const message = typeof body?.message === 'string' ? body.message.slice(0, 4000).trim() : '';

    if (!subdomain || !name || !isValidEmail(email) || message.length < 5) {
      return NextResponse.json({ error: 'Formulaire incomplet.' }, { status: 400 });
    }

    const coach = await getCoachContactEmail(subdomain);
    if (!coach) return NextResponse.json({ error: 'Coach introuvable.' }, { status: 404 });

    // Sauvegarder le lead en DB (best-effort, ne bloque pas l'email si ça échoue).
    try {
      await db.insert(siteLeads).values({
        id: nanoid(),
        tenantId: coach.tenantId,
        name,
        email,
        message,
        source: 'contact_form',
        status: 'new',
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      logError('[site/contact] lead insert', { error: String(e) });
    }

    await sendContactEmail({ email: coach.email, name: coach.name }, { name, email, message });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('[site/contact]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
