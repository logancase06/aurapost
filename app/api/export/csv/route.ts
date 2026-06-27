import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { listPosts } from '@/lib/db/posts';
import { canExportPost } from '@/lib/plans';

// Export CSV des posts approuvés (prêt à programmer sur Buffer/Later).
function csvEscape(v: string): string {
  // Neutralise l'injection de formules Excel/Sheets : préfixe avec apostrophe
  // les valeurs commençant par =, +, -, @, \t, \r (vecteurs d'injection CSV).
  const sanitized = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  const needsQuote = /[",\n;]/.test(sanitized);
  const escaped = sanitized.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  if (!canExportPost(session.user.plan)) {
    return NextResponse.json({ error: "L'export est réservé aux plans payants." }, { status: 403 });
  }
  const tenantId = await requireTenantId();

  const month = req.nextUrl.searchParams.get('month') ?? undefined;
  const posts = await listPosts(tenantId, { status: 'approved', month });

  const header = ['network', 'title', 'content', 'hashtags', 'callToAction', 'theme', 'month'];
  const lines = [header.join(',')];
  for (const p of posts) {
    lines.push(
      [
        p.network,
        csvEscape(p.title ?? ''),
        csvEscape(p.content),
        csvEscape(p.hashtags.map((h) => `#${h}`).join(' ')),
        csvEscape(p.callToAction ?? ''),
        csvEscape(p.theme ?? ''),
        p.month,
      ].join(',')
    );
  }
  const csv = '﻿' + lines.join('\n'); // BOM pour Excel

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="aurapost-${month ?? 'tous'}.csv"`,
    },
  });
}
