'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setAppBusy } from '@/components/ui/favicon-controller';

function notifyPostsReady(count: number) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  const show = () => new Notification('AuraPost ✦', { body: `Vos ${count} posts du mois sont prêts à être relus.` });
  if (Notification.permission === 'granted') show();
  else if (Notification.permission !== 'denied') Notification.requestPermission().then((p) => p === 'granted' && show());
}

export default function GenerateButton({ alreadyGenerated }: { alreadyGenerated: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (alreadyGenerated) {
      toast('Vous avez déjà généré votre contenu ce mois-ci.', { icon: 'ℹ️' });
      return;
    }
    if (!confirm('Générer vos 12 posts du mois (8 Instagram + 4 LinkedIn) ?')) return;

    setLoading(true);
    setAppBusy(true); // favicon → spinner pendant la génération
    const t = toast.loading('Génération en cours…');
    try {
      const res = await fetch('/api/generate', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      toast.dismiss(t);
      if (!res.ok) {
        toast.error(data.error || 'La génération a échoué.');
        return;
      }
      toast.success(`${data.count} posts générés ✦`);
      notifyPostsReady(data.count);
      router.refresh();
    } catch {
      toast.dismiss(t);
      toast.error('Erreur réseau.');
    } finally {
      setLoading(false);
      setAppBusy(false); // favicon → état idle
    }
  }

  return (
    <Button onClick={handleGenerate} disabled={loading || alreadyGenerated} variant="gradient" size="lg" className="shadow-lg shadow-primary/30">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {alreadyGenerated ? 'Contenu du mois créé ✦' : 'Créer mes 12 posts'}
    </Button>
  );
}
