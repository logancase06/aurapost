import { inArray, like, sql } from 'drizzle-orm';
import { db } from './db';
import { orgTenants, organizations, users, activityLogs } from './db/schema';
import { sendDistributorNudgeEmail } from './email';
import { logActivity } from './db/activity';
import { logError, logInfo } from './logger';

// ─────────────────────────────────────────────────────────────────────────────
// Relance d'activation des distributeurs (réseaux). Déclenché 1×/jour par cron.
// S'appuie sur users.first_login_at (jamais connecté) + activity_logs (dernière action).
//
//  Jamais connecté :  J+1 → relance 1 · J+3 → relance 2 · J+7 → relance finale
//  Connecté inactif : aucune action depuis 14 j → email de réengagement (max 1 / 21 j)
//
// Idempotent via activity_logs (action `dist_act_{step}`) pour ne jamais doubler.
// ─────────────────────────────────────────────────────────────────────────────

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export interface ActivationResult {
  processed: number;
  sent: { step: string; email: string }[];
}

export async function runDistributorActivation(): Promise<ActivationResult> {
  const result: ActivationResult = { processed: 0, sent: [] };

  const links = await db.select({ orgId: orgTenants.orgId, tenantId: orgTenants.tenantId, role: orgTenants.role }).from(orgTenants);
  const members = links.filter((l) => l.role !== 'owner');
  if (members.length === 0) return result;

  const tenantIds = members.map((m) => m.tenantId);
  const orgIds = [...new Set(links.map((l) => l.orgId))];

  const [memberUsers, orgs, lastLogs, actLogs] = await Promise.all([
    db.select({ id: users.id, tenantId: users.tenantId, email: users.email, name: users.fullName, firstLoginAt: users.firstLoginAt, createdAt: users.createdAt }).from(users).where(inArray(users.tenantId, tenantIds)),
    db.select({ id: organizations.id, name: organizations.name }).from(organizations).where(inArray(organizations.id, orgIds)),
    db.select({ tenantId: activityLogs.tenantId, last: sql<string>`max(${activityLogs.createdAt})` }).from(activityLogs).where(inArray(activityLogs.tenantId, tenantIds)).groupBy(activityLogs.tenantId),
    db.select({ userId: activityLogs.userId, action: activityLogs.action, createdAt: activityLogs.createdAt }).from(activityLogs).where(like(activityLogs.action, 'dist_act_%')),
  ]);

  const userByTenant = new Map(memberUsers.map((u) => [u.tenantId, u]));
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  const lastActMap = new Map(lastLogs.map((l) => [l.tenantId, l.last]));
  // Étapes déjà envoyées (once-ever) : `${userId}|${action}`.
  const sentSet = new Set(actLogs.map((a) => `${a.userId}|${a.action}`));
  // Dernière relance de réengagement par user (pour le verrou 21 j).
  const lastReengage = new Map<string, string>();
  for (const a of actLogs) {
    if (a.action === 'dist_act_reengage') {
      const prev = lastReengage.get(a.userId ?? '');
      if (!prev || a.createdAt > prev) lastReengage.set(a.userId ?? '', a.createdAt);
    }
  }

  for (const m of members) {
    const u = userByTenant.get(m.tenantId);
    if (!u) continue;
    result.processed++;
    const org = orgName.get(m.orgId) ?? 'votre réseau';
    const firstName = u.name.split(' ')[0] || 'coach';

    if (!u.firstLoginAt) {
      const age = daysSince(u.createdAt);
      const step = age >= 7 ? 'J7' : age >= 3 ? 'J3' : age >= 1 ? 'J1' : null;
      if (!step) continue;
      const action = `dist_act_${step}`;
      if (sentSet.has(`${u.id}|${action}`)) continue;
      try {
        const res = await sendDistributorNudgeEmail({ email: u.email, name: firstName }, org);
        if (res.success) {
          await logActivity(m.tenantId, u.id, action, null, { step });
          result.sent.push({ step, email: u.email });
        }
      } catch (err) {
        logError('[dist-activation] relance échouée', { email: u.email, step, error: String(err) });
      }
    } else {
      // Connecté mais inactif depuis > 14 j → réengagement (max 1 / 21 j).
      const last = lastActMap.get(m.tenantId);
      const inactive = !last || daysSince(last) >= 14;
      const reengagedRecently = (() => {
        const r = lastReengage.get(u.id);
        return r ? daysSince(r) < 21 : false;
      })();
      if (inactive && !reengagedRecently) {
        try {
          const res = await sendDistributorNudgeEmail({ email: u.email, name: firstName }, org);
          if (res.success) {
            await logActivity(m.tenantId, u.id, 'dist_act_reengage', null, {});
            result.sent.push({ step: 'reengage', email: u.email });
          }
        } catch (err) {
          logError('[dist-activation] réengagement échoué', { email: u.email, error: String(err) });
        }
      }
    }
  }

  logInfo('[dist-activation] run terminé', { processed: result.processed, sent: result.sent.length });
  return result;
}
