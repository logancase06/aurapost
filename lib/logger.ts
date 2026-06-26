// Logger applicatif. Console par defaut ; drain Axiom si AXIOM_DATASET + AXIOM_TOKEN
// sont configures (fire-and-forget, ne bloque jamais la requete principale).

type LogContext = Record<string, string | number | boolean | null | undefined>;
type LogLevel = 'info' | 'warn' | 'error';

/**
 * Envoie un log vers Axiom (HTTP ingest API) de facon asynchrone.
 * Ne leve jamais — le logging ne doit pas casser le flux applicatif.
 * Voir docs/infra/logging.md pour la procedure de configuration.
 */
function drainToAxiom(level: LogLevel, message: string, context?: LogContext): void {
  const dataset = process.env.AXIOM_DATASET;
  const token = process.env.AXIOM_TOKEN;
  if (!dataset || !token) return;

  void fetch(`https://api.axiom.co/v1/datasets/${dataset}/ingest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      {
        _time: new Date().toISOString(),
        level,
        message,
        app: 'aurapost',
        ...(context ?? {}),
      },
    ]),
  }).catch(() => {
    /* Drain best-effort : on ne relance pas en cas d'erreur reseau */
  });
}

export function logInfo(message: string, context?: LogContext) {
  console.log(`[INFO] ${message}`, context ?? '');
  drainToAxiom('info', message, context);
}

export function logWarn(message: string, context?: LogContext) {
  console.warn(`[WARN] ${message}`, context ?? '');
  drainToAxiom('warn', message, context);
}

export function logError(message: string, context?: LogContext) {
  console.error(`[ERROR] ${message}`, context ?? '');
  drainToAxiom('error', message, context);
}

/**
 * Log structure d'un evenement metier (analytics/observabilite). JSON en une ligne
 * capture tel quel par Netlify/Axiom. Ne leve JAMAIS.
 */
export function logEvent(event: string, tenantId: string | null, metadata?: LogContext): void {
  try {
    const payload = { type: 'event', event, tenantId, ts: new Date().toISOString(), ...(metadata ?? {}) };
    console.log(JSON.stringify(payload));
    drainToAxiom('info', event, { tenantId: tenantId ?? undefined, ...metadata });
  } catch {
    /* logging best-effort */
  }
}
