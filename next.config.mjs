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

export default nextConfig;
