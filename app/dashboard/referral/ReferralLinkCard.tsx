'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Carte « lien de parrainage » : copie en un clic + partage natif (mobile). */
export default function ReferralLinkCard({ url, code }: { url: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Lien copié ✦');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copie impossible.');
    }
  }

  async function share() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: 'Rejoins AuraPost', text: 'Rejoins AuraPost avec mon lien et gagne 1 mois gratuit ✦', url });
      } catch {
        /* annulé par l'utilisateur */
      }
    } else {
      void copy();
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">Votre lien de parrainage</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center justify-between gap-3 rounded-md border border-border bg-background px-4 py-3 font-mono text-sm">
          <span className="truncate">{url}</span>
          <span className="shrink-0 rounded bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">{code}</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={copy} variant="gradient" className="min-h-[44px]">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copié' : 'Copier'}
          </Button>
          <Button onClick={share} variant="outline" className="min-h-[44px]" aria-label="Partager">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
