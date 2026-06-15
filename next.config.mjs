// Domaine public R2 (R2_PUBLIC_URL) → motif remotePatterns, si défini et valide.
function r2PublicPattern() {
  try {
    if (!process.env.R2_PUBLIC_URL) return [];
    const { hostname } = new URL(process.env.R2_PUBLIC_URL);
    return [{ protocol: 'https', hostname, pathname: '/**' }];
  } catch {
    return [];
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Packages Node.js purs / natifs — jamais bundlés par Turbopack côté navigateur.
  serverExternalPackages: [
    '@anthropic-ai/claude-code',
    '@anthropic-ai/sdk',
    '@libsql/client',
    'resend',
    'sharp',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
  ],

  compress: true,
  poweredByHeader: false,

  // Hôtes d'images externes autorisés (photos coach R2 + démo Unsplash/pravatar).
  // R2 : domaine public (R2_PUBLIC_URL), *.r2.dev, et l'endpoint S3 signé.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: '*.r2.dev', pathname: '/**' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com', pathname: '/**' },
      ...r2PublicPattern(),
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
