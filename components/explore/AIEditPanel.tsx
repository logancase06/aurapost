'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Loader2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SiteContent } from '@/lib/db/site';
import { applyAIEdit } from '@/app/dashboard/website/actions';

const MAX_LEN = 500;
const MAX_HISTORY = 5;

// Suggestions rapides : au clic, remplit l'input ET soumet immédiatement.
const SUGGESTIONS: { label: string; instruction: string }[] = [
  { label: 'Titre percutant', instruction: 'Rends le titre plus percutant et accrocheur' },
  { label: 'Ton chaleureux', instruction: 'Adopte un ton plus chaleureux et humain' },
  { label: 'Plus court', instruction: 'Raccourcis les textes, va à l’essentiel' },
  { label: 'Pro', instruction: 'Rends ça plus professionnel et expert' },
  { label: 'Émotion', instruction: 'Ajoute plus d’émotion et de storytelling' },
  { label: 'CTA', instruction: 'Optimise le CTA pour inciter à l’action' },
];

interface HistoryEntry {
  instruction: string;
  previousContent: SiteContent;
}

export default function AIEditPanel({
  aiEnabled,
  content,
  onApply,
}: {
  aiEnabled: boolean;
  content: SiteContent;
  onApply: (next: SiteContent) => void;
}) {
  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Édition IA indisponible (clé API absente) → message propre, pas de crash.
  if (!aiEnabled) {
    return (
      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          🔧 L’édition IA n’est pas disponible en ce moment — modifie manuellement via les panneaux ci-dessous.
        </p>
      </section>
    );
  }

  const tooLong = instruction.length > MAX_LEN;
  const canSubmit = instruction.trim().length > 0 && !tooLong && !isLoading;

  async function submit(text: string) {
    const value = text.trim();
    if (!value || value.length > MAX_LEN || isLoading) return;
    setIsLoading(true);
    const previousContent = content;

    // Garde-fou client : si le serveur ne répond pas dans 27s (Netlify coupe à 26s),
    // on annule le loading et on affiche un message plutôt que de rester bloqué.
    const clientTimeout = new Promise<{ ok: false; error: string }>((resolve) =>
      setTimeout(() => resolve({ ok: false, error: 'La requête a pris trop longtemps — réessaie.' }), 27_000)
    );

    let res: { ok: boolean; content?: import('@/lib/db/site').SiteContent; error?: string };
    try {
      res = await Promise.race([applyAIEdit(value, content), clientTimeout]);
    } catch {
      res = { ok: false, error: 'Erreur réseau — réessaie.' };
    }

    setIsLoading(false);
    if (!res.ok || !res.content) {
      toast.error(res.error || 'Modification impossible');
      return;
    }
    onApply(res.content);
    setHistory((h) => [{ instruction: value, previousContent }, ...h].slice(0, MAX_HISTORY));
    setInstruction('');
    toast.success('Site modifié ✓ — aperçu mis à jour');
  }

  function restore(entry: HistoryEntry) {
    onApply(entry.previousContent);
    toast.success('Modification annulée');
  }

  return (
    <section className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold">
        <Sparkles className="h-4 w-4 text-primary" /> Modifie ton site avec l’IA
      </h2>

      <textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        rows={3}
        maxLength={MAX_LEN + 50}
        placeholder={'Dis-moi ce que tu veux changer…\nex : « Rends le titre plus percutant », « Change le ton »'}
        className="flex w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void submit(instruction);
          }
        }}
      />

      <div className="mt-1.5 flex items-center justify-between">
        <span className={cn('text-[10px]', tooLong ? 'text-destructive' : 'text-muted-foreground')}>
          {instruction.length}/{MAX_LEN}
        </span>
        <Button size="sm" variant="gradient" disabled={!canSubmit} onClick={() => void submit(instruction)}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Modifier mon site →
        </Button>
      </div>

      {/* Suggestions rapides */}
      <p className="mb-1.5 mt-3 text-xs font-medium text-muted-foreground">Suggestions :</p>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            type="button"
            disabled={isLoading}
            onClick={() => {
              setInstruction(s.instruction);
              void submit(s.instruction);
            }}
            className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Historique (5 max, non persistant) */}
      {history.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Dernières modifications :</p>
          <ul className="space-y-1">
            {history.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-muted-foreground" title={h.instruction}>
                  · {h.instruction.length > 40 ? `${h.instruction.slice(0, 40)}…` : h.instruction}
                </span>
                <button
                  type="button"
                  onClick={() => restore(h)}
                  className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-primary hover:bg-primary/10"
                  aria-label={`Annuler : ${h.instruction}`}
                >
                  <Undo2 className="h-3 w-3" /> Annuler
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
