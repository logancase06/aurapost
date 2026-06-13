// ─────────────────────────────────────────────────────────────────────────────
// État des intégrations externes — source unique de vérité pour /status et
// /api/health/detailed. N'expose JAMAIS la moindre valeur de clé : uniquement un
// booléen « configuré » + un mode (live | mock) + un libellé.
//
// Chaque intégration d'AuraPost possède un fallback mock : l'app reste fonctionnelle
// sans aucune clé (mode démonstration), c'est pourquoi « non configuré » ≠ « en panne ».
// ─────────────────────────────────────────────────────────────────────────────

export type IntegrationMode = 'live' | 'mock';

export interface IntegrationStatus {
  key: string;
  label: string;
  mode: IntegrationMode;
  /** true = au moins une clé/identifiant détecté dans l'environnement. */
  configured: boolean;
  /** Description courte du comportement courant (sans données sensibles). */
  detail: string;
  /** Optionnel : variables d'env attendues (noms uniquement). */
  envVars: string[];
}

function has(...names: string[]): boolean {
  return names.every((n) => {
    const v = process.env[n];
    return typeof v === 'string' && v.trim().length > 0;
  });
}

export function getIntegrationStatuses(): IntegrationStatus[] {
  const turso = has('TURSO_DATABASE_URL');
  const tursoToken = has('TURSO_AUTH_TOKEN');
  const resend = has('RESEND_API_KEY');
  const stripe = has('STRIPE_SECRET_KEY');
  const stripeWebhook = has('STRIPE_WEBHOOK_SECRET');
  const r2 = has('R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME');
  const redis = has('UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN');
  const authSecret = has('NEXTAUTH_SECRET') || has('AUTH_SECRET');

  return [
    {
      key: 'database',
      label: 'Base de données (Turso)',
      mode: turso ? 'live' : 'mock',
      configured: turso,
      detail: turso
        ? tursoToken
          ? 'Connectée à Turso (libSQL).'
          : 'URL Turso détectée mais TURSO_AUTH_TOKEN manquant.'
        : 'SQLite en mémoire (démo) — données non persistées.',
      envVars: ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'],
    },
    {
      key: 'auth',
      label: 'Authentification (NextAuth)',
      mode: authSecret ? 'live' : 'mock',
      configured: authSecret,
      detail: authSecret ? 'Secret de session configuré.' : 'NEXTAUTH_SECRET manquant — sessions non sécurisées.',
      envVars: ['NEXTAUTH_SECRET', 'NEXTAUTH_URL'],
    },
    {
      key: 'email',
      label: 'Emails transactionnels (Resend)',
      mode: resend ? 'live' : 'mock',
      configured: resend,
      detail: resend ? 'Envoi réel via Resend.' : 'Emails simulés en console (mock).',
      envVars: ['RESEND_API_KEY', 'RESEND_FROM'],
    },
    {
      key: 'payments',
      label: 'Paiements (Stripe)',
      mode: stripe ? 'live' : 'mock',
      configured: stripe,
      detail: stripe
        ? stripeWebhook
          ? 'Checkout + webhook configurés.'
          : 'Clé Stripe détectée mais STRIPE_WEBHOOK_SECRET manquant.'
        : 'Billing en mode démonstration (checkout désactivé).',
      envVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_CONTENT_ONLY', 'STRIPE_PRICE_PACK_COMPLET'],
    },
    {
      key: 'storage',
      label: 'Stockage photos (Cloudflare R2)',
      mode: r2 ? 'live' : 'mock',
      configured: r2,
      detail: r2 ? 'Uploads stockés sur R2.' : 'Photos converties en data URL (mock, non persistées).',
      envVars: ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL'],
    },
    {
      key: 'cache',
      label: 'Cache & rate limit (Upstash Redis)',
      mode: redis ? 'live' : 'mock',
      configured: redis,
      detail: redis ? 'Redis distribué actif.' : 'Cache/rate-limit en mémoire (par instance).',
      envVars: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    },
  ];
}

/** Résumé agrégé : nombre d'intégrations live vs mock. */
export function getIntegrationsSummary() {
  const all = getIntegrationStatuses();
  const live = all.filter((i) => i.mode === 'live').length;
  return { total: all.length, live, mock: all.length - live, allLive: live === all.length };
}
