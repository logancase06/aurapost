import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/cron-auth';
import { db } from '@/lib/db';
import { tenants, users, generatedPosts, siteVisits } from '@/lib/db/schema';
import { eq, and, gte, count, inArray, sql } from 'drizzle-orm';
import { sendMarketingEmail, shell, button, escHtml } from '@/lib/email';
import { getUnsubscribeUrl } from '@/lib/unsubscribe';
import { logError, logInfo } from '@/lib/logger';
import { isPlanActive } from '@/lib/plans';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';

/**
 * GET|POST /api/cron/monthly-report
 * Envoie à chaque coach actif un rapport mensuel récapitulatif (posts, trafic, leads).
 * À appeler le 1er de chaque mois à 9h (cron externe : Authorization: Bearer $CRON_SECRET).
 *
 * Version batch : 4 requêtes globales au lieu de N×4 (anti N+1).
 */
async function handle(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  const monthStart = new Date(`${monthKey}-01T00:00:00Z`);
  const monthLabel = lastMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // ── 1. Tenants actifs (non-demo) ─────────────────────────────────────────
  const allTenants = await db
    .select({ id: tenants.id, plan: tenants.plan, planExpiresAt: tenants.planExpiresAt })
    .from(tenants)
    .where(and(eq(tenants.status, 'active'), eq(tenants.isDemo, false)))
    .limit(5000);

  const payingTenants = allTenants.filter((t) => isPlanActive(t.plan, t.planExpiresAt));
  if (payingTenants.length === 0) {
    logInfo('[cron:monthly-report] aucun tenant actif', { month: monthKey });
    return NextResponse.json({ ok: true, month: monthKey, sent: 0, skipped: 0, errors: 0 });
  }

  const tenantIds = payingTenants.map((t) => t.id);

  // ── 2. Owners : une seule requête pour tous les tenants ──────────────────
  const ownerRows = await db
    .select({ tenantId: users.tenantId, email: users.email, fullName: users.fullName })
    .from(users)
    .where(inArray(users.tenantId, tenantIds));
  // Un seul owner par tenant (premier trouvé)
  const ownerByTenant = new Map<string, { email: string; fullName: string }>();
  for (const r of ownerRows) {
    if (!ownerByTenant.has(r.tenantId)) ownerByTenant.set(r.tenantId, { email: r.email, fullName: r.fullName });
  }

  // ── 3. Total posts ce mois — GROUP BY tenant_id ──────────────────────────
  const totalPostsRows = await db
    .select({ tenantId: generatedPosts.tenantId, total: count() })
    .from(generatedPosts)
    .where(and(inArray(generatedPosts.tenantId, tenantIds), eq(generatedPosts.month, monthKey)))
    .groupBy(generatedPosts.tenantId);
  const totalPostsByTenant = new Map(totalPostsRows.map((r) => [r.tenantId, Number(r.total)]));

  // ── 4. Posts approuvés ce mois — GROUP BY tenant_id ─────────────────────
  const approvedRows = await db
    .select({ tenantId: generatedPosts.tenantId, total: count() })
    .from(generatedPosts)
    .where(and(
      inArray(generatedPosts.tenantId, tenantIds),
      eq(generatedPosts.month, monthKey),
      eq(generatedPosts.status, 'approved'),
    ))
    .groupBy(generatedPosts.tenantId);
  const approvedByTenant = new Map(approvedRows.map((r) => [r.tenantId, Number(r.total)]));

  // ── 5. Visites site ce mois — GROUP BY tenant_id (best-effort) ───────────
  const visitorsByTenant = new Map<string, number>();
  try {
    const visitRows = await db
      .select({ tenantId: siteVisits.tenantId, total: sql<number>`count(*)` })
      .from(siteVisits)
      .where(and(inArray(siteVisits.tenantId, tenantIds), gte(siteVisits.visitedAt, monthStart)))
      .groupBy(siteVisits.tenantId);
    for (const r of visitRows) visitorsByTenant.set(r.tenantId, Number(r.total));
  } catch {
    // migration 0003 non appliquée → on ignore
  }

  // ── 6. Envoi des emails ──────────────────────────────────────────────────
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const t of payingTenants) {
    const owner = ownerByTenant.get(t.id);
    if (!owner?.email) { skipped++; continue; }

    try {
      const totalPosts = totalPostsByTenant.get(t.id) ?? 0;
      const approvedPosts = approvedByTenant.get(t.id) ?? 0;
      const siteVisitCount = visitorsByTenant.get(t.id) ?? 0;
      const firstName = owner.fullName.split(' ')[0] || 'coach';

      const html = monthlyReportEmail({
        firstName,
        monthLabel,
        totalPosts,
        approvedPosts,
        siteVisitors: siteVisitCount,
        appUrl: APP_URL,
        unsubscribeUrl: getUnsubscribeUrl(t.id),
      });

      const res = await sendMarketingEmail(
        t.id,
        { email: owner.email, name: owner.fullName },
        `Ton rapport ${monthLabel} — AuraPost ✦`,
        html,
        undefined,
      );

      if (res.skipped) { skipped++; continue; }
      if (res.success) sent++;
      else errors++;
    } catch (err) {
      logError('[monthly-report] tenant', { tenantId: t.id, error: String(err) });
      errors++;
    }
  }

  logInfo('[cron:monthly-report] terminé', { month: monthKey, sent, skipped, errors });
  return NextResponse.json({ ok: true, month: monthKey, sent, skipped, errors });
}

