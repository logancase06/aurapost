import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db } from '@/lib/db';
import { supportTickets } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { parseBody } from '@/lib/validation';
import { csrfGuard, sanitizeText, isHoneypotTriggered, HONEYPOT_FIELD } from '@/lib/security';
import { logActivity } from '@/lib/db/activity';
import { logError } from '@/lib/logger';

const TicketSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(120),
  email: z.string().email('Email invalide').max(254),
  subject: z.string().min(1, 'Sujet requis').max(160),
  message: z.string().min(5, 'Message trop court').max(4000),
  [HONEYPOT_FIELD]: z.string().max(0).optional(),
});

/** POST /api/support — crée un ticket de support (public, anti-bot). */
export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const raw = await req.json().catch(() => null);
  if (raw && isHoneypotTriggered((raw as Record<string, unknown>)[HONEYPOT_FIELD])) {
    return NextResponse.json({ ok: true }); // piège bot : on fait comme si tout allait bien
  }
  const parsed = parseBody(TicketSchema, raw);
  if (!parsed.ok) return parsed.response;

  try {
    const session = await auth();
    await db.insert(supportTickets).values({
      id: nanoid(),
      tenantId: session?.user?.tenantId ?? null,
      name: sanitizeText(parsed.data.name),
      email: parsed.data.email.toLowerCase().trim(),
      subject: sanitizeText(parsed.data.subject),
      message: sanitizeText(parsed.data.message),
      status: 'open',
      createdAt: new Date().toISOString(),
    });
    await logActivity(session?.user?.tenantId ?? null, session?.user?.id ?? null, 'support_ticket_created', null, {
      subject: parsed.data.subject.slice(0, 60),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('[support] création ticket échouée', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
