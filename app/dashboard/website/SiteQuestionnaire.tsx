'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import GuidedBrief from './GuidedBrief';
import {
  QUESTIONNAIRE,
  TONE_CHIP_FOR_PROFILE,
  type QuestionDef,
  type QuestionnaireAnswers,
} from './brief-helpers';

/**
 * Questionnaire de création (Mandat 2) — affiché AVANT la génération, pour les 2 chemins
 * (template choisi via l'explorateur OU création directe). Toutes les questions sont
 * OPTIONNELLES : le bouton « Créer mon site » reste toujours actif. Chaque question propose
 * des choix rapides (chips) ET une bascule « Écrire ma réponse » (texte libre). Q6 réutilise
 * la zone guidée (GuidedBrief). Présentational : la logique de création est dans le parent.
 */
export default function SiteQuestionnaire({
  open,
  onClose,
  profileTone,
  specialty,
  loading,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  profileTone?: string | null;
  specialty?: string | null;
  loading: boolean;
  onCreate: (answers: QuestionnaireAnswers) => void;
}) {
  // Pré-sélection du ton depuis le profil (modifiable).
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [brief, setBrief] = useState('');

  useEffect(() => {
    if (!open) return;
    const presetTone = profileTone ? TONE_CHIP_FOR_PROFILE[profileTone] : undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets form state when dialog opens; intentional synchronous init
    setAnswers(presetTone ? { tone: presetTone } : {});
    setBrief('');
  }, [open, profileTone]);

  // Verrou de scroll + Échap.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !loading && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  const set = (key: QuestionDef['key'], value: string | undefined) => setAnswers((a) => ({ ...a, [key]: value }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label="Créer mon site" className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-bold">Créons ton site</h2>
            <p className="text-xs text-muted-foreground">Quelques réponses pour le calibrer — tout est optionnel, tu ajusteras après.</p>
          </div>
          <button type="button" onClick={onClose} disabled={loading} aria-label="Fermer" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Questions */}
        <div className="max-h-[65vh] space-y-7 overflow-y-auto px-6 py-6">
          {QUESTIONNAIRE.map((q) => (
            <QuestionBlock key={q.key} def={q} value={answers[q.key]} onChange={(v) => set(q.key, v)} />
          ))}

          {/* Q6 — précisions libres (zone guidée réutilisée) */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Autre chose à préciser ?</p>
            <GuidedBrief value={brief} onChange={setBrief} specialty={specialty} disabled={loading} rows={3} />
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
          <span className="text-xs text-muted-foreground">Aucune réponse n’est obligatoire.</span>
          <Button variant="gradient" disabled={loading} onClick={() => onCreate({ ...answers, brief })}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {loading ? 'Création…' : 'Créer mon site →'}
          </Button>
        </footer>
      </div>
    </div>
  );
}

// ── Une question : chips (choix rapide) ⇄ champ texte libre ───────────────────
function QuestionBlock({ def, value, onChange }: { def: QuestionDef; value?: string; onChange: (v: string | undefined) => void }) {
  // Le ton peut arriver pré-sélectionné (value initiale) → on démarre en mode chips.
  const initialChip = value && def.options.includes(value) ? value : undefined;
  const [mode, setMode] = useState<'chips' | 'text'>('chips');
  const [chip, setChip] = useState<string | undefined>(initialChip);
  const [text, setText] = useState('');

  return (
    <div className="space-y-2.5">
      <p className="text-sm font-semibold">{def.label}</p>

      {mode === 'chips' ? (
        <div className="flex flex-wrap gap-2">
          {def.options.map((opt) => (
            <Chip
              key={opt}
              selected={chip === opt}
              onClick={() => {
                const next = chip === opt ? undefined : opt; // re-clic = désélection
                setChip(next);
                onChange(next);
              }}
            >
              {opt}
            </Chip>
          ))}
          <button
            type="button"
            onClick={() => {
              setMode('text');
              onChange(text || undefined); // démarre vide (jamais le label de la chip)
            }}
            className="rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-primary hover:border-primary/50"
          >
            Écrire ma réponse
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <input
            value={text}
            autoFocus
            onChange={(e) => {
              setText(e.target.value);
              onChange(e.target.value || undefined);
            }}
            placeholder="Ta réponse…"
            className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={() => {
              setMode('chips');
              onChange(chip); // retour aux choix rapides ; le texte reste en mémoire
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Revenir aux choix rapides
          </button>
        </div>
      )}
    </div>
  );
}
