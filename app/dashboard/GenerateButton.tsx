'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { setAppBusy } from '@/components/ui/favicon-controller';

function notifyPostsReady(count: number) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  const show = () => new Notification('AuraPost ✦', { body: `Vos ${count} posts du mois sont prêts à être relus.` });
  if (Notification.permission === 'granted') show();
  else if (Notification.permission !== 'denied') Notification.requestPermission().then((p) => p === 'granted' && show());
}

export default function GenerateButton({ alreadyGenerated }: { alreadyGenerated: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleClick() {
    if (alreadyGenerated) {
      toast('Vous avez déjà généré votre contenu ce mois-ci.', { icon: 'ℹ️' });
      return;
    }
    setOpen(true);
  }

  async function confirmGenerate() {
    setLoading(true);
    setAppBusy(true); // favicon → spinner pendant la génération
    try {
      const res = await fetch('/api/generate', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'La génération a échoué.');
        setLoading(false);
        setAppBusy(false);
        return;
      }
      toast.success(`${data.count} posts générés ✦`);
      notifyPostsReady(data.count);
      setOpen(false);
      setLoading(false);
      setAppBusy(false);
      router.refresh();
    } catch {
      toast.error('Erreur réseau.');
      setLoading(false);
      setAppBusy(false);
    }
  }

  return (
    <>
      <Button onClick={handleClick} disabled={alreadyGenerated} variant="gradient" size="lg" className="shadow-lg shadow-primary/30">
        <Sparkles className="h-4 w-4" />
        {alreadyGenerated ? 'Contenu du mois créé ✦' : 'Créer mes 12 posts'}
      </Button>

      <Dialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
        <DialogContent className="max-w-md">
          {loading ? (
            <div className="space-y-4 py-2">
              <DialogTitle className="flex items-center gap-2 text-base">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Génération en cours…
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                On rédige tes 12 posts dans ta voix. Ça prend généralement 20 à 40 secondes — ne ferme pas cette fenêtre.
              </p>
              {/* Skeleton des cartes de posts en préparation */}
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-xl border border-border p-3">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                    <div className="mt-2 h-2.5 w-full animate-pulse rounded bg-muted" />
                    <div className="mt-1.5 h-2.5 w-4/5 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <DialogTitle>Générer tes 12 posts du mois ?</DialogTitle>
              <p className="text-sm text-muted-foreground">
                8 posts Instagram + 4 posts LinkedIn, calibrés sur ta spécialité et ton ton. Tu pourras les relire,
                approuver ou demander des variantes.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
                <Button variant="gradient" onClick={confirmGenerate}>
                  <Sparkles className="h-4 w-4" /> Générer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
