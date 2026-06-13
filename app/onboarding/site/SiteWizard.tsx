'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Sparkles, Loader2, Camera, Star, ImagePlus, X, Check, ArrowLeft, ArrowRight, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { InstagramData } from '@/lib/instagram';
import type { ReviewsAnalysis } from '@/lib/reviews';

interface InitialState {
  instagramUrl: string;
  instagramData: InstagramData | null;
  reviewsText: string;
  reviewsAnalysis: ReviewsAnalysis | null;
  photos: string[];
}

const STEPS = [
  { label: 'Instagram', icon: Camera },
  { label: 'Avis clients', icon: Star },
  { label: 'Photos', icon: ImagePlus },
];

export default function SiteWizard({ initial }: { initial: InitialState }) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [igUrl, setIgUrl] = useState(initial.instagramUrl);
  const [igData, setIgData] = useState<InstagramData | null>(initial.instagramData);
  const [igFallback, setIgFallback] = useState(false);
  const [igLoading, setIgLoading] = useState(false);
  const [manual, setManual] = useState({ name: '', bio: '' });

  const [reviews, setReviews] = useState(initial.reviewsText);
  const [analysis, setAnalysis] = useState<ReviewsAnalysis | null>(initial.reviewsAnalysis);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [photos, setPhotos] = useState<string[]>(initial.photos);
  const [photoLoading, setPhotoLoading] = useState(false);

  const [generating, setGenerating] = useState(false);

  // Autosave (debounce) de l'URL Instagram et du texte d'avis.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch('/api/onboarding/site/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instagramUrl: igUrl, reviewsText: reviews }),
      }).catch(() => {});
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [igUrl, reviews]);

  async function analyzeInstagram() {
    setIgLoading(true);
    setIgFallback(false);
    try {
      const res = await fetch('/api/onboarding/site/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: igUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Analyse impossible.');
        return;
      }
      if (data.fallback) {
        setIgFallback(true);
        toast(data.message, { icon: 'ℹ️', duration: 5000 });
        return;
      }
      setIgData(data.data);
      toast.success('Instagram analysé ✓');
    } catch {
      toast.error('Erreur réseau.');
    } finally {
      setIgLoading(false);
    }
  }

  async function saveManual() {
    await fetch('/api/onboarding/site/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instagramUrl: igUrl, manual }),
    });
    setIgData({ name: manual.name, bio: manual.bio, followers: null, captions: [] });
    toast.success('Infos enregistrées ✓');
  }

  async function analyzeReviews() {
    setReviewsLoading(true);
    try {
      const res = await fetch('/api/onboarding/site/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reviews }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Analyse impossible.');
        return;
      }
      setAnalysis(data.analysis);
      toast.success('Avis analysés ✓');
    } catch {
      toast.error('Erreur réseau.');
    } finally {
      setReviewsLoading(false);
    }
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPhotoLoading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('photos', f));
      const res = await fetch('/api/onboarding/site/photos', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Upload impossible.');
        return;
      }
      setPhotos(data.photos);
      toast.success('Photo(s) ajoutée(s) ✓');
    } catch {
      toast.error('Erreur réseau.');
    } finally {
      setPhotoLoading(false);
    }
  }

  async function removePhoto(url: string) {
    const res = await fetch('/api/onboarding/site/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setPhotos(data.photos);
  }

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch('/api/websites/generate', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Génération impossible.');
        return;
      }
      toast.success('Site généré ✦');
      router.push('/dashboard/website/preview');
    } catch {
      toast.error('Erreur réseau.');
    } finally {
      setGenerating(false);
    }
  }

  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <main id="main-content" className="relative min-h-screen px-4 py-10">
      <div className="aura-glow absolute inset-0" aria-hidden />
      <div className="relative z-10 mx-auto max-w-2xl">
        <Link href="/dashboard/website" className="mb-6 flex items-center gap-2 text-xl font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Wand2 className="h-4 w-4 text-white" />
          </span>
          Générer mon site
        </Link>

        {/* Stepper */}
        <div className="mb-3 flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className={cn('flex h-7 w-7 items-center justify-center rounded-full', i <= step ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
              </span>
              <span className={cn('text-xs font-medium', i <= step ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</span>
            </div>
          ))}
        </div>
        <Progress value={pct} />

        <Card className="mt-6 border-border/80 bg-card/80 p-6 backdrop-blur-xl sm:p-8">
          {/* Étape 1 — Instagram */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold">Votre page Instagram</h2>
                <p className="mt-1 text-sm text-muted-foreground">Collez l’URL de votre compte public — on récupère votre nom, bio et derniers posts.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ig">URL Instagram</Label>
                <div className="flex gap-2">
                  <Input id="ig" value={igUrl} onChange={(e) => setIgUrl(e.target.value)} placeholder="https://instagram.com/votre_compte" />
                  <Button onClick={analyzeInstagram} disabled={igLoading || !igUrl} variant="gradient">
                    {igLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} Analyser
                  </Button>
                </div>
              </div>

              {igData && !igFallback && (
                <Alert variant="info">
                  <Check />
                  <AlertDescription>
                    <strong>{igData.name}</strong>
                    {igData.followers ? ` · ${igData.followers} abonnés` : ''}
                    {igData.bio ? <span className="mt-1 block text-muted-foreground">{igData.bio}</span> : null}
                    {igData.captions.length > 0 && <span className="mt-1 block text-xs text-muted-foreground">{igData.captions.length} légendes récupérées</span>}
                  </AlertDescription>
                </Alert>
              )}

              {igFallback && (
                <div className="space-y-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
                  <p className="text-sm text-foreground">Compte privé ou inaccessible. Renseignez vos infos manuellement :</p>
                  <Input placeholder="Votre nom public" value={manual.name} onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))} />
                  <textarea
                    placeholder="Votre bio"
                    value={manual.bio}
                    onChange={(e) => setManual((m) => ({ ...m, bio: e.target.value }))}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button size="sm" variant="secondary" onClick={saveManual} disabled={!manual.name}>
                    Enregistrer
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Étape 2 — Avis */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold">Vos avis clients</h2>
                <p className="mt-1 text-sm text-muted-foreground">Collez vos avis Google / Facebook (texte libre). L’IA en extrait vos points forts.</p>
              </div>
              <textarea
                value={reviews}
                onChange={(e) => setReviews(e.target.value)}
                rows={6}
                placeholder="Collez ici vos avis clients…"
                className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button onClick={analyzeReviews} disabled={reviewsLoading || reviews.trim().length < 20} variant="gradient">
                {reviewsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />} Analyser les avis
              </Button>

              {analysis && (
                <Alert variant="info">
                  <Check />
                  <AlertDescription>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.strengths.map((s) => (
                        <Badge key={s} variant="default">{s}</Badge>
                      ))}
                    </div>
                    <p className="mt-2 italic text-muted-foreground">“{analysis.testimonial}”</p>
                    <p className="mt-1 text-xs text-muted-foreground">Ton perçu : {analysis.tone}</p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Étape 3 — Photos */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold">Vos photos</h2>
                <p className="mt-1 text-sm text-muted-foreground">1 à 3 photos de vous (JPG, PNG, WebP). Redimensionnées automatiquement.</p>
              </div>

              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  uploadPhotos(e.dataTransfer.files);
                }}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50"
              >
                {photoLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
                <span className="text-sm font-medium">Glissez-déposez ou cliquez pour ajouter</span>
                <span className="text-xs text-muted-foreground">{photos.length}/3 photos</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={photos.length >= 3} onChange={(e) => uploadPhotos(e.target.files)} />
              </label>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {photos.map((url) => (
                    <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button onClick={() => removePhoto(url)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4" /> Précédent
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)}>
                Suivant <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={generate} variant="gradient" disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Générer mon site
              </Button>
            )}
          </div>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">Vos saisies sont enregistrées automatiquement.</p>
      </div>
    </main>
  );
}
