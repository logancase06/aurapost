'use client';

import { createContext, useContext, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Aceternity UI — 3D Card (effet de profondeur au survol de la souris).
const MouseEnterContext = createContext<[boolean, React.Dispatch<React.SetStateAction<boolean>>] | undefined>(undefined);

export function CardContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isEntered, setIsEntered] = useState(false);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 18;
    const y = (e.clientY - top - height / 2) / 18;
    ref.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
  };
  const onLeave = () => {
    if (!ref.current) return;
    setIsEntered(false);
    ref.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
  };

  return (
    <MouseEnterContext.Provider value={[isEntered, setIsEntered]}>
      <div className={cn('flex items-center justify-center [perspective:1000px]', className)} style={{ transformStyle: 'preserve-3d' }}>
        <div
          ref={ref}
          onMouseEnter={() => setIsEntered(true)}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          className="relative flex w-full items-center justify-center transition-all duration-200 ease-out"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('[transform-style:preserve-3d]', className)}>{children}</div>;
}

export function CardItem({
  children,
  className,
  translateZ = 0,
}: {
  children: React.ReactNode;
  className?: string;
  translateZ?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const context = useContext(MouseEnterContext);
  const isEntered = context?.[0];

  return (
    <div
      ref={ref}
      className={cn('transition duration-200 ease-out', className)}
      style={{ transform: isEntered ? `translateZ(${translateZ}px)` : 'translateZ(0px)' }}
    >
      {children}
    </div>
  );
}
