'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PostCardSkeletonGrid } from '@/components/PostCardSkeleton';
import { setAppBusy } from '@/components/ui/favicon-controller';

function notifyPostsReady(count: number) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  const show = () => new Notification('AuraPost ✦', { body: `Vos ${count} posts du mois sont prêts à être relus.` });
  if (Notification.permission === 'granted') show();
  else if (Notification.permission !== 'denied') Notification.requestPermission().then((p) => p === 'granted' && show());
}

/** Libellé d'étape selon l'avancement (effet « il se passe quelque chose »). */
function stepLabel(progress: number, total: number): string {
  if (progress === 0) return 'Analyse de votre profil…';
  if (progress >= total) return '✓ Vos posts sont prêts !';
  const r = progress / total;
  if (r < 0.34) return 'Génération des posts motivation…';
  if (r < 0.67) return 'Création des contenus éducatifs…';
  return 'Rédaction des posts LinkedIn…';
}

export default function GenerateButton({ alreadyGenerated }: { alreadyGenerated: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(12);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  function finish() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setLoading(false);
    setAppBusy(false);
  }

  function handleClick() {
    if (alreadyGenerated) {
      toast('Vous avez déjà généré votre contenu ce mois-ci.', { icon: 'ℹ️' });
      return;
    }
    setOpen(true);
  }

  // Polling du job asynchrone : maj progress + posts au fil de l'eau.
  function poll(jobId: string) {
    pollRef.current = setInterval(async () => {
      try {
        const job = await fetch(`/api/generate/${jobId}`).then((r) => r.json());
        if (typeof job.progress === 'number') setProgress(job.progress);
        if (typeof job.total === 'number') setTotal(job.total);
        if (job.status === 'done') {
          finish();
          toast.success(`${job.posts?.length ?? job.total} posts générés ✦`);
          notifyPostsReady(job.posts?.length ?? job.total);
          setOpen(false);
          router.refresh();
        } else if (job.status === 'failed') {
          finish();
          toast.error(job.error || 'La génération a échoué.');
        }
      } catch {
        /* réseau transitoire — on retentera au prochain tick */
      }
    }, 2000);
  }

  async function confirmGenerate() {
    setLoading(true);
    setProgress(0);
    setAppBusy(true);
    try {
      const res = await fetch('/api/generate', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'La génération a échoué.');
        finish();
        return;
      }
      // Mode asynchrone : on poll le job. Mode synchrone : posts déjà générés.
      if (data.jobId) {
        poll(data.jobId);
        return;
      }
      toast.success(`${data.count} posts générés ✦`);
      notifyPostsReady(data.count);
      setOpen(false);
      finish();
      router.refresh();
    } catch {
      toast.error('Erreur réseau.');
      finish();
    }
  }

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

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
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> {stepLabel(progress, total)}
              </DialogTitle>
              {/* Barre de progression réelle (mode async) */}
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>{progress} / {total} posts</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">On rédige tes posts dans ta voix — ne ferme pas cette fenêtre.</p>
              <PostCardSkeletonGrid count={3} />
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
