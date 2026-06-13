// Shim CJS de nanoid (ESM-only) pour Jest. Suffisamment unique pour les tests.
let counter = 0;

export function nanoid(size = 21): string {
  counter++;
  return `id${counter}_${Math.random().toString(36).slice(2, 2 + Math.max(4, size))}`;
}

export function customAlphabet(alphabet: string, size = 21) {
  return (): string => {
    let s = '';
    for (let i = 0; i < size; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
    return s;
  };
}
