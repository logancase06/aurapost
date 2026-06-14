'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveSiteTemplateAction } from './actions';

type Style = 'impact' | 'clarte' | 'authenticite';

const STYLES: { id: Style; name: string; desc: string }[] = [
  { id: 'impact', name: 'Impact', desc: 'Sombre, typographie massive — vibe athlète/prépa.' },
  { id: 'clarte', name: 'Clarté', desc: 'Épuré, lumineux, moderne — bienêtre & nutrition.' },
  { id: 'authenticite', name: 'Authenticité', desc: 'Chaleureux, serif, storytelling — coaching de vie.' },
];

/** Mini-aperçu CSS du hero de chaque style. */
function Mock({ id }: { id: Style }) {
  if (id === 'impact') {
    return (
      <div style={{ background: '#0A0A0A', padding: 14, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6, borderBottom: '3px solid #FF4D00' }}>
        <div style={{ height: 5, width: '35%', background: '#FF4D00', borderRadius: 1 }} />
        <div style={{ height: 13, width: '85%', background: '#fff', borderRadius: 2 }} />
        <div style={{ height: 13, width: '60%', background: '#fff', borderRadius: 2 }} />
        <div style={{ height: 8, width: '40%', background: '#FF4D00', borderRadius: 2, marginTop: 4 }} />
      </div>
    );
  }
  if (id === 'clarte') {
    return (
      <div style={{ background: '#FAFAFA', padding: 14, height: '100%', display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ height: 4, width: '40%', background: '#2563EB', borderRadius: 1 }} />
          <div style={{ height: 10, width: '90%', background: '#111827', borderRadius: 2 }} />
          <div style={{ height: 10, width: '55%', background: '#111827', borderRadius: 2 }} />
          <div style={{ height: 7, width: '45%', background: '#2563EB', borderRadius: 4, marginTop: 3 }} />
        </div>
        <div style={{ width: 34, height: 46, background: 'linear-gradient(135deg,#2563EB,#60a5fa)', borderRadius: 8 }} />
      </div>
    );
  }
  return (
    <div style={{ background: 'linear-gradient(135deg,#3a2a20,#1C1917)', padding: 14, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6 }}>
      <div style={{ height: 4, width: '30%', background: '#C2713A', borderRadius: 1 }} />
      <div style={{ height: 14, width: '80%', background: '#FAF7F2', borderRadius: 2, fontStyle: 'italic' }} />
      <div style={{ height: 14, width: '50%', background: '#FAF7F2', borderRadius: 2 }} />
      <div style={{ height: 7, width: '38%', background: '#C2713A', borderRadius: 2, marginTop: 4 }} />
    </div>
  );
}

export default function TemplateChooser({ current, recommended }: { current: Style | null; recommended: Style }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Style | null>(current);
  const [pendingId, setPendingId] = useState<Style | null>(null);
  const [, startTransition] = useTransition();

  function choose(id: Style) {
    setSelected(id);
    setPendingId(id);
    startTransition(async () => {
      const res = await saveSiteTemplateAction(id);
      setPendingId(null);
      if (!res.ok) {
        toast.error(res.error || 'Action impossible');
        setSelected(current);
        return;
      }
      toast.success(`Style « ${STYLES.find((s) => s.id === id)?.name} » appliqué ✓`);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {STYLES.map((s) => {
        const active = selected === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => choose(s.id)}
            disabled={pendingId !== null}
            className={cn(
              'group relative overflow-hidden rounded-xl border-2 text-left transition-all',
              active ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/40'
            )}
          >
            <div className="aspect-[16/10] w-full overflow-hidden">
              <Mock id={s.id} />
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">{s.name}</span>
                {s.id === recommended && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">Recommandé pour toi</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
            </div>
            {active && (
              <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                {pendingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
