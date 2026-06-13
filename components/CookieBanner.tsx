'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'aurapost_cookie_consent';

export interface CookieConsent {
  functional: true; // toujours actif (nécessaire)
  analytics: boolean;
  marketing: boolean;
  at: string;
}

/** Lit le consentement stocké (utilisable par lib/analytics pour gater le tracking). */
export function getStoredConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CookieConsent) : null;
  } catch {
    return null;
  }
}

/**
 * Bannière cookies RGPD avec granularité (fonctionnel, analytics, marketing).
 * Émet `aurapost:consent` (CustomEvent) à chaque choix pour activer/désactiver le tracking.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!getStoredConsent()) setVisible(true);
  }, []);

  function save(consent: { analytics: boolean; marketing: boolean }) {
    const value: CookieConsent = { functional: true, ...consent, at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('aurapost:consent', { detail: value }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[150] p-4 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md">
      <div className="rounded-lg border border-border bg-card/95 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-bold">Cookies & confidentialité</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              On utilise des cookies pour faire fonctionner le site et, avec ton accord, mesurer l’audience.{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                En savoir plus
              </Link>
              .
            </p>
          </div>
          <button onClick={() => save({ analytics: false, marketing: false })} aria-label="Refuser" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {customize && (
          <div className="mt-4 space-y-2.5 border-t border-border pt-4">
            <Row label="Fonctionnel" desc="Nécessaire au fonctionnement (toujours actif)." checked disabled />
            <Row label="Analytics" desc="Mesure d’audience anonyme." checked={analytics} onChange={setAnalytics} />
            <Row label="Marketing" desc="Suivi des conversions publicitaires." checked={marketing} onChange={setMarketing} />
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => save({ analytics: true, marketing: true })}
            className="flex-1 rounded-md bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-bold text-white"
          >
            Tout accepter
          </button>
          {customize ? (
            <button
              onClick={() => save({ analytics, marketing })}
              className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              Enregistrer mes choix
            </button>
          ) : (
            <button
              onClick={() => setCustomize(true)}
              className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              Personnaliser
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  desc,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className={cn('flex items-start gap-3', disabled && 'opacity-70')}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-input bg-background text-primary focus:ring-2 focus:ring-ring"
      />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
    </label>
  );
}
