// ─────────────────────────────────────────────────────────────────────────────
// Détection du type d'image par MAGIC BYTES (signature binaire réelle), et NON par
// le `file.type` déclaré par le navigateur (falsifiable). Zéro dépendance : on ne
// reconnaît que les formats image qu'on accepte. Couplé au re-encodage sharp côté
// R2, ça empêche le stockage d'un fichier malveillant déguisé en image.
// ─────────────────────────────────────────────────────────────────────────────

export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | 'image/heic' | 'image/heif';

// Marques ISO-BMFF (boîte `ftyp`) correspondant à du HEIC/HEIF.
const HEIF_BRANDS = new Set(['heic', 'heix', 'hevc', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1', 'heif']);

/**
 * Renvoie le vrai type MIME d'un buffer image d'après sa signature, ou null si
 * ce n'est pas un format image reconnu.
 */
export function detectImageMime(buf: Buffer): ImageMime | null {
  if (buf.length < 12) return null;

  // JPEG : FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';

  // PNG : 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) {
    return 'image/png';
  }

  // GIF : "GIF87a" / "GIF89a"
  if (buf.toString('ascii', 0, 3) === 'GIF') return 'image/gif';

  // WebP : "RIFF"...."WEBP"
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';

  // HEIC/HEIF : boîte `ftyp` (offset 4-7) + marque connue (offset 8-11).
  if (buf.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buf.toString('ascii', 8, 12).toLowerCase();
    if (HEIF_BRANDS.has(brand)) return brand === 'mif1' || brand === 'msf1' || brand === 'heif' ? 'image/heif' : 'image/heic';
  }

  return null;
}

/**
 * Valide un buffer image contre une liste de types autorisés (par défaut tous les
 * formats reconnus). Renvoie le type réel si valide, sinon null.
 */
export function validateImage(buf: Buffer, allowed: readonly ImageMime[]): ImageMime | null {
  const mime = detectImageMime(buf);
  return mime && allowed.includes(mime) ? mime : null;
}

/** Formats acceptés pour les photos coach (bibliothèque posts). */
export const POST_PHOTO_MIME: readonly ImageMime[] = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/** Formats acceptés pour les photos du site vitrine. */
export const SITE_PHOTO_MIME: readonly ImageMime[] = ['image/jpeg', 'image/png', 'image/webp'];
