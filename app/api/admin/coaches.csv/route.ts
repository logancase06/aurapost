import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdminSession } from '@/lib/admin';
import { listCoaches } from '@/lib/db/admin';
import { logUnauthorized } from '@/lib/security';

export const dynamic = 'force-dynamic';

function csvCell(v: unknown): string {
  const s = String(v ?? '');
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** GET /api/admin/coaches.csv — export CSV de tous les coachs + métriques (admin). */
export async function GET() {
  const session = await auth();
  if (!isAdminSession(session)) {
    logUnauthorized('non-admin', { path: '/api/admin/coaches.csv', userId: session?.user?.id });
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const coaches = await listCoaches();
  const header = ['tenantId', 'marque', 'statut', 'plan', 'email', 'nom', 'specialite', 'ville', 'posts', 'inscritLe'];
  const rows = coaches.map((c) =>
    [c.tenantId, c.tenantName, c.status, c.plan, c.ownerEmail, c.ownerName, c.speciality, c.city, c.postCount, c.createdAt]
      .map(csvCell)
      .join(',')
  );
  const csv = [header.join(','), ...rows].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="aurapost-coachs-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
