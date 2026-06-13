// Extraction tolérante d'un objet/tableau JSON depuis une réponse texte du SDK
// (retire les fences markdown, isole le premier bloc JSON).
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  const start =
    firstBrace === -1 ? firstBracket : firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket);
  if (start === -1) throw new Error('Aucun JSON détecté');
  const open = cleaned[start];
  const close = open === '{' ? '}' : ']';
  const end = cleaned.lastIndexOf(close);
  if (end === -1) throw new Error('JSON incomplet');
  return JSON.parse(cleaned.slice(start, end + 1));
}
