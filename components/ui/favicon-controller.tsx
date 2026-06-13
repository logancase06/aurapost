'use client';

import { useEffect } from 'react';

/*
  Favicon animé qui reflète l'état de l'app.
  - État idle : la pastille AuraPost (dégradé violet + étincelle).
  - État « génération en cours » : un spinner violet tourne dans le favicon.
  Déclenché par des CustomEvent globaux :
    window.dispatchEvent(new CustomEvent('aurapost:busy', { detail: true | false }))
  Voir le helper `setAppBusy()` ci-dessous.
*/
export function setAppBusy(busy: boolean) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('aurapost:busy', { detail: busy }));
}

function ensureLink(): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  return link;
}

export function FaviconController() {
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const link = ensureLink();

    let raf = 0;
    let busy = false;
    let angle = 0;

    const drawBase = () => {
      ctx.clearRect(0, 0, 64, 64);
      const grad = ctx.createLinearGradient(0, 0, 64, 64);
      grad.addColorStop(0, '#7C3AED');
      grad.addColorStop(1, '#A855F7');
      ctx.fillStyle = grad;
      // pastille à coins arrondis
      const r = 16;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.arcTo(64, 0, 64, 64, r);
      ctx.arcTo(64, 64, 0, 64, r);
      ctx.arcTo(0, 64, 0, 0, r);
      ctx.arcTo(0, 0, 64, 0, r);
      ctx.closePath();
      ctx.fill();
    };

    const drawSparkle = () => {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      const cx = 32;
      const cy = 32;
      // étincelle à 4 branches
      ctx.moveTo(cx, cy - 16);
      ctx.quadraticCurveTo(cx + 3, cy - 3, cx + 16, cy);
      ctx.quadraticCurveTo(cx + 3, cy + 3, cx, cy + 16);
      ctx.quadraticCurveTo(cx - 3, cy + 3, cx - 16, cy);
      ctx.quadraticCurveTo(cx - 3, cy - 3, cx, cy - 16);
      ctx.fill();
    };

    const drawSpinner = () => {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(32, 32, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.arc(32, 32, 16, angle, angle + Math.PI * 0.6);
      ctx.stroke();
    };

    const commit = () => {
      link.href = canvas.toDataURL('image/png');
    };

    const renderIdle = () => {
      drawBase();
      drawSparkle();
      commit();
    };

    const loop = () => {
      drawBase();
      angle += 0.22;
      drawSpinner();
      commit();
      raf = requestAnimationFrame(loop);
    };

    renderIdle();

    const onBusy = (e: Event) => {
      const next = !!(e as CustomEvent).detail;
      if (next === busy) return;
      busy = next;
      if (busy) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
        renderIdle();
      }
    };

    window.addEventListener('aurapost:busy', onBusy);
    return () => {
      window.removeEventListener('aurapost:busy', onBusy);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
