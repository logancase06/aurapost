'use client';

import { useEffect } from 'react';
import { motion, stagger, useAnimate } from 'framer-motion';
import { cn } from '@/lib/utils';

// Aceternity UI — TextGenerateEffect : les mots apparaissent en cascade.
export function TextGenerateEffect({ words, className }: { words: string; className?: string }) {
  const [scope, animate] = useAnimate();
  const wordsArray = words.split(' ');

  useEffect(() => {
    animate('span', { opacity: 1, filter: 'blur(0px)' }, { duration: 0.3, delay: stagger(0.08) });
  }, [animate]);

  return (
    <div ref={scope} className={cn('font-bold', className)}>
      {wordsArray.map((word, idx) => (
        <motion.span key={word + idx} className="opacity-0" style={{ filter: 'blur(8px)' }}>
          {word}{' '}
        </motion.span>
      ))}
    </div>
  );
}
