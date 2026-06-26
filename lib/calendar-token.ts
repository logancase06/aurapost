import crypto from 'node:crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Tokens d'abonnement calendrier (iCal). Même pattern HMAC stateless que
// lib/unsubscribe.ts — génère une URL stable permettant à Google Calendar /
// Apple Calendar de s'abonner sans cookie de session.
//
// Token = HMAC-SHA256(tenantId, CALENDAR_SECRET), encodé base64url.
// L'URL est permanente : elle ne change que si CALENDAR_SECRET change.
// ─────────────────────────────────────────────────────────────────────────────

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';

function secret(): string | null {
  const s = process.env.CALENDAR_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!s) {
    if (process.env.NODE_ENV !== 'test') {
      // Dégradation silencieuse en prod — la route retourne 503 si le secret est absent.
    }
    return null;
  }
  // Préfixe pour isoler l'usage calendrier du secret NextAuth si CALENDAR_SECRET n'est pas défini.
  return s.startsWith('cal:') ? s : `cal:${s}`;
}

function toBase64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function hmac(tenantId: string, key: string): Buffer {
  return crypto.createHmac('sha256', key).update(tenantId).digest();
}

/** Token d'abonnement calendrier (base64url). Vide si le secret est absent. */
export function generateCalendarToken(tenantId: string): string {
  const key = secret();
  if (!key) return '';
  return toBase64Url(hmac(tenantId, key));
}

/** Vérifie un token en temps constant. false si secret/token absent ou invalide. */
export function verifyCalendarToken(tenantId: string, token: string): boolean {
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

/**
 * URL d'abonnement iCal permanente pour un tenant.
 * Compatible Google Calendar, Apple Calendar, Outlook (abonnement continu).
 */
export function getCalendarSubscriptionUrl(tenantId: string): string {
  const token = generateCalendarToken(tenantId);
  if (!token) return '';
  const params = new URLSearchParams({ tenant: tenantId, token });
  return `${APP_URL()}/api/calendar/ical?${params.toString()}`;
}
