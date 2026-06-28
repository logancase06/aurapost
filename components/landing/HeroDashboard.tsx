'use client';

import { useEffect, useState } from 'react';

const POST1_TEXT =
  "Ton corps ne ment jamais. Quand tu ignores la fatigue, il parle plus fort. 3 signes que tu dois lever le pied…";
const POST2_TEXT =
  "Ce que 10 ans de coaching m'ont appris : la régularité bat toujours l'intensité. Voici comment j'explique ça à mes clients…";

type Phase = 'idle' | 'clicking' | 'loading' | 'typing1' | 'typing2' | 'done';

/**
 * Hero dashboard animé — simule la génération de posts en live.
 * Boucle (~11s) : idle → clic bouton → chargement → typewriter post 1 → typewriter post 2 → pause → reset.
 * prefers-reduced-motion : état final statique affiché instantanément.
 */
export default function HeroDashboard() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setText1(POST1_TEXT);
      setText2(POST2_TEXT);
      setPhase('done');
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];

    function clearAll() {
      timers.forEach(clearTimeout);
      intervals.forEach(clearInterval);
      timers.length = 0;
      intervals.length = 0;
    }

    function addTimer(fn: () => void, ms: number) {
      const id = setTimeout(fn, ms);
      timers.push(id);
    }

    function typeText(
      setter: (v: string) => void,
      text: string,
      speed: number,
      onDone?: () => void,
    ) {
      let i = 0;
      const id = setInterval(() => {
        i++;
        setter(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(id);
          onDone?.();
        }
      }, speed);
      intervals.push(id);
    }

    function runCycle() {
      clearAll();
      setText1('');
      setText2('');
      setPhase('idle');

      addTimer(() => setPhase('clicking'), 900);
      addTimer(() => setPhase('loading'), 1300);
      addTimer(() => {
        setPhase('typing1');
        typeText(setText1, POST1_TEXT, 22, () => {
          addTimer(() => {
            setPhase('typing2');
            typeText(setText2, POST2_TEXT, 22, () => {
              setPhase('done');
              addTimer(runCycle, 3500);
            });
          }, 350);
        });
      }, 2300);
    }

    runCycle();
    return clearAll;
  }, []);

  const showPost1 = phase !== 'idle' && phase !== 'clicking';
  const showPost2 = phase === 'typing2' || phase === 'done';
  const isClicking = phase === 'clicking';
  const isLoading = phase === 'loading';
  const isDone = phase === 'done';

  return (
    <div className="w-full max-w-[500px] mx-auto lg:mx-0">
      {/* Fenêtre navigateur */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          boxShadow: '0 24px 64px -12px rgba(15,15,14,0.16), 0 0 0 1px var(--landing-line)',
        }}
      >
        {/* Chrome — barre du navigateur */}
        <div
          className="flex items-center gap-3 border-b px-4 py-3"
          style={{ background: 'var(--landing-paper-2)', borderColor: 'var(--landing-line)' }}
        >
          <div className="flex gap-1.5 shrink-0">
            <div className="h-3 w-3 rounded-full" style={{ background: '#ff5f57cc' }} />
            <div className="h-3 w-3 rounded-full" style={{ background: '#febc2ecc' }} />
            <div className="h-3 w-3 rounded-full" style={{ background: '#28c840cc' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-mono"
              style={{
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid var(--landing-line)',
                color: 'var(--landing-muted)',
              }}
            >
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5.5 10V7a2.5 2.5 0 0 1 5 0v3" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              app.aurapost.fr/dashboard
            </div>
          </div>
        </div>

        {/* Contenu dashboard */}
        <div className="px-5 py-4 space-y-4" style={{ background: 'var(--landing-paper)' }}>
          {/* Profil coach */}
          <div className="flex items-center gap-3">
            <div
              aria-hidden
              className="h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
              style={{ background: 'var(--landing-sapin)' }}
            >
              SM
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold" style={{ color: 'var(--landing-ink)' }}>
                Sofia Martinez
              </p>
              <p className="text-[11px]" style={{ color: 'var(--landing-muted)' }}>
                Coach Nutrition · Paris
              </p>
            </div>
            <span
              className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: 'var(--landing-sapin-10)', color: 'var(--landing-sapin)' }}
            >
              Pack Complet
            </span>
          </div>

          {/* Bouton générer */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            className="w-full rounded-lg px-4 py-2.5 text-[13px] font-bold text-white flex items-center justify-center gap-2 select-none"
            style={{
              background: 'var(--landing-sapin)',
              transition: 'transform 100ms ease',
              transform: isClicking ? 'scale(0.97)' : 'scale(1)',
            }}
          >
            {isLoading ? (
              <>
                <span
                  aria-hidden
                  className="animate-spin"
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                  }}
                />
                Génération en cours…
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                  <path d="M8 1.5 9.6 6H14l-3.5 2.5 1.3 4.1L8 10l-3.8 2.6 1.3-4.1L2 6h4.4z" />
                </svg>
                Générer mes 12 posts
              </>
            )}
          </button>

          {/* Cartes de posts */}
          <div className="grid grid-cols-2 gap-3">
            {/* Post 1 — Instagram */}
            <div
              className="rounded-lg border p-3"
              style={{
                background: '#fff',
                borderColor: 'var(--landing-line)',
                opacity: showPost1 ? 1 : 0,
                transform: showPost1 ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <div className="h-2 w-2 rounded-full" style={{ background: '#e1306c' }} />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--landing-muted)' }}
                >
                  Instagram
                </span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--landing-ink)' }}>
                {text1}
                {showPost1 && text1.length < POST1_TEXT.length && (
                  <span
                    aria-hidden
                    className="animate-pulse"
                    style={{
                      display: 'inline-block',
                      verticalAlign: 'middle',
                      marginLeft: 1,
                      width: 2,
                      height: 12,
                      background: 'var(--landing-sapin)',
                    }}
                  />
                )}
              </p>
              {isDone && text1.length >= POST1_TEXT.length && (
                <p
                  className="mt-1.5 text-[10px] font-bold"
                  style={{ color: 'var(--landing-sapin)' }}
                >
                  ✓ Prêt à publier
                </p>
              )}
            </div>

            {/* Post 2 — LinkedIn */}
            <div
              className="rounded-lg border p-3"
              style={{
                background: '#fff',
                borderColor: 'var(--landing-line)',
                opacity: showPost2 ? 1 : 0,
                transform: showPost2 ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <div className="h-2 w-2 rounded-full" style={{ background: '#0a66c2' }} />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--landing-muted)' }}
                >
                  LinkedIn
                </span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--landing-ink)' }}>
                {text2}
                {showPost2 && text2.length < POST2_TEXT.length && (
                  <span
                    aria-hidden
                    className="animate-pulse"
                    style={{
                      display: 'inline-block',
                      verticalAlign: 'middle',
                      marginLeft: 1,
                      width: 2,
                      height: 12,
                      background: 'var(--landing-sapin)',
                    }}
                  />
                )}
              </p>
              {isDone && text2.length >= POST2_TEXT.length && (
                <p
                  className="mt-1.5 text-[10px] font-bold"
                  style={{ color: 'var(--landing-sapin)' }}
                >
                  ✓ Prêt à publier
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
