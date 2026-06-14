'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

// Toasts : top-center sur mobile (évite le chevauchement avec la TopBar), top-right
// sur desktop (convention). Position choisie selon la largeur d'écran.
export default function AppToaster() {
  const [position, setPosition] = useState<'top-right' | 'top-center'>('top-right');

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setPosition(mq.matches ? 'top-center' : 'top-right');
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <Toaster
      position={position}
      toastOptions={{
        style: {
          background: 'hsl(240 18% 11%)',
          color: 'hsl(0 0% 98%)',
          border: '1px solid hsl(240 10% 18%)',
        },
      }}
    />
  );
}
