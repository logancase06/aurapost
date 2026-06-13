'use client';

import { useEffect } from 'react';
import { motion, stagger, useAnimate } from 'framer-motion';
import { cn } from '@/lib/utils';

// Aceternity UI — TypewriterEffect : effet machine à écrire, lettre par lettre.
export function TypewriterEffect({
  words,
  className,
  cursorClassName,
}: {
  words: { text: string; className?: string }[];
  className?: string;
  cursorClassName?: string;
}) {
  const [scope, animate] = useAnimate();
  const wordsArray = words.map((w) => ({ ...w, text: w.text.split('') }));

  useEffect(() => {
    animate('span.char', { display: 'inline-block', opacity: 1, width: 'fit-content' }, { duration: 0.12, delay: stagger(0.045), ease: 'easeInOut' });
  }, [animate]);

  return (
    <div className={cn('flex flex-wrap items-baseline justify-center', className)}>
      <motion.div ref={scope} className="inline">
        {wordsArray.map((word, idx) => (
          <span key={`word-${idx}`} className="inline-block">
            {word.text.map((char, ci) => (
              <motion.span key={`char-${ci}`} className={cn('char opacity-0', word.className)}>
                {char}
              </motion.span>
            ))}
            &nbsp;
          </span>
        ))}
      </motion.div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
        className={cn('inline-block h-[0.8em] w-[4px] translate-y-[2px] bg-primary', cursorClassName)}
      />
    </div>
  );
}
