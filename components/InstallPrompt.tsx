'use client';

import { useEffect, useState } from 'react';
import { Sparkles, X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const VISIT_KEY = 'aurapost_visits';
const DISMISS_KEY = 'aurapost_install_dismissed';

/**
 * Invite à « Ajouter à l'écran d'accueil » après la 3ᵉ visite (PWA).
 * Capture l'événement beforeinstallprompt et propose une bannière custom.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Compteur de visites (1 incrément par session via sessionStorage).
    if (!sessionStorage.getItem('aurapost_counted')) {
      const visits = Number(localStorage.getItem(VISIT_KEY) ?? '0') + 1;
      localStorage.setItem(VISIT_KEY, String(visits));
      sessionStorage.setItem('aurapost_counted', '1');
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      const visits = Number(localStorage.getItem(VISIT_KEY) ?? '0');
      if (visits >= 3 && !localStorage.getItem(DISMISS_KEY)) {
        setDeferred(e as BeforeInstallPromptEvent);
        setVisible(true);
      }
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => {});
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[140] p-4 sm:bottom-4 sm:right-4 sm:left-auto sm:max-w-sm">
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-card/95 p-4 shadow-2xl backdrop-blur-xl">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
          <Sparkles className="h-5 w-5 text-white" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold">Installe AuraPost</p>
          <p className="text-xs text-muted-foreground">Accès rapide depuis ton écran d’accueil.</p>
        </div>
        <button onClick={install} className="rounded-md bg-gradient-to-r from-primary to-accent px-3 py-2 text-xs font-bold text-white">
          <Download className="mr-1 inline h-3.5 w-3.5" /> Installer
        </button>
        <button onClick={dismiss} aria-label="Fermer" className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
