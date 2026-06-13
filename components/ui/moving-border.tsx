'use client';

import { useRef } from 'react';
import { motion, useAnimationFrame, useMotionTemplate, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

// Aceternity UI — Moving Border : bordure lumineuse qui parcourt le contour.
export function MovingBorder({
  children,
  duration = 2800,
  rx = '8px',
  ry = '8px',
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
}) {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue<number>(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMs = length / duration;
      progress.set((time * pxPerMs) % length);
    }
  });

  const x = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).x ?? 0);
  const y = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).y ?? 0);
  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <div className="absolute inset-0" style={{ position: 'absolute' }}>
        <svg className="absolute h-full w-full" width="100%" height="100%" preserveAspectRatio="none">
          <rect fill="none" width="100%" height="100%" rx={rx} ry={ry} ref={pathRef} />
        </svg>
        <motion.div className="absolute -left-2 -top-2 h-5 w-5" style={{ transform }}>
          <div className="h-full w-full rounded-full bg-[radial-gradient(theme(colors.violet.500)_30%,transparent_60%)] opacity-90" />
        </motion.div>
      </div>
      {children}
    </>
  );
}

export function MovingBorderCard({ className, containerClassName, children }: { className?: string; containerClassName?: string; children: React.ReactNode }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg p-px', containerClassName)}>
      <MovingBorder duration={3200} rx="8px" ry="8px">
        <div className={cn('relative rounded-[7px] border border-border bg-card', className)}>{children}</div>
      </MovingBorder>
    </div>
  );
}
