'use client';

import { useEffect, useState } from 'react';

function ChevronUpGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

/** Navbar sticky du site public : transparente sur le hero, opaque (sombre) au scroll. */
export default function SiteNav({
  name,
  accent,
  hasApropos,
  hasTemoignages,
}: {
  name: string;
  accent: string;
  hasApropos: boolean;
  hasTemoignages: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);

  // Bascule via IntersectionObserver sur la sentinelle en bas du hero (pas de scroll listener).
  useEffect(() => {
    const sentinel = document.querySelector('#hero-sentinel');
    if (!sentinel) return;
    const obs = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { threshold: 0 });
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  // Bouton retour haut : scroll listener léger (passive).
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const displayName = name.length > 28 ? `${name.slice(0, 28)}…` : name;
  const links: { href: string; label: string }[] = [
    { href: '#accueil', label: 'Accueil' },
    ...(hasApropos ? [{ href: '#apropos', label: 'Mon approche' }] : []),
    ...(hasTemoignages ? [{ href: '#temoignages', label: 'Témoignages' }] : []),
    { href: '#contact', label: 'Contact' },
  ];

  function toTop() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 64,
          transition: 'background 300ms ease, backdrop-filter 300ms ease, border-color 300ms ease',
          background: scrolled ? 'rgba(10,10,10,0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto', height: '100%', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: 'auto', fontSize: 14, fontWeight: 600, color: '#fff', opacity: scrolled ? 1 : 0, transition: 'opacity 200ms ease', whiteSpace: 'nowrap' }}>
            {displayName}
          </span>

          <div className="cs-nav-center" style={{ display: 'flex', gap: 24, alignItems: 'center', opacity: scrolled ? 1 : 0, transition: 'opacity 200ms ease' }}>
            {links.map((l) => (
              <a key={l.href} href={l.href} className="site-nav-link" style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                {l.label}
              </a>
            ))}
          </div>

          <a
            href="#contact"
            style={{ marginLeft: 16, display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 16px', background: accent, color: '#fff', fontSize: 13, fontWeight: 600, borderRadius: 8, textDecoration: 'none' }}
          >
            Me contacter
          </a>
        </div>
        <style>{`@media (max-width: 1023px){ .cs-nav-center{ display:none !important } }`}</style>
      </nav>

      <button
        type="button"
        onClick={toTop}
        aria-label="Revenir en haut"
        className="cs-scrolltop"
        style={{
          position: 'fixed',
          zIndex: 40,
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: 'none',
          background: accent,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          cursor: 'pointer',
          opacity: showTop ? 1 : 0,
          transform: showTop ? 'translateY(0)' : 'translateY(16px)',
          pointerEvents: showTop ? 'auto' : 'none',
          transition: 'opacity 200ms ease, transform 200ms ease',
        }}
      >
        <ChevronUpGlyph />
        <style>{`
          .cs-scrolltop{bottom:32px;right:32px}
          .cs-scrolltop:hover{filter:brightness(1.1);transform:translateY(-2px)!important}
          @media (max-width:768px){.cs-scrolltop{bottom:20px;right:16px}}
        `}</style>
      </button>
    </>
  );
}
