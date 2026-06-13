/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Packages Node.js purs / natifs — jamais bundlés par Turbopack côté navigateur.
  serverExternalPackages: [
    '@anthropic-ai/claude-code',
    '@libsql/client',
    'resend',
    'sharp',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
  ],

  compress: true,
  poweredByHeader: false,

  // Hôtes d'images externes autorisés (photos fitness Unsplash, avatars pravatar).
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },

  async headers() {
    return [
      // Routes API mutatives — pas de cache par défaut.
      {
        source: '/api/(.*)',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
};

// Bundle analyzer optionnel : `npm run analyze` (ANALYZE=true). Guard : si le package
// n'est pas installé, on retourne la config telle quelle (le build reste vert).
async function withAnalyzer(config) {
  if (process.env.ANALYZE !== 'true') return config;
  try {
    const { default: bundleAnalyzer } = await import('@next/bundle-analyzer');
    return bundleAnalyzer({ enabled: true })(config);
  } catch {
    console.warn('[next.config] @next/bundle-analyzer non installé — `npm i -D @next/bundle-analyzer`');
    return config;
  }
}

export default await withAnalyzer(nextConfig);
