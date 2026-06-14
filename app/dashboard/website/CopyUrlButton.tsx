'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Copie l'URL publique du site en 1 clic. */
export default function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Lien copié ✓');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copie impossible');
    }
  }
  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copié' : 'Copier le lien'}
    </Button>
  );
}
