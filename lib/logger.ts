// Logger applicatif. Console par défaut.
// Pour brancher Logtail en prod : `npm i @logtail/node`, puis injecter le transport ici
// (lecture de LOGTAIL_SOURCE_TOKEN). Gardé volontairement sans dépendance pour l'instant.

type LogContext = Record<string, string | number | boolean | null | undefined>;

export function logInfo(message: string, context?: LogContext) {
  console.log(`[INFO] ${message}`, context ?? '');
}

export function logError(message: string, context?: LogContext) {
  console.error(`[ERROR] ${message}`, context ?? '');
}

/**
 * Log structuré d'un évènement métier (analytics/observabilité). JSON en une ligne
 * → capturé tel quel par Netlify/Logtail. Ne lève JAMAIS (le logging ne casse pas le flux).
 */
export function logEvent(event: string, tenantId: string | null, metadata?: LogContext): void {
  try {
    console.log(JSON.stringify({ type: 'event', event, tenantId, ts: new Date().toISOString(), ...(metadata ?? {}) }));
  } catch {
    /* logging best-effort */
  }
}
