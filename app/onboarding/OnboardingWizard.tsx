'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Camera, Briefcase, Star, Upload, Loader2, Check, ArrowLeft, ArrowRight,
  Sparkles, Rocket, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { computeCompletion } from '@/lib/completion';
import type { PhotoRow } from '@/lib/db/photos';
import type { PostDraft } from '@/lib/content-generator';
import {
  saveProfileDraft, importInstagramAction, analyzeReviewsAction,
  generateExampleAction, finishOnboarding, type ProfileDraft,
} from './actions';

export interface InitialDraft extends ProfileDraft {
  hasInstagram: boolean;
  igFollowers?: string | null;
  igTone?: string | null;
  hasReviews: boolean;
  reviewStrengths?: string[];
  photos: PhotoRow[];
}

const TONES = [
  { value: 'motivant', label: 'Motivant', desc: 'Énergie, dépassement' },
  { value: 'educatif', label: 'Éducatif', desc: 'Conseils, pédagogie' },
  { value: 'personnel', label: 'Personnel', desc: 'Authenticité, storytelling' },
];

const STEPS = ['Profil', 'Ta présence', 'Photos', 'Génération'];

export default function OnboardingWizard({ initial }: { initial: InitialDraft }) {
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);

  // ── État profil (step 1 + champs manuels step 2) ──────────────────────────
  const [displayName, setDisplayName] = useState(initial.displayName ?? '');
  const [speciality, setSpeciality] = useState(initial.speciality ?? '');
  const [city, setCity] = useState(initial.city ?? '');
  const [tone, setTone] = useState(initial.tone ?? 'motivant');
  const [language, setLanguage] = useState(initial.language ?? 'fr');
  const [bio, setBio] = useState(initial.bio ?? '');
  const [targetAudience, setTargetAudience] = useState(initial.targetAudience ?? '');
  const [results, setResults] = useState(initial.results ?? '');

  // ── Import présence (step 2) ──────────────────────────────────────────────
  const [igUrl, setIgUrl] = useState('');
  const [igLoading, setIgLoading] = useState(false);
  const [igTone, setIgTone] = useState<string | null>(initial.igTone ?? null);
  const [igFollowers, setIgFollowers] = useState<string | null>(initial.igFollowers ?? null);
  const [igThemes, setIgThemes] = useState<string[]>([]);
  const [igDone, setIgDone] = useState(initial.hasInstagram);

  // LinkedIn : saisie manuelle (pas de scraping — CGU LinkedIn).
  const [linkedinHeadline, setLinkedinHeadline] = useState(initial.linkedinHeadline ?? '');
  const [linkedinSummary, setLinkedinSummary] = useState(initial.linkedinSummary ?? '');

  const [reviewsText, setReviewsText] = useState('');
  const [rvLoading, setRvLoading] = useState(false);
  const [rvStrengths, setRvStrengths] = useState<string[]>(initial.reviewStrengths ?? []);
  const [rvDone, setRvDone] = useState(initial.hasReviews);

  // ── Photos (step 3) ───────────────────────────────────────────────────────
  const [photos, setPhotos] = useState<PhotoRow[]>(initial.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Génération (step 4) ────────────────────────────────────────────────────
  const [example, setExample] = useState<PostDraft | null>(null);
  const [exLoading, setExLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const canAdvance1 = displayName.trim().length > 0 && speciality.trim().length > 0;

  // ── Autosave debounce (1 s) du profil dès que nom + spécialité sont là ─────
  const draftRef = useRef<ProfileDraft>(null as unknown as ProfileDraft);
  draftRef.current = { displayName, speciality, city, tone, language, bio, targetAudience, results, linkedinHeadline, linkedinSummary };
  const firstRun = useRef(true);
  useEffect(() => {
    if (!canAdvance1) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(async () => {
      setSaving(true);
      const res = await saveProfileDraft(draftRef.current);
      setSaving(false);
      if (res.ok) setSavedAt(Date.now());
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, speciality, city, tone, language, bio, targetAudience, results, linkedinHeadline, linkedinSummary, canAdvance1]);

  function go(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  // Sauvegarde explicite avant de quitter le step 1 (garantit la ligne profil).
  async function next() {
    if (step === 1) {
      if (!canAdvance1) {
        toast.error('Renseigne ton nom et ta spécialité.');
        return;
      }
      setSaving(true);
      const res = await saveProfileDraft(draftRef.current);
      setSaving(false);
      if (!res.ok) {
        toast.error(res.error || 'Sauvegarde impossible');
        return;
      }
      setSavedAt(Date.now());
    }
    if (step === 2) {
      // Persiste les champs manuels avant de continuer.
      await saveProfileDraft(draftRef.current);
    }
    go(Math.min(4, step + 1));
  }

  async function analyzeIg() {
    if (!igUrl.trim()) return;
    setIgLoading(true);
    const res = await importInstagramAction(igUrl.trim());
    setIgLoading(false);
    if (!res.ok) {
      toast.error(res.error || 'Analyse impossible');
      return;
    }
    setIgFollowers(res.followers ?? null);
    setIgTone(res.analysis?.ton_dominant ?? null);
    setIgThemes(res.analysis?.themes_recurrents ?? []);
    setIgDone(true);
    if (res.analysis?.bio_reformulee && !bio.trim()) setBio(res.analysis.bio_reformulee);
    if (res.analysis?.ton_dominant) {
      const map: Record<string, string> = { motivant: 'motivant', inspirant: 'motivant', educatif: 'educatif', humoristique: 'personnel', personnel: 'personnel' };
      setTone(map[res.analysis.ton_dominant] ?? tone);
    }
    toast.success('Profil Instagram analysé ✓');
    void loadExample(); // aperçu personnalisé immédiat (moment "aha")
  }

  async function analyzeRv() {
    if (reviewsText.trim().length < 20) {
      toast.error('Colle au moins quelques lignes d’avis.');
      return;
    }
    setRvLoading(true);
    const res = await analyzeReviewsAction(reviewsText);
    setRvLoading(false);
    if (!res.ok) {
      toast.error(res.error || 'Analyse impossible');
      return;
    }
    setRvStrengths(res.analysis?.strengths ?? []);
    setRvDone(true);
    toast.success('Avis analysés ✓');
    void loadExample(); // rafraîchit l'aperçu avec les forces clients
  }

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, 10 - photos.length);
    if (!list.length) return;
    setUploading(true);
    for (const file of list) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} : trop lourde (max 10 Mo).`);
        continue;
      }
      try {
        const fd = new FormData();
        fd.append('photo', file);
        const res = await fetch('/api/posts/photo', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data?.ok) setPhotos((prev) => [data.photo, ...prev].slice(0, 10));
        else toast.error(data?.error || 'Upload impossible');
      } catch {
        toast.error('Upload impossible');
      }
    }
    setUploading(false);
  }

  async function loadExample() {
    setExLoading(true);
    const res = await generateExampleAction();
    setExLoading(false);
    if (!res.ok || !res.post) {
      toast.error(res.error || 'Aperçu indisponible');
      return;
    }
    setExample(res.post);
  }

  // Charge l'aperçu automatiquement en arrivant au step 4 (AJOUT 3).
  useEffect(() => {
    if (step === 4 && !example && !exLoading) void loadExample();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function generate() {
    setGenerating(true);
    const fin = await finishOnboarding();
    if (!fin.ok) {
      setGenerating(false);
      toast.error(fin.error || 'Impossible de terminer');
      return;
    }
    // Lance la génération complète puis bascule vers le dashboard.
    try {
      await fetch('/api/generate', { method: 'POST' });
    } catch {
      /* la génération peut aussi être relancée depuis le dashboard */
    }
    window.location.assign('/dashboard');
  }

  const completion = computeCompletion({
    displayName, speciality, city, bio, targetAudience,
    photosCount: photos.length,
    hasInstagram: igDone,
    hasReviews: rvDone,
  });

  const pct = Math.round(((step - 1) / 3) * 100);
  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div className="w-full">
      {/* Stepper + autosave */}
      <div className="mb-2 flex items-center justify-between">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          return (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  n === step ? 'bg-primary text-primary-foreground' : done ? 'bg-success text-white' : 'bg-secondary text-muted-foreground'
                )}
              >
                {done ? <Check className="h-3 w-3" /> : n}
              </span>
              <span className={cn('hidden text-xs font-medium sm:inline', n === step ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
            </div>
          );
        })}
      </div>
      <Progress value={pct} />
      <div className="mt-1.5 h-4 text-right text-xs text-muted-foreground">
        {saving ? 'Enregistrement…' : savedAt ? 'Sauvegardé ✓' : ''}
      </div>

      <div className="relative mt-3 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold">Ton profil de base</h2>
                  <p className="text-sm text-muted-foreground">60 secondes — c’est le socle de ton contenu.</p>
                </div>
                <Field label="Nom public" value={displayName} onChange={setDisplayName} placeholder="ex: Coach Léa Fitness" required />
                <Field label="Spécialité" value={speciality} onChange={setSpeciality} placeholder="ex: Préparation physique CrossFit" required />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ville" value={city} onChange={setCity} placeholder="ex: Lyon" />
                  <div className="space-y-2">
                    <Label htmlFor="lang">Langue des posts</Label>
                    <select id="lang" value={language} onChange={(e) => setLanguage(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Ton souhaité</Label>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {TONES.map((t) => (
                      <button type="button" key={t.value} onClick={() => setTone(t.value)} className={cn('rounded-xl border p-3 text-left transition-all', tone === t.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40')}>
                        <span className="block text-sm font-semibold">{t.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold">Dis-nous qui tu es — en 1 clic ou à la main</h2>
                  <p className="text-sm text-muted-foreground">Plus on te connaît, plus le contenu sonne comme toi. Rien n’est obligatoire.</p>
                </div>

                {/* Instagram */}
                <div className="rounded-xl border border-border p-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Camera className="h-4 w-4" /> Instagram</p>
                  <div className="flex gap-2">
                    <Input value={igUrl} onChange={(e) => setIgUrl(e.target.value)} placeholder="https://instagram.com/ton_compte" />
                    <Button type="button" onClick={analyzeIg} disabled={igLoading || !igUrl.trim()}>
                      {igLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyser'}
                    </Button>
                  </div>
                  {igDone && (
                    <div className="mt-3 rounded-lg bg-success/10 p-3 text-xs">
                      <p className="font-semibold text-success">Voici ce qu’on a trouvé :</p>
                      <ul className="mt-1 space-y-0.5 text-muted-foreground">
                        {igFollowers && <li>· {igFollowers} abonnés</li>}
                        {igTone && <li>· Ton détecté : <span className="font-medium text-foreground">{igTone}</span></li>}
                        {igThemes.length > 0 && <li>· Thèmes : {igThemes.join(', ')}</li>}
                      </ul>
                    </div>
                  )}
                </div>

                {/* LinkedIn — saisie manuelle (copie depuis ton profil, pas de scraping) */}
                <div className="rounded-xl border border-border p-4">
                  <p className="mb-1 flex items-center gap-2 text-sm font-semibold"><Briefcase className="h-4 w-4" /> LinkedIn</p>
                  <p className="mb-3 text-xs text-muted-foreground">Recopie ton titre et ton résumé depuis ton profil LinkedIn — ils servent à personnaliser tes posts LinkedIn.</p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="li-headline">Ton titre LinkedIn</Label>
                      <textarea
                        id="li-headline"
                        value={linkedinHeadline}
                        onChange={(e) => setLinkedinHeadline(e.target.value.slice(0, 220))}
                        rows={2}
                        placeholder="ex: Coach sportif certifié · Préparation physique &amp; remise en forme · Lyon"
                        className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="li-summary">Ton résumé LinkedIn</Label>
                      <textarea
                        id="li-summary"
                        value={linkedinSummary}
                        onChange={(e) => setLinkedinSummary(e.target.value.slice(0, 2000))}
                        rows={4}
                        placeholder="ex: J'accompagne des particuliers et sportifs amateurs à Lyon vers leurs objectifs…"
                        className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                </div>

                {/* Avis */}
                <div className="rounded-xl border border-border p-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Star className="h-4 w-4" /> Tes avis clients</p>
                  <textarea value={reviewsText} onChange={(e) => setReviewsText(e.target.value)} rows={3} placeholder="Colle ici tes meilleurs avis Google, DM Instagram, WhatsApp…" className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={analyzeRv} disabled={rvLoading || reviewsText.trim().length < 20}>
                    {rvLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyser mes avis'}
                  </Button>
                  {rvDone && rvStrengths.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">Points forts détectés : <span className="font-medium text-foreground">{rvStrengths.join(', ')}</span></p>
                  )}
                </div>

                {/* Manuel */}
                <details className="rounded-xl border border-dashed border-border p-4">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground">Ou remplis à la main ↓</summary>
                  <div className="mt-4 space-y-4">
                    <TextareaField label="Bio" value={bio} onChange={setBio} placeholder="Décris ce que tu fais en quelques phrases." />
                    <TextareaField label="Tes clients" value={targetAudience} onChange={setTargetAudience} placeholder="Qui accompagnes-tu ? Ex: sportifs 30-45 ans visant leur premier Hyrox." />
                    <TextareaField label="Tes résultats" value={results} onChange={setResults} placeholder="Qu’obtiennent concrètement tes clients ?" />
                  </div>
                </details>

                {/* Aperçu personnalisé immédiat (moment "aha") — dès qu'on a de la matière */}
                {(example || exLoading || igDone || rvDone) && (
                  <div className="rounded-xl border p-4" style={{ borderColor: 'var(--primary, #7C3AED)' }}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Aperçu de ton contenu</p>
                      <button type="button" onClick={loadExample} disabled={exLoading} className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50">
                        <RefreshCw className={cn('h-3 w-3', exLoading && 'animate-spin')} /> {example ? 'Régénérer' : 'Générer'}
                      </button>
                    </div>
                    {exLoading && !example ? (
                      <div className="flex items-center gap-2 py-5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> On rédige un exemple dans ta voix…</div>
                    ) : example ? (
                      <div className="rounded-lg bg-muted/40 p-3">
                        <p className="text-sm font-bold">{example.title}</p>
                        <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{example.content}</p>
                        {example.hashtags?.length > 0 && <p className="mt-2 text-xs text-primary">{example.hashtags.map((h) => `#${h}`).join(' ')}</p>}
                      </div>
                    ) : (
                      <p className="py-2 text-xs text-muted-foreground">Génère un exemple pour voir le ton qu’on appliquera à tes 12 posts.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold">Ajoute tes photos — on s’occupe du reste</h2>
                  <p className="text-sm text-muted-foreground">On les utilisera pour tes posts, ton site et tes visuels.</p>
                </div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files); }}
                  onClick={() => fileRef.current?.click()}
                  className={cn('flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 text-center transition-colors', dragOver ? 'border-primary bg-primary/5' : 'border-border')}
                >
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                  <p className="text-sm font-medium">{uploading ? 'Envoi…' : 'Glisse tes photos ou clique'}</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, HEIC · 10 Mo max · jusqu’à 10 photos</p>
                  <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" className="hidden" onChange={(e) => { if (e.target.files?.length) void uploadFiles(e.target.files); e.target.value = ''; }} />
                </div>
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {photos.map((p) => (
                      <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.thumbnailUrl || p.r2Url} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold">Tout est prêt — on génère ton contenu</h2>
                  <p className="text-sm text-muted-foreground">Voici un aperçu de ce qu’on va créer pour toi.</p>
                </div>

                {/* Résumé */}
                <ul className="space-y-1.5 rounded-xl border border-border p-4 text-sm">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Profil : <span className="font-medium">{displayName || '—'} · {speciality || '—'}{city ? ` · ${city}` : ''}</span></li>
                  {igDone && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Instagram analysé{igFollowers ? ` · ${igFollowers} abonnés` : ''}{igTone ? ` · ton ${igTone}` : ''}</li>}
                  {rvDone && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Avis clients importés</li>}
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> {photos.length} photo{photos.length > 1 ? 's' : ''} uploadée{photos.length > 1 ? 's' : ''}</li>
                </ul>

                {/* Complétion */}
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Profil complété à {completion.score}%</span>
                  </div>
                  <Progress value={completion.score} className="mt-2" />
                  {completion.nextHint && <p className="mt-2 text-xs text-muted-foreground">{completion.nextHint}</p>}
                </div>

                {/* Aperçu post exemple (AJOUT 3) */}
                <div className="rounded-xl border border-border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">Aperçu d’un post</p>
                    <button type="button" onClick={loadExample} disabled={exLoading} className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50">
                      <RefreshCw className={cn('h-3 w-3', exLoading && 'animate-spin')} /> Régénérer
                    </button>
                  </div>
                  {exLoading && !example ? (
                    <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> On prépare un exemple…</div>
                  ) : example ? (
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-sm font-bold">{example.title}</p>
                      <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{example.content}</p>
                      {example.hashtags?.length > 0 && <p className="mt-2 text-xs text-primary">{example.hashtags.map((h) => `#${h}`).join(' ')}</p>}
                    </div>
                  ) : (
                    <p className="py-4 text-sm text-muted-foreground">Aperçu indisponible — tu peux générer directement.</p>
                  )}
                </div>

                {photos.length === 0 && (
                  <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                    <span>Sans photo, ton site aura un visuel générique. <button type="button" onClick={() => go(3)} className="font-semibold underline">Ajouter une photo</button> ou continue sans.</span>
                  </div>
                )}

                <Button type="button" onClick={generate} disabled={generating} variant="gradient" className="w-full" size="lg">
                  {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}
                  {generating ? 'Génération en cours…' : 'Générer mon contenu'}
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="mt-6 flex items-center justify-between">
        {step > 1 ? (
          <Button type="button" variant="ghost" onClick={() => go(step - 1)}><ArrowLeft className="h-4 w-4" /> Précédent</Button>
        ) : <span />}
        {step < 4 && (
          <div className="flex items-center gap-2">
            {step >= 2 && step <= 3 && (
              <Button type="button" variant="ghost" onClick={() => go(step + 1)} className="text-muted-foreground">Passer</Button>
            )}
            <Button type="button" onClick={next} disabled={step === 1 && !canAdvance1}>
              Suivant <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <Label>{label}{required && <span className="text-primary"> *</span>}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder} className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    </div>
  );
}
