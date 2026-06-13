'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Check } from 'lucide-react';

export default function BadgeEmbed({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copié ✦');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copie impossible.');
    }
  }

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">HTML</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-muted-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}
