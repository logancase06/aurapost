'use client';

import { useState } from 'react';

// Formulaire de contact du site coach — envoie un email au coach via /api/site/contact
// (Resend côté serveur, mock console si non configuré).
export default function ContactForm({ accent, coachName, subdomain }: { accent: string; coachName: string; subdomain?: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!subdomain) {
      setSent(true);
      return;
    }
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/site/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain,
          name: fd.get('name'),
          email: fd.get('email'),
          message: fd.get('message'),
        }),
      });
      if (!res.ok) {
        setError('Envoi impossible. Réessayez.');
        return;
      }
      setSent(true);
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div style={{ background: '#ecfdf5', color: '#047857', borderRadius: 12, padding: 24, textAlign: 'center', fontWeight: 600 }}>
        Merci ! Votre message a bien été envoyé. {coachName} vous recontactera rapidement.
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <input name="name" required placeholder="Votre nom" style={inputStyle} />
      <input name="email" required type="email" placeholder="Votre email" style={inputStyle} />
      <textarea name="message" required rows={4} placeholder="Votre message" style={inputStyle} />
      {error && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>}
      <button
        type="submit"
        disabled={loading}
        style={{ background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'Envoi…' : 'Envoyer'}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #ddd6fe',
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: 15,
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};
