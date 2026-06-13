'use client';

import { useEffect, useRef, useState } from 'react';

/*
  Curseur personnalisé premium (desktop uniquement).
  - Anneau qui suit la souris en mix-blend-difference (visible sur fond clair comme sombre).
  - Change de forme au survol des éléments cliquables (grossit + se remplit).
  - Le curseur système reste visible (accessibilité) : l'anneau est purement décoratif.
  - Désactivé sur les pointeurs grossiers (tactile / mobile) où il n'a aucun sens.
*/
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fine = window.matchMedia('(pointer: fine)');
    if (!fine.matches) return;
    // setState en effet volontaire : activation client-only sur pointeur fin (pas de SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(true);

    const el = dotRef.current;
    if (!el) return;

    let raf = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;

    const render = () => {
      // léger lissage pour un mouvement nerveux mais fluide
      x += (tx - x) * 0.35;
      y += (ty - y) * 0.35;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    const isClickable = (target: EventTarget | null) =>
      target instanceof Element &&
      !!target.closest('a, button, [role="button"], input, textarea, select, label, [data-cursor="pointer"]');

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      setVisible(true);
      setActive(isClickable(e.target));
    };
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onLeave = () => setVisible(false);

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  if (!enabled) return null;

  const size = active ? 44 : 22;
  const scale = pressed ? 0.8 : 1;

  return (
    <div
      ref={dotRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[200] hidden rounded-full border mix-blend-difference md:block"
      style={{
        width: size,
        height: size,
        borderColor: '#fff',
        backgroundColor: active ? 'rgba(255,255,255,0.85)' : 'transparent',
        opacity: visible ? 1 : 0,
        transition:
          'width 150ms ease, height 150ms ease, background-color 150ms ease, opacity 200ms ease',
        boxShadow: active ? '0 0 0 0 transparent' : '0 0 12px rgba(124,58,237,0.6)',
        // le scale au clic est appliqué via une transform interne pour ne pas écraser translate3d
      }}
    >
      <span
        className="block h-full w-full rounded-full"
        style={{ transform: `scale(${scale})`, transition: 'transform 120ms ease' }}
      />
    </div>
  );
}
