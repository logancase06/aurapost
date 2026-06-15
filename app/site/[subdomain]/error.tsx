'use client';

import { useEffect } from 'react';
import { logEvent } from '@/lib/logger';

/**
 * Error boundary du site vitrine public (route /site/[subdomain]).
 * Standalone et sur-mesure : la page publique n'a aucun chrome d'app, on rend donc
 * un écran autonome lisible plutôt que la page d'erreur Next par défaut (écran blanc).
 * L'erreur est loggée via logEvent (jamais affichée au visiteur — pas de stack trace).
 */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logEvent('site.render_error', null, { digest: error.digest ?? null });
  }, [error]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: '24px',
        textAlign: 'center',
        background: '#0A0A0A',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#FF4D00', margin: 0 }}>
        Oups
      </p>
      <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
        Ce site est momentanément indisponible
      </h1>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', maxWidth: 420, margin: 0, lineHeight: 1.6 }}>
        Une erreur est survenue à l’affichage. Réessaie dans un instant.
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          marginTop: 6,
          height: 48,
          padding: '0 28px',
          background: '#FF4D00',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 15,
          cursor: 'pointer',
        }}
      >
        Réessayer
      </button>
    </main>
  );
}
