import { NextResponse, type NextRequest } from 'next/server';
import { logActivity } from '@/lib/db/activity';
import { logError } from '@/lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de sécurité applicative : sanitisation des inputs, anti-bot (honeypot),
// protection CSRF par vérification d'origine, et journalisation des accès refusés.
//
// Note : React échappe déjà le rendu (pas d'injection HTML via JSX). La sanitisation
// ci-dessous est une défense en profondeur AVANT insertion en base.
// ─────────────────────────────────────────────────────────────────────────────

const TAG_RE = /<\/?[a-z][\s\S]*?>/gi;
const CONTROL_RE = new RegExp("[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]", "g");

/**
 * Nettoie une chaîne utilisateur avant stockage : retire balises HTML, protocoles
 * dangereux et caractères de contrôle, normalise les espaces. Idempotent.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(TAG_RE, '') // balises HTML
    .replace(/javascript:/gi, '') // URIs script
    .replace(/data:text\/html/gi, '')
    .replace(/on\w+\s*=/gi, '') // handlers inline
    .replace(CONTROL_RE, '')
    .trim();
}

/** Sanitise récursivement toutes les valeurs string d'un objet plat (body JSON). */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === 'string' ? sanitizeText(v) : v;
  }
  return out as T;
}

/**
 * Honeypot anti-bot : le formulaire public embarque un champ caché (ex: `company`).
 * Un humain ne le remplit jamais ; un bot oui. Retourne true si un bot est détecté.
 */
export const HONEYPOT_FIELD = 'company_website';

export function isHoneypotTriggered(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Protection CSRF : vérifie que l'Origin (ou Referer) de la requête correspond à
 * l'hôte de la requête. Les Server Actions Next ont déjà cette protection ; on
 * l'applique aux Route Handlers mutatifs (POST/PUT/DELETE) consommés par des forms.
 */
export function isSameOrigin(req: NextRequest | Request): boolean {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;

  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const host = req.headers.get('host');
  if (!host) return false;

  const sourceUrl = origin ?? referer;
  if (!sourceUrl) return false; // pas d'origine vérifiable → refus
  try {
    return new URL(sourceUrl).host === host;
  } catch {
    return false;
  }
}

/** Réponse 403 standard si l'origine ne correspond pas (CSRF). */
export function csrfGuard(req: NextRequest | Request): NextResponse | null {
  if (isSameOrigin(req)) return null;
  return NextResponse.json({ error: 'Origine non autorisée (CSRF).' }, { status: 403 });
}

/**
 * Journalise une tentative d'accès non autorisé dans activity_logs.
 * Fire-and-forget (n'interrompt jamais le flux appelant).
 */
export function logUnauthorized(
  reason: string,
  meta: { tenantId?: string | null; userId?: string | null; path?: string; ip?: string } = {}
): void {
  void logActivity(meta.tenantId ?? null, meta.userId ?? null, 'unauthorized_access', null, {
    reason,
    path: meta.path,
    ip: meta.ip,
  }).catch((err) => logError('[logUnauthorized] échec', { error: String(err) }));
}

/** Taille maximale d'un upload photo, côté serveur (5 Mo). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export interface UploadSizeResult {
  ok: boolean;
  response?: NextResponse;
}

/** Vérifie qu'un fichier/dataURL ne dépasse pas MAX_UPLOAD_BYTES. */
export function checkUploadSize(sizeBytes: number): UploadSizeResult {
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    const mb = (MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0);
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Photo trop lourde. Taille maximale : ${mb} Mo.` },
        { status: 413 }
      ),
    };
  }
  return { ok: true };
}

/** Estime la taille en octets d'une data URL base64 (`data:image/...;base64,xxxx`). */
export function dataUrlByteSize(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return dataUrl.length;
  const b64 = dataUrl.slice(comma + 1);
  // 4 caractères base64 = 3 octets, moins le padding.
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}
