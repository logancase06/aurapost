import { Inter, Bebas_Neue, Plus_Jakarta_Sans, Lato, Playfair_Display } from 'next/font/google';

// Polices du site vitrine public, chargées via next/font (auto-host, zéro CDN externe,
// pas de FOUT). Une paire corps + titres par style.
//   Impact        → Inter (corps) + Bebas Neue (titres massifs)
//   Clarté        → Inter (corps) + Plus Jakarta Sans (titres)
//   Authenticité  → Lato  (corps) + Playfair Display (titres serif)

export const inter = Inter({ subsets: ['latin'], display: 'swap' });
export const bebas = Bebas_Neue({ subsets: ['latin'], weight: '400', display: 'swap' });
export const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap' });
export const lato = Lato({ subsets: ['latin'], weight: ['400', '700', '900'], display: 'swap' });
export const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap' });
