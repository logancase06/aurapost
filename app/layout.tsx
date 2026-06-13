import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { GrainOverlay } from '@/components/ui/decor';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { FaviconController } from '@/components/ui/favicon-controller';

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
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'hsl(240 18% 11%)',
              color: 'hsl(0 0% 98%)',
              border: '1px solid hsl(240 10% 18%)',
            },
          }}
        />
      </body>
    </html>
  );
}
