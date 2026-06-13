'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Download, Trash2, Globe, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { updateLanguageAction } from './actions';

export default function SettingsClient({ initialLanguage }: { initialLanguage: 'fr' | 'en' }) {
  const router = useRouter();
  const [language, setLanguage] = useState<'fr' | 'en'>(initialLanguage);
  const [confirm, setConfirm] = useState('');
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);

  function changeLanguage(lang: 'fr' | 'en') {
    setLanguage(lang);
    startTransition(async () => {
      const res = await updateLanguageAction(lang);
      if (res.ok) toast.success('Langue mise à jour ✦');
      else toast.error('Mise à jour impossible.');
    });
  }

  async function deleteAccount() {
    if (confirm !== 'SUPPRIMER') {
      toast.error('Tape SUPPRIMER pour confirmer.');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch('/api/gdpr/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'SUPPRIMER' }),
      });
      if (res.ok) {
        toast.success('Compte supprimé. À bientôt.');
        window.location.href = '/';
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Suppression impossible.');
        setDeleting(false);
      }
    } catch {
      toast.error('Erreur réseau.');
      setDeleting(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Langue */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <Globe className="h-5 w-5 text-primary" /> Langue
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Langue de l’interface et du contenu généré.</p>
        <div className="mt-4 inline-flex gap-1 rounded-lg border border-border bg-background p-1">
          {(['fr', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => changeLanguage(l)}
              disabled={pending}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
                language === l ? 'bg-gradient-to-r from-primary to-accent text-white' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {l === 'fr' ? 'Français' : 'English'}
            </button>
          ))}
        </div>
      </section>

      {/* Export RGPD */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <Download className="h-5 w-5 text-primary" /> Exporter mes données
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Télécharge l’intégralité de tes données AuraPost au format JSON (RGPD — droit à la portabilité).
        </p>
        <Button asChild variant="outline" className="mt-4">
          <a href="/api/gdpr/export">
            <Download className="h-4 w-4" /> Télécharger mes données
          </a>
        </Button>
      </section>

      {/* Suppression RGPD */}
      <section className="rounded-lg border border-destructive/40 bg-destructive/5 p-6">
        <h2 className="flex items-center gap-2 font-bold text-destructive">
          <ShieldAlert className="h-5 w-5" /> Supprimer mon compte
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Action <strong>irréversible</strong> : toutes tes données (posts, site, profil) seront définitivement effacées.
          Tape <strong>SUPPRIMER</strong> pour confirmer.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="SUPPRIMER"
            className="w-44"
            aria-label="Confirmation de suppression"
          />
          <Button onClick={deleteAccount} disabled={deleting || confirm !== 'SUPPRIMER'} variant="destructive">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Supprimer définitivement
          </Button>
        </div>
      </section>
    </div>
  );
}
