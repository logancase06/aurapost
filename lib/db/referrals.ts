import { nanoid } from 'nanoid';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './index';
import { referralCodes, referrals, tenants, users } from './schema';
import { logError } from '@/lib/logger';
import { sendReferralJoinedEmail } from '@/lib/email';

// ─────────────────────────────────────────────────────────────────────────────
// Parrainage : chaque coach a un code unique (lien /ref/[code]). Un filleul qui
// s'inscrit via ce lien crédite 1 mois gratuit au parrain ET au filleul.
// ─────────────────────────────────────────────────────────────────────────────

const FREE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/** Code lisible : 8 caractères alphanumériques sans ambiguïté. */
function newCode(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 8; i++) c += alphabet[Math.floor(Math.random() * alphabet.length)];
  return c;
}

/** Récupère (ou crée) le code de parrainage d'un tenant. Idempotent. */
export async function getOrCreateReferralCode(tenantId: string, userId: string): Promise<string> {
  const existing = await db
    .select({ code: referralCodes.code })
    .from(referralCodes)
    .where(eq(referralCodes.tenantId, tenantId))
    .limit(1);
  if (existing[0]?.code) return existing[0].code;

  // Réessaie en cas de collision (très improbable sur 30^8).
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    try {
      await db.insert(referralCodes).values({ code, tenantId, userId, createdAt: new Date().toISOString() });
      return code;
    } catch {
      // collision PK → nouvelle tentative
    }
  }
  throw new Error('[referrals] impossible de générer un code unique');
}

export interface ReferralCodeOwner {
  code: string;
  tenantId: string;
  userId: string;
}

/** Résout un code → référent. null si inconnu. */
export async function resolveReferralCode(code: string): Promise<ReferralCodeOwner | null> {
  if (!code) return null;
  const rows = await db
    .select({ code: referralCodes.code, tenantId: referralCodes.tenantId, userId: referralCodes.userId })
    .from(referralCodes)
    .where(eq(referralCodes.code, code.trim().toUpperCase()))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Enregistre un parrainage à l'inscription d'un filleul et crédite 1 mois aux deux
 * parties. Ignoré si le code est inconnu ou si le filleul = le parrain.
 * @returns le tenantId du parrain si crédité, sinon null.
 */
export async function recordReferral(input: {
  code: string;
  refereeTenantId: string;
  refereeEmail: string;
}): Promise<string | null> {
  try {
    const owner = await resolveReferralCode(input.code);
    if (!owner) return null;
    if (owner.tenantId === input.refereeTenantId) return null; // auto-parrainage interdit

    const now = new Date().toISOString();
    await db.insert(referrals).values({
      id: nanoid(),
      code: owner.code,
      referrerTenantId: owner.tenantId,
      refereeTenantId: input.refereeTenantId,
      refereeEmail: input.refereeEmail,
      status: 'credited',
      creditedAt: now,
      createdAt: now,
    });

    // Crédite 1 mois gratuit à chacun (prolonge planExpiresAt).
    await Promise.all([
      extendFreeMonth(owner.tenantId),
      extendFreeMonth(input.refereeTenantId),
    ]);

    return owner.tenantId;
  } catch (err) {
    logError('[recordReferral] échec', { error: String(err) });
    return null;
  }
}

/** Prolonge le plan d'un tenant d'un mois gratuit à partir de la date courante (ou de l'échéance). */
async function extendFreeMonth(tenantId: string): Promise<void> {
  const rows = await db.select({ planExpiresAt: tenants.planExpiresAt }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  const current = rows[0]?.planExpiresAt ? new Date(rows[0].planExpiresAt).getTime() : 0;
  const base = Math.max(current, Date.now());
  await db
    .update(tenants)
    .set({ planExpiresAt: new Date(base + FREE_MONTH_MS).toISOString(), updatedAt: new Date().toISOString() })
    .where(eq(tenants.id, tenantId));
}

export interface ReferralStats {
  code: string;
  referralsCount: number;
  monthsEarned: number;
  referees: { email: string | null; status: string; createdAt: string }[];
}

/** Stats de parrainage d'un tenant pour /dashboard/referral. */
export async function getReferralStats(tenantId: string, userId: string): Promise<ReferralStats> {
  const code = await getOrCreateReferralCode(tenantId, userId);
  const list = await db
    .select({
      email: referrals.refereeEmail,
      status: referrals.status,
      createdAt: referrals.createdAt,
    })
    .from(referrals)
    .where(eq(referrals.referrerTenantId, tenantId))
    .orderBy(desc(referrals.createdAt));

  const credited = list.filter((r) => r.status === 'credited').length;
  return { code, referralsCount: list.length, monthsEarned: credited, referees: list };
}

/**
 * Envoie au parrain l'email « Quelqu'un a rejoint AuraPost grâce à vous ! ».
 * Fire-and-forget : résout l'email du propriétaire du tenant référent.
 */
export async function notifyReferrerByEmail(referrerTenantId: string, refereeName: string): Promise<void> {
  try {
    const rows = await db
      .select({ email: users.email, name: users.fullName })
      .from(users)
      .where(and(eq(users.tenantId, referrerTenantId), eq(users.role, 'owner')))
      .limit(1);
    const owner = rows[0];
    if (!owner?.email) return;
    await sendReferralJoinedEmail({ email: owner.email, name: owner.name || 'Coach' }, refereeName);
  } catch (err) {
    logError('[notifyReferrerByEmail] échec', { error: String(err) });
  }
}

/** Nombre total de filleuls crédités (admin/analytics). */
export async function totalCreditedReferrals(): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(referrals)
    .where(and(eq(referrals.status, 'credited')));
  return Number(rows[0]?.n ?? 0);
}
