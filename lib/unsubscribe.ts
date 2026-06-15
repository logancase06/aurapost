import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { tenants } from './db/schema';
import { logError } from './logger';

// ─────────────────────────────────────────────────────────────────────────────
// Désabonnement email (RGPD/LCEN). Token de désabonnement = HMAC-SHA256 du tenantId
// avec UNSUBSCRIBE_SECRET → lien permanent, vérifiable sans stockage (stateless),
// en temps constant (anti-timing). Le token n'est JAMAIS journalisé.
// ─────────────────────────────────────────────────────────────────────────────

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'contact@aurapost.fr';

/** Secret HMAC. Absent → throw en dev (on veut le savoir), null + log en prod (dégradation). */
function secret(): string | null {
  const s = process.env.UNSUBSCRIBE_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === 'development') {
      throw new Error('UNSUBSCRIBE_SECRET manquant — requis pour générer/vérifier les liens de désabonnement.');
    }
    logError('[unsubscribe] UNSUBSCRIBE_SECRET absent — tokens désactivés', {});
    return null;
  }
  return s;
}

function toBase64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function hmac(tenantId: string, key: string): Buffer {
  return crypto.createHmac('sha256', key).update(tenantId).digest();
}

/** Token de désabonnement (base64url) pour un tenant. '' si le secret est absent (prod). */
export function generateUnsubscribeToken(tenantId: string): string {
  const key = secret();
  if (!key) return '';
  return toBase64Url(hmac(tenantId, key));
}

/** Vérifie un token en temps constant. Renvoie false si secret/token absent ou invalide. */
export function verifyUnsubscribeToken(tenantId: string, token: string): boolean {
  const key = secret();
  if (!key || !token) return false;
  const expected = hmac(tenantId, key);
  let provided: Buffer;
  try {
    provided = Buffer.from(token.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  } catch {
    return false;
  }
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(provided, expected);
}

/** Lien de désabonnement (permanent). Repli mailto si le secret est absent. */
export function getUnsubscribeUrl(tenantId: string): string {
  const token = generateUnsubscribeToken(tenantId);
  if (!token) return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Désabonnement emails AuraPost')}`;
  return `${APP_URL()}/api/unsubscribe?tenant=${encodeURIComponent(tenantId)}&token=${token}`;
}

/** Lien de réabonnement (utilisé sur la page de confirmation /unsubscribed). */
export function getResubscribeUrl(tenantId: string, token: string): string {
  return `${APP_URL()}/api/resubscribe?tenant=${encodeURIComponent(tenantId)}&token=${encodeURIComponent(token)}`;
}

/** true si le tenant s'est désabonné des emails marketing. Fail-open (false) en cas d'erreur DB. */
export async function isUnsubscribed(tenantId: string): Promise<boolean> {
  try {
    const [row] = await db.select({ at: tenants.unsubscribedAt }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    return !!row?.at;
  } catch (err) {
    logError('[unsubscribe] lecture du statut échouée', { error: String(err) });
    return false;
  }
}

/** Désabonne (value=true) ou réabonne (value=false) un tenant. Idempotent. */
export async function setUnsubscribed(tenantId: string, value: boolean): Promise<void> {
  await db
    .update(tenants)
    .set({ unsubscribedAt: value ? new Date().toISOString() : null, updatedAt: new Date().toISOString() })
    .where(eq(tenants.id, tenantId));
}
