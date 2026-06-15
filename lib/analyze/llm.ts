// Appel LLM pour les analyses de profil. Chemin production = API Anthropic
// (ANTHROPIC_API_KEY). Absent/échec → l'appelant bascule sur un mock déterministe.

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
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system,
    messages: [{ role: 'user', content: user }],
  });
  let text = '';
  for (const block of message.content) {
    if (block.type === 'text') text += block.text + '\n';
  }
  if (!text.trim()) throw new Error('Réponse vide de l’API Anthropic');
  return text;
}
