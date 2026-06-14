import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// ─────────────────────────────────────────────────────────────────────────────
// proxy.ts — middleware unique : headers de sécurité + rate limiting + auth Edge.
// Convention Next.js 16 + @netlify/plugin-nextjs (middleware.ts est déprécié).
// getToken() décode le cookie JWT en pur JS, sans aucun accès DB (Edge-compatible).
// ─────────────────────────────────────────────────────────────────────────────

// ── Rate limiting in-memory (fallback si Upstash absent) ─────────────────────
const memStore = new Map<string, { count: number; resetAt: number }>();

function isMemRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const maxReqs = 30;
  const record = memStore.get(ip);
  if (record && record.resetAt > now) {
    if (record.count >= maxReqs) return true;
    record.count++;
  } else {
    memStore.set(ip, { count: 1, resetAt: now + windowMs });
  }
  return false;
}

// ── CSP ──────────────────────────────────────────────────────────────────────
// Approche 'self' + 'unsafe-inline' — standard Next.js App Router sur Netlify
// (le mécanisme nonce n'est pas compatible avec l'architecture Edge+Lambda séparés).
// connect-src ajoute api.anthropic.com (générateur), Turso, Stripe, Upstash.
// (Resend est appelé côté serveur uniquement — pas besoin de l'autoriser ici.)
function buildCSP(): string {
  // Next.js en dev (Turbopack/Fast Refresh) exécute des modules via eval() →
  // 'unsafe-eval' est requis EN DÉVELOPPEMENT uniquement, jamais en production.
  const isDev = process.env.NODE_ENV === 'development';
  const scriptSrc = isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'";
  // En dev, autorise aussi les WebSocket du HMR (ws:) dans connect-src.
  const connectSrc = isDev
    ? "connect-src 'self' ws: wss: https://*.turso.io wss://*.turso.io https://api.anthropic.com https://api.stripe.com https://*.upstash.io"
    : "connect-src 'self' https://*.turso.io wss://*.turso.io https://api.anthropic.com https://api.stripe.com https://*.upstash.io";
  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com https://i.pravatar.cc https://picsum.photos",
    "font-src 'self' data:",
    connectSrc,
    "object-src 'none'",
    "worker-src 'self' blob:",
    'frame-src https://js.stripe.com https://hooks.stripe.com',
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    // upgrade-insecure-requests casserait http://localhost en dev → prod uniquement.
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

const CSP = buildCSP();

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('Content-Security-Policy', CSP);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('X-XSS-Protection', '0');
  return response;
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-nf-client-connection-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Mode maintenance ─────────────────────────────────────────────────
  if (process.env.MAINTENANCE_MODE === 'true' && pathname !== '/maintenance') {
    const isAsset =
      pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname === '/api/health';
    if (!isAsset) {
      const url = req.nextUrl.clone();
      url.pathname = '/maintenance';
      return withSecurityHeaders(NextResponse.redirect(url));
    }
  }

  // ── Webhook Stripe : pas d'auth JWT (signature HMAC interne) ──────────
  if (pathname === '/api/webhooks/stripe') {
    return withSecurityHeaders(NextResponse.next());
  }

  // ── Routes publiques (ni auth, ni rate limit applicatif spécifique) ──
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/maintenance' ||
    pathname === '/pricing' ||
    pathname === '/offline' ||
    pathname.startsWith('/demo') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/api/demo') ||
    pathname.startsWith('/site/') ||
    pathname.startsWith('/coach/') ||
    pathname === '/api/site/contact' ||
    pathname === '/status' ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/blog') ||
    pathname === '/coaches' ||
    pathname.startsWith('/ref/') ||
    pathname === '/api/local-generate' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname === '/api/webhooks/stripe' ||
    pathname === '/api/stripe/create-checkout'
  ) {
    return withSecurityHeaders(NextResponse.next());
  }

  // ── Rate limiting des routes API restantes (désactivé en dev local) ──
  if (pathname.startsWith('/api/') && process.env.NODE_ENV !== 'development') {
    if (isMemRateLimited(clientIp(req))) {
      return withSecurityHeaders(
        NextResponse.json({ error: 'Trop de requêtes. Réessayez dans une minute.' }, { status: 429 })
      );
    }
  }

  // ── Auth via JWT (sans accès DB) — uniquement sur les préfixes protégés ───
  // Les routes inconnues passent (→ page 404 publique d'AuraPost).
  const isProtected =
    pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding') || pathname.startsWith('/admin');

  if (isProtected) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
      cookieName:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
    });

    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('callbackUrl', pathname);
      return withSecurityHeaders(NextResponse.redirect(url));
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  // Couvre toutes les routes sauf assets statiques — nécessaire pour appliquer les
  // headers de sécurité à la landing et aux pages publiques.
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$|.*\\.webp$|.*\\.woff2?$).*)',
  ],
};
