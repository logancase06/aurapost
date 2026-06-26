# Logging en production — AuraPost

> `lib/logger.ts` expose `logInfo`, `logError`, `logEvent`. Aujourd'hui ils wrappent
> `console.log/error`. En production, il faut une destination persistante pour pouvoir
> déboguer les incidents.

---

## Recommandation : Axiom

**Pourquoi Axiom :** intégration native Next.js 16 via `next-axiom`, zéro boilerplate,
capture automatique des logs `console.*` ET des Web Vitals, UI de requêtes excellente,
tier gratuit généreux (25 GB/mois). Fonctionne nativement avec Netlify.

### Installation

```bash
npm install next-axiom
```

### Configuration

`next.config.ts` :
```ts
import { withAxiom } from 'next-axiom';
export default withAxiom(nextConfig);
```

`lib/logger.ts` — remplacer `console.log/error` par `log.info/error` du client Axiom :
```ts
import { Logger } from 'next-axiom';
const log = new Logger();

export function logInfo(message: string, context?: LogContext) {
  log.info(message, context ?? {});
}
export function logError(message: string, context?: LogContext) {
  log.error(message, context ?? {});
}
```

### Variables d'environnement

```
AXIOM_DATASET=aurapost-prod
AXIOM_TOKEN=xaat-...        # Settings → API tokens → Ingest (write-only)
```

Créer le dataset sur [app.axiom.co](https://app.axiom.co) → **Datasets → New dataset**.

---

## Alternative : Sentry

**Quand préférer Sentry :** si la capture d'exceptions avec stack trace et le suivi des
performances React (LCP, TTFB) sont prioritaires sur le logging structuré.

### Installation

```bash
npx @sentry/wizard@latest -i nextjs
```

Le wizard configure automatiquement `sentry.client.config.ts`, `sentry.server.config.ts`,
et les variables d'env.

### Variables d'environnement

```
SENTRY_DSN=https://...@o0.ingest.sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@o0.ingest.sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=aurapost
SENTRY_AUTH_TOKEN=sntrys_...     # pour le upload des source maps au build
```

### Intégration dans `lib/logger.ts`

```ts
import * as Sentry from '@sentry/nextjs';

export function logError(message: string, context?: LogContext) {
  console.error(`[ERROR] ${message}`, context ?? '');
  Sentry.captureMessage(message, { level: 'error', extra: context });
}
```

---

## Alternative légère : Logtail / Better Stack

**Quand :** si vous voulez SQL-like queries sur les logs sans setup complexe.

```bash
npm install @logtail/next
```

Variables :
```
LOGTAIL_SOURCE_TOKEN=...
```

---

## Comparatif

| | Axiom | Sentry | Logtail |
|---|---|---|---|
| Next.js 16 natif | ✅ `next-axiom` | ✅ `@sentry/nextjs` | ✅ `@logtail/next` |
| Logs structurés | ✅ excellent | ⚠️ secondaire | ✅ bon |
| Erreurs + stack trace | ⚠️ basique | ✅ excellent | ⚠️ basique |
| Web Vitals | ✅ automatique | ✅ avec perf | ❌ |
| Tier gratuit | 25 GB/mois | 5k erreurs/mois | 1 GB/mois |
| Prix (paid) | ~25 $/mois | ~26 $/mois | ~25 $/mois |

**Recommandation pour AuraPost :** commencer avec **Axiom** (setup 10 min, logging structuré
idéal pour les jobs async / crons). Ajouter Sentry si les erreurs React front-end deviennent
un point de douleur.

---

## Variables à ajouter dans `.env.example`

Déjà documentées dans `.env.example` section `# ── Observabilité`.
