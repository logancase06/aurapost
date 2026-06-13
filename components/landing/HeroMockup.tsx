'use client';

import { useRef, useState } from 'react';
import { MacBookFrame } from '@/components/ui/device-frames';

/**
 * Mockup MacBook du hero montrant le vrai dashboard de Vincent.
 * Légère rotation 3D au survol (perspective transform), désactivée au repos.
 */
export default function HeroMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -py * 8, ry: px * 10 });
  }

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={() => setTilt({ rx: 0, ry: 0 })} className="[perspective:1200px]">
      <div
        className="relative transition-transform duration-200 ease-out will-change-transform"
        style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
      >
        {/* Halo derrière l'écran */}
        <div
          aria-hidden
          className="absolute -inset-8 -z-10 rounded-full opacity-60 blur-3xl"
          style={{ background: 'radial-gradient(circle at 50% 40%, hsl(262 83% 58% / 0.45), transparent 65%)' }}
        />
        <MacBookFrame src="/mockups/macbook-vincent.png" alt="Tableau de bord AuraPost de Vincent Ferré" priority />
      </div>
    </div>
  );
}
