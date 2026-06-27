import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { db } from '@/lib/db';
import {
  users, coachProfiles, generatedPosts, websites, subscriptions,
  referrals, referralCodes, notifications, activityLogs, tenants,
  siteLeads, coachPhotos, editedPhotos, socialConnections, socialPublications, siteVisits,
  profileAnalyses, generationJobs, imageEditJobs,
} from '@/lib/db/schema';
import { sendEmail, shell, button, escHtml } from '@/lib/email';
import { csrfGuard, logUnauthorized } from '@/lib/security';
import { logInfo, logError } from '@/lib/logger';
import { deleteR2Object } from '@/lib/r2';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';

function deletionHtml(name: string): string {
  return shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b">Ton compte a bien été supprimé</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
        ${escHtml(name)}, conformément à ta demande, toutes tes données AuraPost ont été définitivement
        effacées. Merci d'avoir fait un bout de chemin avec nous — la porte reste ouverte.
      </p>
      ${button(`${APP_URL}/register`, 'Recréer un compte un jour ?')}
    </td></tr>`);
}

/**
 * POST /api/gdpr/delete — suppression RGPD complète du compte et de toutes les données
 * du tenant, puis email de confirmation. Irréversible. CSRF + auth requis.
 * Body attendu : { confirm: "SUPPRIMER" }.
 */
export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user?.id) {
    logUnauthorized('session manquante', { path: '/api/gdpr/delete' });
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const tenantId = await requireTenantId();

  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== 'SUPPRIMER') {
    return NextResponse.json({ error: 'Confirmation requise (tapez SUPPRIMER).' }, { status: 400 });
  }

  const email = session.user.email ?? '';
  const name = session.user.name ?? 'Coach';

  try {
    // Collecte des clés R2 AVANT la suppression des lignes DB (best-effort RGPD).
    const [photoKeys, editedKeys] = await Promise.all([
      db.select({ r2Key: coachPhotos.r2Key }).from(coachPhotos).where(eq(coachPhotos.tenantId, tenantId)),
      db.select({ r2Key: editedPhotos.r2Key }).from(editedPhotos).where(eq(editedPhotos.tenantId, tenantId)),
    ]);

    // Suppression de toutes les tables scellées au tenant + le tenant lui-même.
    await Promise.all([
      db.delete(generatedPosts).where(eq(generatedPosts.tenantId, tenantId)),
      db.delete(coachProfiles).where(eq(coachProfiles.tenantId, tenantId)),
      db.delete(websites).where(eq(websites.tenantId, tenantId)),
      db.delete(subscriptions).where(eq(subscriptions.tenantId, tenantId)),
      db.delete(referrals).where(eq(referrals.referrerTenantId, tenantId)),
      db.delete(referralCodes).where(eq(referralCodes.tenantId, tenantId)),
      db.delete(notifications).where(eq(notifications.tenantId, tenantId)),
      db.delete(activityLogs).where(eq(activityLogs.tenantId, tenantId)),
      db.delete(siteLeads).where(eq(siteLeads.tenantId, tenantId)),
      db.delete(coachPhotos).where(eq(coachPhotos.tenantId, tenantId)),
      db.delete(editedPhotos).where(eq(editedPhotos.tenantId, tenantId)),
      db.delete(socialConnections).where(eq(socialConnections.tenantId, tenantId)),
      db.delete(socialPublications).where(eq(socialPublications.tenantId, tenantId)),
      db.delete(siteVisits).where(eq(siteVisits.tenantId, tenantId)),
      db.delete(profileAnalyses).where(eq(profileAnalyses.tenantId, tenantId)),
      db.delete(generationJobs).where(eq(generationJobs.tenantId, tenantId)),
      db.delete(imageEditJobs).where(eq(imageEditJobs.tenantId, tenantId)),
    ]);
    await db.delete(users).where(eq(users.tenantId, tenantId));
    await db.delete(tenants).where(eq(tenants.id, tenantId));

    // Purge des fichiers R2 (best-effort : un échec ici ne doit pas bloquer la suppression).
    const r2Keys = [
      ...photoKeys.map((r) => r.r2Key),
      ...editedKeys.map((r) => r.r2Key),
    ].filter((k): k is string => !!k);
    if (r2Keys.length) {
      Promise.all(r2Keys.map(deleteR2Object)).catch((err) =>
        logError('[gdpr/delete] purge R2 partielle', { error: String(err), tenantId })
      );
    }

    if (email) {
      sendEmail({ email, name }, 'Ton compte AuraPost a été supprimé', deletionHtml(name.split(' ')[0] || 'coach')).catch(
        (err) => logError('[gdpr/delete] email confirmation', { error: String(err) })
      );
    }

    logInfo('[gdpr/delete] compte supprimé', { tenantId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('[gdpr/delete] échec', { tenantId, error: String(err) });
    return NextResponse.json({ error: 'Suppression impossible. Réessayez.' }, { status: 500 });
  }
}
