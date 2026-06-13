import type { MetadataRoute } from 'next';

/** Manifeste PWA — généré sur /manifest.webmanifest (convention Next.js). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AuraPost — Contenu social pour coachs',
    short_name: 'AuraPost',
    description:
      'Génère ton contenu Instagram & LinkedIn de coach sportif et ton site vitrine, en 2 minutes.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0A0A0F',
    theme_color: '#7C3AED',
    lang: 'fr',
    categories: ['business', 'productivity', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Mes posts', url: '/dashboard', description: 'Voir et approuver mes posts' },
      { name: 'Générer', url: '/dashboard?generate=1', description: 'Générer mon contenu du mois' },
      { name: 'Mon site', url: '/dashboard/website', description: 'Gérer mon site vitrine' },
    ],
  };
}
