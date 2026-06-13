import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { listScheduledRange } from '@/lib/db/posts';
import { logUnauthorized } from '@/lib/security';

export const dynamic = 'force-dynamic';

function icalEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function toICalDate(iso: string): string {
  // Format VALUE=DATE (jour entier) : YYYYMMDD.
  return iso.slice(0, 10).replace(/-/g, '');
}

/**
 * GET /api/calendar/ical — exporte le calendrier éditorial (posts planifiés) au format iCal.
 * Fenêtre : 6 mois autour de la date courante.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    logUnauthorized('session manquante', { path: '/api/calendar/ical' });
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const tenantId = await requireTenantId();

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
    const summary = `${p.network === 'linkedin' ? 'LinkedIn' : 'Instagram'} — ${p.title ?? p.theme ?? 'Post'}`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${p.id}@aurapost.fr`,
      `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `DTSTART;VALUE=DATE:${day}`,
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
}
