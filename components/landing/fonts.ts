import { Fraunces } from 'next/font/google';

// Police display de la LANDING AuraPost uniquement (séparée des polices des sites coachs
// — Bebas/Playfair/Jakarta/Inter/Lato — et du Geist du dashboard).
// Fraunces : serif éditoriale contemporaine à fort caractère (opsz/wght variables),
// le genre de choix qu'un designer humain fait et qu'aucun générateur SaaS ne prend.
// Auto-hébergée par next/font (zéro CDN, pas de FOUT). Exposée via --font-landing-display.
export const landingDisplay = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-landing-display',
  style: ['normal', 'italic'],
});
