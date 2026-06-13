// ─────────────────────────────────────────────────────────────────────────────
// Catalogue d'images externes VÉRIFIÉES (HTTP 200 au moment du build).
// - Photos fitness/sport : Unsplash CDN direct (images.unsplash.com/photo-…),
//   stable et sans clé d'API (contrairement à source.unsplash.com, retiré).
// - Avatars : i.pravatar.cc.
// Les hôtes sont autorisés dans la CSP (proxy.ts) et next.config (remotePatterns).
// ─────────────────────────────────────────────────────────────────────────────

const UNSPLASH = 'https://images.unsplash.com/photo-';

/** Construit une URL Unsplash optimisée (largeur + qualité + recadrage). */
export function unsplash(id: string, w = 600, h?: number, q = 70): string {
  const crop = h ? `&h=${h}&fit=crop` : '&fit=crop';
  return `${UNSPLASH}${id}?w=${w}${crop}&q=${q}&auto=format`;
}

// IDs vérifiés (fitness, musculation, running, yoga, coaching, nutrition).
export const FITNESS_PHOTO_IDS = [
  '1534438327276-14e5300c3a48', // haltères salle
  '1571019613454-1cb2f99b2d8b', // box jump / training
  '1517836357463-d25dfeac3438', // course / cardio
  '1483721310020-03333e577078', // running route
  '1518611012118-696072aa579a', // kettlebell
  '1549060279-7e168fcee0c2', // sprint piste
  '1546483875-ad9014c88eba', // course extérieure
  '1540497077202-7c8a3999166f', // gym équipement
  '1538805060514-97d9cc17730c', // squat barre
  '1574680096145-d05b474e2155', // yoga
  '1599058917212-d750089bc07e', // training corde
  '1581009146145-b5ef050c2e1e', // coach / haltères
  '1605296867304-46d5465a13f1', // pompes / sol
  '1552674605-db6ffd4facb5', // salle de sport
  '1594381898411-846e7d193883', // musculation
  '1611672585731-fa10603fb9e0', // entraînement fonctionnel
];

export interface StockPost {
  id: string;
  src: string;
  caption: string;
}

/** Mini-posts Instagram « après » (photo + légende motivante courte). */
export const AFTER_POSTS: StockPost[] = [
  { id: FITNESS_PHOTO_IDS[0], src: unsplash(FITNESS_PHOTO_IDS[0], 400, 400), caption: 'La régularité bat l’intensité 💪' },
  { id: FITNESS_PHOTO_IDS[5], src: unsplash(FITNESS_PHOTO_IDS[5], 400, 400), caption: 'Ton seul adversaire : toi d’hier 🔥' },
  { id: FITNESS_PHOTO_IDS[8], src: unsplash(FITNESS_PHOTO_IDS[8], 400, 400), caption: 'Technique avant performance.' },
  { id: FITNESS_PHOTO_IDS[2], src: unsplash(FITNESS_PHOTO_IDS[2], 400, 400), caption: '6h du matin, on pousse 🌅' },
  { id: FITNESS_PHOTO_IDS[9], src: unsplash(FITNESS_PHOTO_IDS[9], 400, 400), caption: 'Mobilité = longévité.' },
  { id: FITNESS_PHOTO_IDS[4], src: unsplash(FITNESS_PHOTO_IDS[4], 400, 400), caption: 'Un pas aujourd’hui > zéro demain.' },
  { id: FITNESS_PHOTO_IDS[10], src: unsplash(FITNESS_PHOTO_IDS[10], 400, 400), caption: 'Pas de motivation ? Commence quand même.' },
  { id: FITNESS_PHOTO_IDS[14], src: unsplash(FITNESS_PHOTO_IDS[14], 400, 400), caption: 'Les résultats aiment la constance.' },
  { id: FITNESS_PHOTO_IDS[15], src: unsplash(FITNESS_PHOTO_IDS[15], 400, 400), caption: 'Bois. Dors. Recommence. 💧' },
];

/** Grille de filigrane pour le fond du hero (tuiles fitness). */
export const HERO_GRID = FITNESS_PHOTO_IDS.map((id) => unsplash(id, 200, 200, 55));

/** Avatar pravatar déterministe. */
export function avatar(n: number, size = 150): string {
  return `https://i.pravatar.cc/${size}?img=${n}`;
}
