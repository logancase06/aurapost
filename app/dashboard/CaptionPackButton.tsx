'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Layers, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateCaptionPackAction } from './post-actions';
import { setAppBusy } from '@/components/ui/favicon-controller';

/** Génère un pack de 30 légendes courtes (stories Instagram) en un clic. */
export default function CaptionPackButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    if (!confirm('Générer un pack de 30 légendes courtes (stories) ?')) return;
    setAppBusy(true);
    const t = toast.loading('Génération du pack…');
    startTransition(async () => {
      const res = await generateCaptionPackAction();
      toast.dismiss(t);
      setAppBusy(false);
      if (res.ok) {
        toast.success(`${res.count} légendes générées ✦`);
        router.refresh();
      } else {
        toast.error(res.error || 'Génération impossible');
      }
    });
  }

  return (
    <Button onClick={run} disabled={pending} variant="outline" size="lg">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
      Pack de 30 légendes
    </Button>
  );
}
