// Appel LLM pour les analyses de profil. Chemin production = API Anthropic
// (ANTHROPIC_API_KEY). Absent/échec → l'appelant bascule sur un mock déterministe.

import { withAnthropicRetry } from '@/lib/anthropic-retry';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

export function analysisLLMConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/** Appel direct à l'API Anthropic. Lève si la clé est absente ou la réponse vide. */
export async function runAnalysisLLM(system: string, user: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY absente');
  const mod = await import('@anthropic-ai/sdk');
  const Anthropic = mod.default;
  const client = new Anthropic();
  // 30 s par tentative, max 3 tentatives (429/5xx sont retentés avec backoff).
  const message = await withAnthropicRetry(() => client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system,
    messages: [{ role: 'user', content: user }],
  }, { timeout: 30_000 }), 'runAnalysisLLM');
  let text = '';
  for (const block of message.content) {
    if (block.type === 'text') text += block.text + '\n';
  }
  if (!text.trim()) throw new Error('Réponse vide de l’API Anthropic');
  return text;
}
