import type { NextRequest } from 'next/server';
import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { createAgencyLead } from '@/lib/db/agency';
import { adminEmails } from '@/lib/admin';
import { sendAgencyLeadNotification, sendAgencyLeadConfirmation } from '@/lib/email';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';
import { sanitizeText } from '@/lib/security';
import { logError, logInfo } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Formulaire public — honeypot `company_website` + rate-limit par IP (anti-spam).
const Schema = z.object({
  company: z.string().min(1).max(160),
  contactName: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().or(z.literal('')),
  distributorCount: z.coerce.number().int().min(0).max(1_000_000).optional(),
  message: z.string().max(2000).optional().or(z.literal('')),
  company_website: z.string().max(0).optional(), // honeypot : doit rester vide
});

function clientIp(req: NextRequest): string {
  return req.headers.get('x-nf-client-connection-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Formulaire invalide.' }, { status: 400 });

  // Honeypot rempli → bot silencieux (on renvoie ok sans rien faire).
  if (parsed.data.company_website) return NextResponse.json({ ok: true });

  const rl = await checkAuthRateLimit(`agency-contact:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: 'Trop de demandes. Réessayez plus tard.' }, { status: 429 });

  const d = parsed.data;
  const lead = {
    company: sanitizeText(d.company).slice(0, 160),
    contactName: sanitizeText(d.contactName).slice(0, 120),
    email: d.email.trim().toLowerCase(),
    phone: d.phone ? sanitizeText(d.phone).slice(0, 40) : null,
    distributorCount: d.distributorCount ?? null,
    message: d.message ? sanitizeText(d.message).slice(0, 2000) : null,
  };

  try {
    await createAgencyLead(lead);
  } catch (err) {
    logError('[agency-contact] insert échoué', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne. Réessayez.' }, { status: 500 });
  }

  // Emails non bloquants mais garantis (after) : notif admin + confirmation prospect.
  after(async () => {
    try {
      const admin = adminEmails()[0];
      if (admin) await sendAgencyLeadNotification({ email: admin }, lead);
      await sendAgencyLeadConfirmation({ email: lead.email, name: lead.contactName.split(' ')[0] || 'là' });
    } catch (err) {
      logError('[agency-contact] emails', { error: String(err) });
    }
  });

  logInfo('[agency-contact] nouveau prospect', { company: lead.company, distributors: lead.distributorCount ?? 0 });
  return NextResponse.json({ ok: true });
}
