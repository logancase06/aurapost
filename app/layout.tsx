import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import AppToaster from '@/components/AppToaster';
import './globals.css';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { GrainOverlay } from '@/components/ui/decor';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { FaviconController } from '@/components/ui/favicon-controller';
import CookieBanner from '@/components/CookieBanner';
import InstallPrompt from '@/components/InstallPrompt';
import AnalyticsScripts from '@/components/AnalyticsScripts';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'AuraPost — Votre contenu Instagram généré par IA',
    template: '%s | AuraPost',
  },
  description:
    'AuraPost génère automatiquement vos posts Instagram et LinkedIn de coach sportif et vous loue un site web personnalisé. Un mois de contenu en 30 secondes.',
  openGraph: {
    type: 'website',
    siteName: 'AuraPost',
    locale: 'fr_FR',
    url: APP_URL,
    title: 'AuraPost — Contenu social automatisé pour coachs sportifs',
    description: 'Un mois de posts Instagram & LinkedIn générés en 30 secondes.',
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
  themeColor: '#0A0A0F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`dark ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <GrainOverlay />
        <CustomCursor />
        <FaviconController />
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
        <ServiceWorkerRegister />
        <AnalyticsScripts />
        <InstallPrompt />
        <CookieBanner />
        <AppToaster />
      </body>
    </html>
  );
}
