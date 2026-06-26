'use client';

import { useState } from 'react';
import { Loader2, Wand2, Check, RotateCcw, X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Presets de modification — prompts optimisés GPT Image 1.5 pour photos de coach.
// La préservation du visage est explicitement demandée dans chaque prompt.
// ─────────────────────────────────────────────────────────────────────────────

const PRESETS = [
  {
    id: 'studio',
    label: 'Fond studio',
    desc: 'Fond neutre professionnel',
    basePrompt: 'Replace the background with a clean, neutral professional studio backdrop with soft, even studio lighting. Preserve the person exactly as they appear — face, clothing, and pose unchanged.',
  },
  {
    id: 'outdoor',
    label: 'Fond extérieur',
    desc: 'Nature, lumière naturelle',
    basePrompt: 'Replace the background with a bright, natural outdoor setting with greenery and natural sunlight. Preserve the person exactly as they appear — face, clothing, and pose unchanged.',
  },
  {
    id: 'office',
    label: 'Fond bureau',
    desc: 'Espace de travail moderne',
    basePrompt: 'Replace the background with a modern, light-filled office or workspace. Preserve the person exactly as they appear — face, clothing, and pose unchanged.',
  },
  {
    id: 'gym',
    label: 'Salle de sport',
    desc: 'Environnement fitness pro',
    basePrompt: 'Replace the background with a professional fitness gym environment. Preserve the person exactly as they appear — face, clothing, and pose unchanged.',
  },
  {
    id: 'lighting',
    label: 'Améliorer l\'éclairage',
    desc: 'Lumière douce et flatteuse',
    basePrompt: 'Improve the photo lighting to create a soft, flattering, natural-looking light on the subject. Make the face brighter and more defined. Keep all other elements as-is.',
  },
  {
    id: 'custom',
    label: 'Personnalisé',
    desc: 'Décris ta modification',
    basePrompt: '',
  },
] as const;

type PresetId = (typeof PRESETS)[number]['id'];

export interface EditedPhoto {
  id: string;
  sourcePhotoId: string;
  r2Url: string;
  prompt: string;
  model: string;
  status: string;
  validatedAt: string | null;
  createdAt: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  photoId: string;
  photoUrl: string;
  aiEditsUsed: number;
  aiEditsMax: number;
  onValidated: (edited: EditedPhoto) => void;
}

export default function AIPhotoEditDialog({
  open,
  onOpenChange,
  photoId,
  photoUrl,
  aiEditsUsed,
  aiEditsMax,
  onValidated,
}: Props) {
  const [step, setStep] = useState<'editing' | 'reviewing'>('editing');
  const [preset, setPreset] = useState<PresetId>('studio');
  const [extra, setExtra] = useState('');
  const [generating, setGenerating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [editedPhoto, setEditedPhoto] = useState<EditedPhoto | null>(null);
  const [usedCount, setUsedCount] = useState(aiEditsUsed);

  const quotaLeft = aiEditsMax - usedCount;
  const selectedPreset = PRESETS.find((p) => p.id === preset)!;

  function buildPrompt(): string {
    const base = selectedPreset.basePrompt;
    const suffix = extra.trim();
    if (preset === 'custom') return suffix;
    return suffix ? `${base} ${suffix}` : base;
  }

  function reset() {
    setStep('editing');
    setPreset('studio');
    setExtra('');
    setGenerating(false);
    setValidating(false);
    setEditedPhoto(null);
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  async function generate() {
    const prompt = buildPrompt();
    if (!prompt) {
      toast.error('Décris la modification souhaitée.');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/photos/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? 'Génération impossible. Réessayez.');
        return;
      }
      setEditedPhoto(data.photo as EditedPhoto);
      if (data.quota?.used != null) setUsedCount(data.quota.used as number);
      setStep('reviewing');
    } catch {
      toast.error('Erreur réseau. Réessayez.');
    } finally {
      setGenerating(false);
    }
  }

  async function validate() {
    if (!editedPhoto) return;
    setValidating(true);
    try {
      const res = await fetch(`/api/photos/edit/${editedPhoto.id}/validate`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? 'Validation impossible.');
        return;
      }
      const validated: EditedPhoto = { ...editedPhoto, validatedAt: new Date().toISOString() };
      onValidated(validated);
      toast.success('Photo validée ✓');
      handleClose(false);
    } catch {
      toast.error('Erreur réseau.');
    } finally {
      setValidating(false);
    }
  }

  function redo() {
    setStep('editing');
  }

  const canGenerate = preset !== 'custom' || extra.trim().length > 0;
  const quotaExhausted = quotaLeft <= 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Modifier la photo avec l&apos;IA</DialogTitle>

        {/* ── Header ── */}
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Modification IA</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {aiEditsMax - usedCount}/{aiEditsMax} restantes ce mois
          </span>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-5">
          {/* ── Étape 1 : configuration ── */}
          {step === 'editing' && (
            <div className="space-y-5">
              {/* Aperçu photo originale */}
              <div className="overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt="Photo originale"
                  className="h-44 w-full object-cover"
                  style={{ objectPosition: 'top center' }}
                />
              </div>

              {/* Sélecteur de type */}
              <div className="space-y-2">
                <p className="text-sm font-semibold">Type de modification</p>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPreset(p.id)}
                      className={cn(
                        'rounded-xl border px-3 py-2.5 text-left transition-all',
                        preset === p.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/40'
                      )}
                    >
                      <span className="block text-sm font-medium">{p.label}</span>
                      <span className="block text-xs text-muted-foreground">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt libre */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {preset === 'custom' ? 'Description de la modification' : 'Précisions (optionnel)'}
                </label>
                <textarea
                  value={extra}
                  onChange={(e) => setExtra(e.target.value.slice(0, 400))}
                  placeholder={
                    preset === 'custom'
                      ? 'Ex : remplace le fond par un podium de compétition avec du public…'
                      : 'Ex : tons chauds orangés, heure dorée…'
                  }
                  rows={3}
                  className="flex w-full resize-none rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-right text-xs text-muted-foreground">{extra.length}/400</p>
              </div>

              {quotaExhausted && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                  Quota mensuel atteint ({aiEditsMax}/{aiEditsMax}). Réessayez le mois prochain.
                </div>
              )}
            </div>
          )}

          {/* ── Étape 2 : prévisualisation côte-à-côte ── */}
          {step === 'reviewing' && editedPhoto && (
            <div className="space-y-4">
              <p className="text-sm font-semibold">Résultat — vérifie avant de valider</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Original</p>
                  <div className="overflow-hidden rounded-xl border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl}
                      alt="Photo originale"
                      className="aspect-square w-full object-cover"
                      style={{ objectPosition: 'top center' }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="flex items-center gap-1 text-xs font-medium text-primary">
                    <Sparkles className="h-3 w-3" /> Modifié par IA
                  </p>
                  <div className="overflow-hidden rounded-xl border-2 border-primary/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editedPhoto.r2Url}
                      alt="Photo modifiée par IA"
                      className="aspect-square w-full object-cover"
                      style={{ objectPosition: 'top center' }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Instruction :</span>{' '}
                  {editedPhoto.prompt.length > 140
                    ? editedPhoto.prompt.slice(0, 140) + '…'
                    : editedPhoto.prompt}
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                La photo originale est conservée. La version validée sera disponible dans ta galerie
                avec un badge <span className="font-semibold text-primary">IA</span> (EU AI Act Art. 50).
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          {step === 'editing' ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => handleClose(false)}>
                <X className="h-4 w-4" /> Annuler
              </Button>
              <Button
                size="sm"
                onClick={generate}
                disabled={generating || !canGenerate || quotaExhausted}
                className="min-w-32"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Génération…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" /> Générer
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={redo} disabled={validating}>
                <RotateCcw className="h-4 w-4" /> Refaire
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleClose(false)} disabled={validating}>
                  <X className="h-4 w-4" /> Annuler
                </Button>
                <Button size="sm" onClick={validate} disabled={validating} className="min-w-24">
                  {validating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Valider
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
