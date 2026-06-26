import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { listScheduledRange } from '@/lib/db/posts';
import { logUnauthorized } from '@/lib/security';
import { verifyCalendarToken } from '@/lib/calendar-token';

export const dynamic = 'force-dynamic';

function icalEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function toICalDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '');
}

/** Calcule le jour suivant (DTEND exclusif pour un événement journée entière, RFC 5545 §3.6.1). */
function nextDayICalDate(iso: string): string {
  const d = new Date(iso.slice(0, 10) + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function buildICalResponse(tenantId: string): Promise<NextResponse> {
  return (async () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString();
    const posts = await listScheduledRange(tenantId, start, end);

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AuraPost//Calendrier editorial//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:AuraPost — Calendrier éditorial',
    ];

    for (const p of posts) {
      if (!p.scheduledFor) continue;
      const day = toICalDate(p.scheduledFor);
      const dayEnd = nextDayICalDate(p.scheduledFor);
      const summary = `${p.network === 'linkedin' ? 'LinkedIn' : 'Instagram'} — ${p.title ?? p.theme ?? 'Post'}`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${p.id}@aurapost.fr`,
        `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${dayEnd}`,
        `SUMMARY:${icalEscape(summary)}`,
        `DESCRIPTION:${icalEscape(p.content.slice(0, 300))}`,
        'END:VEVENT'
      );
    }
    lines.push('END:VCALENDAR');

    return new NextResponse(lines.join('\r\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="aurapost-calendrier.ics"',
        'Cache-Control': 'no-store',
      },
    });
  })();
}

/**
 * GET /api/calendar/ical — exporte le calendrier éditorial (posts planifiés) au format iCal.
 *
 * Deux modes d'authentification :
 * - Session (cookie) : pour le téléchargement direct depuis l'app.
 * - Token HMAC (?tenant=<id>&token=<hmac>) : pour l'abonnement continu depuis
 *   Google Calendar / Apple Calendar / Outlook. URL stable générée par
 *   getCalendarSubscriptionUrl() (lib/calendar-token.ts).
 *
 * Fenêtre : 6 mois autour de la date courante (−3 / +3).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paramToken = searchParams.get('token');
  const paramTenant = searchParams.get('tenant');

  // ── Voie 1 : token HMAC (abonnement calendrier externe) ──────────────────
  if (paramToken && paramTenant) {
    if (!verifyCalendarToken(paramTenant, paramToken)) {
      logUnauthorized('token calendrier invalide', { path: '/api/calendar/ical' });
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }
    return buildICalResponse(paramTenant);
  }

  // ── Voie 2 : session cookie (téléchargement direct depuis l'app) ──────────
  const session = await auth();
  if (!session?.user?.id) {
    logUnauthorized('session manquante', { path: '/api/calendar/ical' });
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const tenantId = await requireTenantId();
  return buildICalResponse(tenantId);
}
