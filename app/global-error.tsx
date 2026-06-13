'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body
        style={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          background: '#f5f3ff',
          color: '#1e1b4b',
          textAlign: 'center',
          padding: 16,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>✦ AuraPost</h1>
        <p style={{ marginTop: 16, fontWeight: 600 }}>Une erreur critique est survenue.</p>
        <button
          onClick={reset}
          style={{ marginTop: 16, padding: '10px 24px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          Réessayer
        </button>
        {error.digest && <p style={{ marginTop: 12, fontSize: 12, color: '#a78bfa' }}>Ref: {error.digest}</p>}
      </body>
    </html>
  );
}
