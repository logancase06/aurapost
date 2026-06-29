import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { getOrgBySlug, getOrgForTenant } from '@/lib/db/organizations';
import { inviteDistributor } from '@/lib/db/org-invite';
import { csrfGuard } from '@/lib/security';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';
import { logError, logInfo } from '@/lib/logger';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MAX_ROWS = 500;

/** Parse un CSV simple (email, prénom, nom, ville, spécialité). En-tête détecté et ignoré. */
function parseCsv(text: string): { email: string; firstName?: string; lastName?: string; city?: string; speciality?: string }[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  // Ignore l'en-tête s'il ne contient pas d'email (pas de '@').
  const start = lines[0].includes('@') ? 0 : 1;
  const out: ReturnType<typeof parseCsv> = [];
  for (let i = start; i < lines.length && out.length < MAX_ROWS; i++) {
    const cols = lines[i].split(/[,;]/).map((c) => c.trim());
    const email = cols[0];
    if (!email || !email.includes('@')) continue;
    out.push({ email, firstName: cols[1] || undefined, lastName: cols[2] || undefined, city: cols[3] || undefined, speciality: cols[4] || undefined });
  }
  return out;
}

/**
 * POST /api/organizations/[slug]/import-members
 * Body : { csv: string }. Crée un compte distributeur par ligne + magic link.
 * Réservé au propriétaire de l'organisation.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  let tenantId: string;
  try {
    tenantId = await requireTenantId();
  } catch {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 });

  // Le tenant courant doit être propriétaire de CETTE organisation.
  const membership = await getOrgForTenant(tenantId);
  if (!membership || membership.org.id !== org.id || membership.role !== 'owner') {
    return NextResponse.json({ error: 'Réservé au propriétaire de l’organisation' }, { status: 403 });
  }

  const rl = await checkAuthRateLimit(`import-members:${org.id}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: 'Trop d’imports. Réessayez plus tard.' }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const csv = typeof body?.csv === 'string' ? body.csv : '';
  const rows = parseCsv(csv);
  if (rows.length === 0) return NextResponse.json({ error: 'CSV vide ou invalide (colonnes : email, prénom, nom, ville, spécialité).' }, { status: 400 });

  let created = 0;
  let linked = 0;
  const errors: { email: string; error: string }[] = [];
  for (const row of rows) {
    try {
      const res = await inviteDistributor(org.id, org.name, row);
      if (!res.ok) errors.push({ email: row.email, error: res.error ?? 'échec' });
      else if (res.created) created++;
      else linked++;
    } catch (err) {
      logError('[import-members] ligne échouée', { email: row.email.slice(0, 3) + '***', error: String(err) });
      errors.push({ email: row.email, error: 'erreur interne' });
    }
  }

  logInfo('[import-members] terminé', { org: org.slug, created, linked, errors: errors.length });
  return NextResponse.json({ ok: true, total: rows.length, created, linked, errors });
}
