import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { db } from '@/lib/db';
import { siteLeads } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Non autorisé', { status: 401 });
  const tenantId = await requireTenantId();

  const leads = await db
    .select()
    .from(siteLeads)
    .where(eq(siteLeads.tenantId, tenantId))
    .orderBy(desc(siteLeads.createdAt));

  const headers = ['Date', 'Nom', 'Email', 'Téléphone', 'Message', 'Source', 'Statut'];
  const rows = leads.map((l) => [
    new Date(l.createdAt).toLocaleDateString('fr-FR'),
    l.name,
    l.email,
    l.phone ?? '',
    (l.message ?? '').replace(/\n/g, ' '),
    l.source,
    l.status,
  ]);

  // Neutralise l'injection de formules Excel/Sheets (=, +, -, @, \t, \r en début de cellule).
  const safeCell = (cell: string) => {
    const s = /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [headers, ...rows].map((row) => row.map((cell) => safeCell(String(cell))).join(',')).join('\n');
  const bom = '﻿';

  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
