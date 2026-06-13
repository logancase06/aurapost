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