function monthlyReportEmail({
  firstName,
  monthLabel,
  totalPosts,
  approvedPosts,
  siteVisitors,
  appUrl,
  unsubscribeUrl,
}: {
  firstName: string;
  monthLabel: string;
  totalPosts: number;
  approvedPosts: number;
  siteVisitors: number;
  appUrl: string;
  unsubscribeUrl: string;
}): string {
  const approvalRate = totalPosts > 0 ? Math.round((approvedPosts / totalPosts) * 100) : 0;
  const stat = (label: string, value: string | number) =>
    `<td style="text-align:center;padding:16px 12px;border-right:1px solid #ede9fe">
      <div style="font-size:28px;font-weight:900;color:#7c3aed">${escHtml(String(value))}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:4px">${escHtml(label)}</div>
    </td>`;

  return shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#1e1b4b">
        Ton rapport ${escHtml(monthLabel)}, ${escHtml(firstName)} ✦
      </h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px">Voici ce que tu as accompli ce mois avec AuraPost.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ede9fe;border-radius:12px;overflow:hidden;margin-bottom:24px">
        <tr>
          ${stat('Posts générés', totalPosts)}
          ${stat('Posts approuvés', approvedPosts)}
          <td style="text-align:center;padding:16px 12px">
            <div style="font-size:28px;font-weight:900;color:#7c3aed">${approvalRate}%</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px">Taux d'approbation</div>
          </td>
        </tr>
      </table>

      ${siteVisitors > 0 ? `
      <div style="background:#f5f3ff;border-radius:10px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:12px">
        <span style="font-size:22px">🌐</span>
        <div>
          <div style="font-size:14px;font-weight:600;color:#1e1b4b">${siteVisitors} visiteur${siteVisitors > 1 ? 's' : ''} sur ton site vitrine</div>
          <div style="font-size:12px;color:#6b7280">Continue à partager l'URL de ton site !</div>
        </div>
      </div>` : ''}

      ${totalPosts === 0 ? `
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 18px;margin-bottom:20px">
        <p style="margin:0;font-size:14px;color:#c2410c;font-weight:600">Tu n'as pas encore généré tes posts de ${escHtml(monthLabel)}.</p>
        <p style="margin:6px 0 0;font-size:13px;color:#9a3412">Clique ci-dessous pour les générer maintenant — ça prend moins d'une minute.</p>
      </div>` : ''}

      ${button(`${appUrl}/dashboard`, 'Voir mon tableau de bord →')}
      <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#9ca3af">Continue comme ça, la régularité fait la différence.</p>
    </td></tr>
  `, unsubscribeUrl);
}

export const GET = handle;
export const POST = handle;
