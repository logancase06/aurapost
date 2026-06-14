import { spawn } from 'node:child_process';
import { logError, logInfo } from './logger';

// ─────────────────────────────────────────────────────────────────────────────
// Wrapper autour de Claude Code (utilisé par la route locale du tunnel).
//
// Deux chemins, dans l'ordre :
//   1. SDK programmatique `@anthropic-ai/claude-code` (fonction `query()`) — si une
//      version le ré-expose un jour.
//   2. CLI `claude -p` (mode print, non interactif) via stdin — chemin actif aujourd'hui,
//      car la v2.x du package est un binaire CLI sans `query()` importable.
//
// Aucune ANTHROPIC_API_KEY requise : Claude Code s'appuie sur l'auth locale de la CLI.
// Indisponible (CLI absente / non connectée / serverless) → l'appelant bascule sur le mock.
// Forcer le mock : AURAPOST_USE_MOCK=1.
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
 * Exécute Claude Code en mode print (`claude -p`), prompt envoyé sur stdin.
 * Chemin actif (la v2.x du package n'expose pas de `query()` importable).
 */
function runViaCli(prompt: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ['-p', '--output-format', 'text'];
    const model = process.env.ANTHROPIC_MODEL;
    if (model) args.push('--model', model);

    // shell:true sur Windows pour résoudre le shim `claude` (claude.cmd) sur le PATH.
    const child = spawn('claude', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });

    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Timeout CLI Claude Code'));
    }, timeoutMs);

    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0 && out.trim()) {
        logInfo('[claude-code] génération CLI réussie', { length: out.length });
        resolve(out);
      } else {
        reject(new Error(`CLI Claude Code (code=${code}) ${err.slice(0, 200)}`));
      }
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

/**
 * Exécute une requête de génération via Claude Code (SDK si dispo, sinon CLI print).
 * @throws si aucun chemin n'est disponible ou si la réponse est vide.
 */
export async function runClaudeCode(prompt: string, timeoutMs = 120_000): Promise<string> {
  if (isMockForced()) throw new Error('AURAPOST_USE_MOCK actif');

  const query = await loadQuery();
  if (!query) {
    // Pas de SDK importable → on pilote la CLI Claude Code en mode print.
    return runViaCli(prompt, timeoutMs);
  }

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
