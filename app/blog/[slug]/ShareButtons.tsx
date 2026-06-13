'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link2, Check } from 'lucide-react';

/** Boutons de partage social d'un article (LinkedIn, X, copie du lien). */
export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;

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

  return (
    <div className="mt-10 flex items-center gap-3 border-t border-border pt-6">
      <span className="text-sm font-semibold text-muted-foreground">Partager :</span>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
      >
        LinkedIn
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
      >
        X / Twitter
      </a>
      <button
        onClick={copy}
        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} Copier
      </button>
    </div>
  );
}
