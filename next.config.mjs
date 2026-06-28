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
    // CSP : 'unsafe-inline' requis pour les scripts d'hydratation Next.js et les
    // styles inline (Tailwind). Les nonces (alternative stricte) nécessitent du
    // middleware dynamique qui casse ISR — pas adapté ici.
    // Tiers autorisés explicitement : Stripe, Crisp, GA/GTM, Meta Pixel.
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://client.crisp.chat https://www.googletagmanager.com https://connect.facebook.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https: wss://client.relay.crisp.chat wss://stream.crisp.chat https://fonts.gstatic.com https://fonts.googleapis.com",
      `frame-src https://js.stripe.com https://hooks.stripe.com https://${appDomain} https://*.${appDomain}`,
      "worker-src 'self' blob:",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      // Sécurité globale — appliquée à toutes les pages.
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
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
