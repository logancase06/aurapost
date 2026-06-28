import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { landingDisplay, landingBody } from '@/components/landing/fonts';
import AppToaster from '@/components/AppToaster';
import './globals.css';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import { ThemeProvider } from '@/components/ThemeProvider';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { GrainOverlay } from '@/components/ui/decor';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { FaviconController } from '@/components/ui/favicon-controller';
import CookieBanner from '@/components/CookieBanner';
import InstallPrompt from '@/components/InstallPrompt';
import AnalyticsScripts from '@/components/AnalyticsScripts';
import CrispChat from '@/components/CrispChat';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'AuraPost â€” Votre contenu Instagram gÃ©nÃ©rÃ© par IA',
    template: '%s | AuraPost',
  },
  description:
    'AuraPost gÃ©nÃ¨re automatiquement vos posts Instagram et LinkedIn de coach sportif et vous loue un site web personnalisÃ©. Un mois de contenu en 30 secondes.',
  openGraph: {
    type: 'website',
    siteName: 'AuraPost',
    locale: 'fr_FR',
    url: APP_URL,
    title: 'AuraPost â€” Contenu social automatisÃ© pour coachs sportifs',
    description: 'Un mois de posts Instagram & LinkedIn gÃ©nÃ©rÃ©s en 30 secondes.',
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'AuraPost' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fafaf8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable} ${landingDisplay.variable} ${landingBody.variable}`} suppressHydrationWarning>
      <head>
        {/* Garde-fou dev : un Service Worker enregistrÃ© lors d'une session prÃ©cÃ©dente sert
            du cache pÃ©rimÃ© (cache-first sur .css) â†’ page sans styles. On le dÃ©senregistre et
            on purge ses caches AVANT React, puis on recharge une seule fois pour repartir
            sur du rÃ©seau propre. Aucun effet en prod (hostname â‰  localhost). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
  if (!('serviceWorker' in navigator)) return;
  var hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.getRegistrations().then(function(rs){ rs.forEach(function(r){ r.unregister(); }); }).catch(function(){});
  if (typeof caches !== 'undefined') { caches.keys().then(function(ks){ ks.forEach(function(k){ caches.delete(k); }); }).catch(function(){}); }
  if (hadController && !sessionStorage.getItem('sw-purged')) { sessionStorage.setItem('sw-purged','1'); location.reload(); }
})();`,
          }}
        />
      </head>
      <body className="landing-body min-h-screen bg-background font-sans text-foreground antialiased">
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <GrainOverlay />
        <CustomCursor />
        <FaviconController />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SessionProviderWrapper>{children}<CrispChat /></SessionProviderWrapper>
        </ThemeProvider>
        <ServiceWorkerRegister />
        <AnalyticsScripts />
        <InstallPrompt />
        <CookieBanner />
        <KeyboardShortcuts />
        <AppToaster />
      </body>
    </html>
  );
}

