/**
 * scripts/check-env.ts
 * Vérifie la présence des variables d'environnement et logue un avertissement clair
 * pour chacune des manquantes. Conçu pour être lancé au démarrage / en CI :
 *
 *   npx tsx scripts/check-env.ts            # rapport complet, n'échoue jamais
 *   npx tsx scripts/check-env.ts --strict   # exit 1 s'il manque une var CRITIQUE
 *
 * Aucune valeur de clé n'est affichée — seulement présent/absent.
 */

type Severity = 'critical' | 'recommended' | 'optional';

interface EnvSpec {
  name: string;
  severity: Severity;
  description: string;
  /** Si vrai et absent, l'app bascule sur un mock fonctionnel (pas bloquant). */
  hasMock?: boolean;
}

const SPECS: EnvSpec[] = [
  // ── Critiques en production ──
  { name: 'NEXTAUTH_SECRET', severity: 'critical', description: 'Signe les sessions JWT (openssl rand -base64 32).' },
  { name: 'NEXTAUTH_URL', severity: 'critical', description: 'URL canonique de l’app (callbacks auth).' },
  { name: 'NEXT_PUBLIC_APP_URL', severity: 'critical', description: 'URL publique (liens emails, og:image, sitemap).' },

  // ── Recommandées (mock propre si absentes) ──
  { name: 'TURSO_DATABASE_URL', severity: 'recommended', hasMock: true, description: 'Base Turso ; sinon SQLite mémoire.' },
  { name: 'TURSO_AUTH_TOKEN', severity: 'recommended', hasMock: true, description: 'Token Turso (avec TURSO_DATABASE_URL).' },
  { name: 'RESEND_API_KEY', severity: 'recommended', hasMock: true, description: 'Envoi d’emails ; sinon console mock.' },
  { name: 'STRIPE_SECRET_KEY', severity: 'recommended', hasMock: true, description: 'Paiements ; sinon billing démo.' },
  { name: 'STRIPE_WEBHOOK_SECRET', severity: 'recommended', hasMock: true, description: 'Vérifie la signature des webhooks Stripe.' },

  // ── Optionnelles ──
  { name: 'STRIPE_PRICE_CONTENT_ONLY', severity: 'optional', hasMock: true, description: 'Price ID plan Content Only.' },
  { name: 'STRIPE_PRICE_PACK_COMPLET', severity: 'optional', hasMock: true, description: 'Price ID plan Pack Complet.' },
  { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', severity: 'optional', hasMock: true, description: 'Clé publique Stripe (front).' },
  { name: 'R2_ACCOUNT_ID', severity: 'optional', hasMock: true, description: 'Cloudflare R2 (stockage photos).' },
  { name: 'R2_ACCESS_KEY_ID', severity: 'optional', hasMock: true, description: 'R2 access key.' },
  { name: 'R2_SECRET_ACCESS_KEY', severity: 'optional', hasMock: true, description: 'R2 secret key.' },
  { name: 'R2_BUCKET_NAME', severity: 'optional', hasMock: true, description: 'R2 bucket.' },
  { name: 'R2_PUBLIC_URL', severity: 'optional', hasMock: true, description: 'Base URL publique du bucket R2.' },
  { name: 'UPSTASH_REDIS_REST_URL', severity: 'optional', hasMock: true, description: 'Redis distribué (rate limit/cache).' },
  { name: 'UPSTASH_REDIS_REST_TOKEN', severity: 'optional', hasMock: true, description: 'Token Upstash Redis.' },
  { name: 'ADMIN_EMAILS', severity: 'optional', description: 'Emails autorisés sur /admin (séparés par virgule).' },
  { name: 'CRON_SECRET', severity: 'recommended', hasMock: true, description: 'Protège les routes /api/cron/*.' },
];

const present = (name: string) => {
  const v = process.env[name];
  return typeof v === 'string' && v.trim().length > 0;
};

const C = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

export interface CheckResult {
  missingCritical: string[];
  missingRecommended: string[];
  missingOptional: string[];
  ok: boolean;
}

/** Exécute la vérification et logue un rapport lisible. */
export function checkEnv({ silent = false }: { silent?: boolean } = {}): CheckResult {
  const missingCritical: string[] = [];
  const missingRecommended: string[] = [];
  const missingOptional: string[] = [];

  const lines: string[] = [];
  for (const spec of SPECS) {
    if (present(spec.name)) {
      if (!silent) lines.push(`  ${C.green('✓')} ${spec.name}`);
      continue;
    }
    const tag = spec.hasMock ? C.dim('(mock actif)') : C.dim('(pas de mock)');
    if (spec.severity === 'critical') {
      missingCritical.push(spec.name);
      if (!silent) lines.push(`  ${C.red('✗')} ${C.bold(spec.name)} ${C.red('CRITIQUE')} — ${spec.description} ${tag}`);
    } else if (spec.severity === 'recommended') {
      missingRecommended.push(spec.name);
      if (!silent) lines.push(`  ${C.yellow('!')} ${spec.name} ${C.yellow('recommandée')} — ${spec.description} ${tag}`);
    } else {
      missingOptional.push(spec.name);
      if (!silent) lines.push(`  ${C.dim('·')} ${spec.name} ${C.dim('optionnelle')} — ${spec.description} ${tag}`);
    }
  }

  if (!silent) {
    console.log(`\n${C.bold('AuraPost — vérification des variables d’environnement')}\n`);
    console.log(lines.join('\n'));
    console.log(
      `\n${C.bold('Résumé')} : ${C.red(`${missingCritical.length} critiques`)} · ` +
        `${C.yellow(`${missingRecommended.length} recommandées`)} · ` +
        `${C.dim(`${missingOptional.length} optionnelles`)} manquantes.\n`
    );
    if (missingCritical.length) {
      console.log(C.red('⚠ Des variables CRITIQUES manquent — l’app fonctionnera en mode dégradé/démo.\n'));
    } else {
      console.log(C.green('✓ Toutes les variables critiques sont présentes.\n'));
    }
  }

  return { missingCritical, missingRecommended, missingOptional, ok: missingCritical.length === 0 };
}

// Exécution directe en CLI.
const isMain = typeof process !== 'undefined' && process.argv[1] && /check-env\.(ts|js|mjs)$/.test(process.argv[1]);
if (isMain) {
  const result = checkEnv();
  if (process.argv.includes('--strict') && !result.ok) process.exit(1);
}
