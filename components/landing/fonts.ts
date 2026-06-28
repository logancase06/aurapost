import { Fraunces, DM_Sans } from 'next/font/google';

// Police display de la LANDING AuraPost (séparée des polices des sites coachs et du Geist du dashboard).
// Fraunces : serif contemporaine variable à fort caractère (opsz/wght) — le choix qu'un designer fait,
// pas un générateur SaaS. Auto-hébergée par next/font (zéro CDN, pas de FOUT).
export const landingDisplay = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-landing-display',
  style: ['normal', 'italic'],
});

// Corps de texte landing — DM Sans : géométrique humaniste, chaude sans être molle.
// Complémentaire à Fraunces (contraste serif/sans). Très lisible à toutes tailles.
export const landingBody = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-landing-body',
  weight: ['400', '500', '600', '700'],
});
