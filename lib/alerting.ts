import { sendEmail } from './email';
import { logError } from './logger';

// ─────────────────────────────────────────────────────────────────────────────
// Alerting admin — notifications sur les événements critiques (jobs échoués,
// reconciliation, erreurs inattendues). Envoi email vers ADMIN_ALERT_EMAIL si
// configuré ; sinon logError seul (comportement de développement).
// ─────────────────────────────────────────────────────────────────────────────

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';

function adminEmail(): string | null {
  return process.env.ADMIN_ALERT_EMAIL ?? null;
}

/**
 * Notifie l'admin d'une défaillance critique.
 * Best-effort : ne lève jamais d'exception (ne doit pas interrompre un flux applicatif).
 *
 * @param context - Identifiant du contexte (ex: "generation-job-failed")
 * @param details - Détails supplémentaires à inclure dans l'alerte
 */
type AlertDetails = Record<string, string | number | boolean | null | undefined>;

export async function notifyAdminFailure(context: string, details: AlertDetails): Promise<void> {
  logError(`[alert] ${context}`, details);

  const email = adminEmail();
  if (!email) return;

  const detailLines = Object.entries(details)
    .map(([k, v]) => `<tr><td style="padding:2px 8px;color:#6b7280;font-size:13px">${k}</td><td style="padding:2px 8px;font-size:13px;font-family:monospace">${String(v)}</td></tr>`)
    .join('');

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 8px;font-size:18px;color:#dc2626">⚠ Alerte AuraPost</h2>
      <p style="margin:0 0 16px;color:#374151;font-size:14px"><strong>${context}</strong></p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <tbody>${detailLines}</tbody>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#9ca3af">
        <a href="${APP_URL()}/admin" style="color:#7c3aed">Ouvrir l'admin</a> · ${new Date().toLocaleString('fr-FR')}
      </p>
    </div>`;

  try {
    await sendEmail(
      { email },
      `[AuraPost] Alerte : ${context}`,
      html,
      `Alerte AuraPost\n\nContexte : ${context}\n\n${Object.entries(details).map(([k, v]) => `${k}: ${String(v)}`).join('\n')}`
    );
  } catch (err) {
    logError('[alerting] envoi email alerte echoue', { error: String(err) });
  }
}

/**
 * Notifie l'admin quand des jobs de génération bloqués sont reconciliés vers "failed".
 * Appelé depuis reconcileStuckJobs() quand failed > 0.
 */
export async function notifyJobsReconciled(failed: number, locksReleased: number): Promise<void> {
  await notifyAdminFailure('jobs-generation-reconcilies', {
    jobsEchoues: failed,
    verrouxLiberes: locksReleased,
    action: 'reconcile-stuck-jobs (lambda arrete avant la fin)',
  });
}
