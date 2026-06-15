'use client';

import { useEffect, useRef, useState } from 'react';

// Révélation au scroll (fade-in + translateY) via Intersection Observer natif, sans lib.
// SEO/no-JS SAFE : le contenu est VISIBLE par défaut (rendu serveur opacity:1). On ne
// masque-puis-révèle QUE les éléments hors écran au montage (aucun flash visible), et on
// respecte prefers-reduced-motion. Si JS échoue, tout reste visible.
export default function Reveal({
  children,
  delay = 0,
  as = 'div',
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  as?: 'div' | 'section';
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    // Déjà (au moins partiellement) dans le viewport → on laisse visible, pas d'anim.
    if (el.getBoundingClientRect().top < window.innerHeight - 40) return;

    setHidden(true); // hors écran : on masque (aucun flash pour l'utilisateur) puis on révèle
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setHidden(false);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as;
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLElement>}
      style={{
        ...style,
        opacity: hidden ? 0 : 1,
        transform: hidden ? 'translateY(22px)' : 'translateY(0)',
        // Easing « ease-out-expo » — entrée plus naturelle et premium.
        transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  );
}
