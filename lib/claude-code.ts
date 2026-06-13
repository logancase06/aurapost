import { logError, logInfo } from './logger';

// ─────────────────────────────────────────────────────────────────────────────
// Wrapper autour du SDK Claude Code (@anthropic-ai/claude-code, fonction `query()`).
//
// Aucune ANTHROPIC_API_KEY n'est requise : le SDK s'appuie sur l'installation/auth
// locale de Claude Code. Si le SDK n'est pas disponible à l'exécution (CLI absente,
// non connecté, environnement serverless), `runClaudeCode` lève — l'appelant bascule
// alors proprement sur le générateur mock (cf. lib/content-generator.ts).
//
// Forcer le mock : AURAPOST_USE_MOCK=1 (utile en CI / dev sans Claude Code).
// ─────────────────────────────────────────────────────────────────────────────

const SDK_MODULE = '@anthropic-ai/claude-code';

// Type minimal local : le package n'expose pas de types statiques dans cette version,
// on déclare l'interface dont on a besoin pour rester type-safe côté appelant.
interface SDKMessage {
  type: string;
  result?: string;
  message?: { content?: Array<{ type: string; text?: string }> };
}
type QueryFn = (args: { prompt: string; options?: Record<string, unknown> }) => AsyncIterable<SDKMessage>;

export function isMockForced(): boolean {
  return process.env.AURAPOST_USE_MOCK === '1';
}

let _queryFn: QueryFn | null | undefined;

async function loadQuery(): Promise<QueryFn | null> {
  if (_queryFn !== undefined) return _queryFn;
  try {
    // Spécifieur non littéral → ni TS ni le bundler ne tentent de résoudre statiquement
    // ce package (chargé à l'exécution uniquement, listé dans serverExternalPackages).
    const moduleName = SDK_MODULE;
    const mod = (await import(/* webpackIgnore: true */ moduleName)) as { query?: QueryFn };
    _queryFn = typeof mod.query === 'function' ? mod.query : null;
  } catch (err) {
    logInfo('[claude-code] SDK indisponible — fallback mock', { error: String(err) });
    _queryFn = null;
  }
  return _queryFn;
}

/**
 * Exécute une requête de génération via le SDK Claude Code et retourne le texte final.
 * @throws si le SDK est indisponible ou ne renvoie aucun résultat exploitable.
 */
export async function runClaudeCode(prompt: string, timeoutMs = 120_000): Promise<string> {
  if (isMockForced()) throw new Error('AURAPOST_USE_MOCK actif');

  const query = await loadQuery();
  if (!query) throw new Error('SDK Claude Code indisponible');

  const collected: string[] = [];
  let resultText = '';

  const iterate = (async () => {
    for await (const msg of query({
      prompt,
      options: { maxTurns: 1, permissionMode: 'bypassPermissions' },
    })) {
      if (msg.type === 'result' && typeof msg.result === 'string') {
        resultText = msg.result;
      } else if (msg.type === 'assistant' && msg.message?.content) {
        for (const block of msg.message.content) {
          if (block.type === 'text' && block.text) collected.push(block.text);
        }
      }
    }
  })();

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout SDK Claude Code')), timeoutMs)
  );

  await Promise.race([iterate, timeout]);

  const text = (resultText || collected.join('\n')).trim();
  if (!text) throw new Error('Réponse vide du SDK Claude Code');
  logInfo('[claude-code] génération SDK réussie', { length: text.length });
  return text;
}

export { logError };
