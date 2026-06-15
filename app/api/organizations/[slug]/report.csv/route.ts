import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { getOrgBySlug, getOrgForTenant, listOrgMembersWithStats } from '@/lib/db/organizations';

export const dynamic = 'force-dynamic';

function csvCell(v: unknown): string {
  const s = String(v ?? '');
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Export CSV du reporting réseau — réservé au propriétaire de l'organisation. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
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
  if (!org) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  const membership = await getOrgForTenant(tenantId);
  if (!membership || membership.org.id !== org.id || membership.role !== 'owner') {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 });
  }

  const members = await listOrgMembersWithStats(org.id);
  const header = ['Nom', 'Email', 'Ville', 'Posts (mois)', 'Posts (total)', 'Approuvés', 'Taux approbation %', 'Site publié', 'Dernière activité'];
  const lines = [header.join(',')];
  for (const m of members) {
    lines.push([
      csvCell(m.name), csvCell(m.email), csvCell(m.city), m.postsThisMonth, m.totalPosts,
      m.approved, m.approvalRate, m.siteActive ? 'oui' : 'non', csvCell(m.lastActivity ?? ''),
    ].join(','));
  }

  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="aurapost-reseau-${org.slug}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
