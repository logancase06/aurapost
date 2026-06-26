'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Camera, Briefcase, Star, Upload, Loader2, Trash2, Save, User, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SPECIALITY_SUGGESTIONS } from '@/lib/specialities';
import type { PhotoRow } from '@/lib/db/photos';
import { saveProfileDraft, importInstagramAction, analyzeReviewsAction, type ProfileDraft } from '@/app/onboarding/actions';
import { deletePhotoAction } from './actions';

export interface InitialProfile {
  displayName: string;
  speciality: string;
  city: string;
  tone: string;
  language: 'fr' | 'en';
  bio: string;
  targetAudience: string;
  results: string;
  instagramUrl: string;
  igTone: string | null;
  linkedinHeadline: string;
  linkedinSummary: string;
  reviewsText: string;
  reviewStrengths: string[];
  photos: PhotoRow[];
}

const TONES = [
  { value: 'motivant', label: 'Motivant', desc: 'Énergie, dépassement' },
  { value: 'educatif', label: 'Éducatif', desc: 'Conseils, pédagogie' },
  { value: 'personnel', label: 'Personnel', desc: 'Authenticité, storytelling' },
];

export default function ProfileEditor({ initial }: { initial: InitialProfile }) {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [speciality, setSpeciality] = useState(initial.speciality);
  const [city, setCity] = useState(initial.city);
  const [tone, setTone] = useState(initial.tone);
  const [language, setLanguage] = useState(initial.language);
  const [bio, setBio] = useState(initial.bio);
  const [targetAudience, setTargetAudience] = useState(initial.targetAudience);
  const [results, setResults] = useState(initial.results);
  const [linkedinHeadline, setLinkedinHeadline] = useState(initial.linkedinHeadline);
  const [linkedinSummary, setLinkedinSummary] = useState(initial.linkedinSummary);

  const [igUrl, setIgUrl] = useState(initial.instagramUrl);
  const [igTone, setIgTone] = useState<string | null>(initial.igTone);
  const [igLoading, setIgLoading] = useState(false);

  const [reviewsText, setReviewsText] = useState(initial.reviewsText);
  const [rvStrengths, setRvStrengths] = useState<string[]>(initial.reviewStrengths);
  const [rvLoading, setRvLoading] = useState(false);

  const [photos, setPhotos] = useState<PhotoRow[]>(initial.photos);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function markSaved(ok: boolean) {
    setSaveState(ok ? 'saved' : 'error');
    if (resetTimer.current) clearTimeout(resetTimer.current);
    if (ok) resetTimer.current = setTimeout(() => setSaveState('idle'), 2000);
  }

  const draftRef = useRef<ProfileDraft>(null as unknown as ProfileDraft);
  // eslint-disable-next-line react-hooks/refs -- captures latest draft for useCallback without stale closure; intentional pattern
  draftRef.current = { displayName, speciality, city, tone, language, bio, targetAudience, results, linkedinHeadline, linkedinSummary };

  const save = useCallback(async (): Promise<boolean> => {
    setSaveState('saving');
    const res = await saveProfileDraft(draftRef.current);
    markSaved(res.ok);
    if (!res.ok) toast.error(res.error || 'Sauvegarde impossible');
    return res.ok;
  }, []);

  // Autosave debounce 1s (même pattern que l'onboarding).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!displayName.trim() || !speciality.trim()) return; // saveProfileDraft exige nom + spécialité
    const t = setTimeout(() => void save(), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, speciality, city, tone, language, bio, targetAudience, results, linkedinHeadline, linkedinSummary]);

  // Scroll vers la section demandée (?section=photos depuis le badge de complétion).
  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get('section');
    if (section) document.getElementById(`section-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  async function reanalyzeIg() {
    if (!igUrl.trim()) return;
    setIgLoading(true);
    const res = await importInstagramAction(igUrl.trim());
    setIgLoading(false);
    if (!res.ok) {
      toast.error(res.error || 'Analyse impossible');
      return;
    }
    setIgTone(res.analysis?.ton_dominant ?? null);
    toast.success('Profil Instagram ré-analysé ✓');
  }

  async function reanalyzeRv() {
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
    toast.success('Avis ré-analysés ✓');
  }

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, 20 - photos.length);
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
        if (res.ok && data?.ok) setPhotos((prev) => [data.photo, ...prev].slice(0, 20));
        else toast.error(data?.error || 'Upload impossible');
      } catch {
        toast.error('Upload impossible');
      }
    }
    setUploading(false);
  }

  async function removePhoto(id: string) {
    const prev = photos;
    setPhotos((p) => p.filter((x) => x.id !== id)); // optimiste
    const res = await deletePhotoAction(id);
    if (!res.ok) {
      setPhotos(prev);
      toast.error(res.error || 'Suppression impossible');
    } else {
      toast.success('Photo supprimée');
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><User className="h-6 w-6 text-primary" /> Mon profil</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Tes informations alimentent tes posts et ton site. Mets-les à jour avant chaque nouvelle génération.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs">
            {saveState === 'saving' && <span className="text-muted-foreground">Enregistrement…</span>}
            {saveState === 'saved' && <span className="text-success">Sauvegardé ✓</span>}
            {saveState === 'error' && <span className="text-destructive">Échec — réessaie</span>}
          </span>
          <Button onClick={() => void save()} variant="outline" size="sm">
            <Save className="h-4 w-4" /> Sauvegarder
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Profil de base */}
        <Section id="base" title="Profil de base">
          <FieldText label="Nom public" value={displayName} onChange={setDisplayName} required />
          <div>
            <FieldText label="Spécialité" value={speciality} onChange={setSpeciality} required placeholder="ex: Préparation physique CrossFit" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SPECIALITY_SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setSpeciality(s)} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldText label="Ville" value={city} onChange={setCity} placeholder="ex: Lyon" />
            <div className="space-y-2">
              <Label htmlFor="prof-lang">Langue des posts</Label>
              <select id="prof-lang" value={language} onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
        </Section>

        {/* Ta présence */}
        <Section id="presence" title="Ta présence">
          <div>
            <Label htmlFor="prof-ig" className="mb-2 flex items-center gap-2 text-sm font-semibold"><Camera className="h-4 w-4" /> Instagram</Label>
            <div className="flex gap-2">
              <Input id="prof-ig" type="url" inputMode="url" value={igUrl} onChange={(e) => setIgUrl(e.target.value)} placeholder="https://instagram.com/ton_compte" />
              <Button type="button" variant="outline" onClick={reanalyzeIg} disabled={igLoading || !igUrl.trim()}>
                {igLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ré-analyser'}
              </Button>
            </div>
            {igTone && <p className="mt-2 text-xs text-muted-foreground">Ton détecté : <span className="font-medium text-foreground">{igTone}</span></p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prof-li-head"><Briefcase className="mr-1 inline h-4 w-4" /> Titre LinkedIn</Label>
            <textarea id="prof-li-head" value={linkedinHeadline} onChange={(e) => setLinkedinHeadline(e.target.value.slice(0, 220))} rows={2} placeholder="ex: Coach sportif certifié · Préparation physique · Lyon" className={areaCls} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prof-li-sum">Résumé LinkedIn</Label>
            <textarea id="prof-li-sum" value={linkedinSummary} onChange={(e) => setLinkedinSummary(e.target.value.slice(0, 2000))} rows={4} placeholder="ex: J'accompagne des sportifs amateurs vers leurs objectifs…" className={areaCls} />
          </div>
          <div>
            <Label htmlFor="prof-avis" className="mb-2 flex items-center gap-2 text-sm font-semibold"><Star className="h-4 w-4" /> Avis clients</Label>
            <textarea id="prof-avis" value={reviewsText} onChange={(e) => setReviewsText(e.target.value)} rows={3} placeholder="Colle ici tes meilleurs avis Google, DM Instagram, WhatsApp…" className={areaCls} />
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={reanalyzeRv} disabled={rvLoading || reviewsText.trim().length < 20}>
              {rvLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ré-analyser mes avis'}
            </Button>
            {rvStrengths.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Points forts : <span className="font-medium text-foreground">{rvStrengths.join(', ')}</span></p>}
          </div>
        </Section>

        {/* Photos */}
        <Section id="photos" title="Photos">
          <div
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-center transition-colors hover:border-primary/40"
          >
            {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
            <p className="text-sm font-medium">{uploading ? 'Envoi…' : 'Ajouter des photos'}</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, HEIC · 10 Mo max</p>
            <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" className="hidden" onChange={(e) => { if (e.target.files?.length) void uploadFiles(e.target.files); e.target.value = ''; }} />
          </div>
          {photos.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {photos.map((p) => (
                <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumbnailUrl || p.r2Url} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => void removePhoto(p.id)} aria-label="Supprimer la photo" className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><ImageIcon className="h-4 w-4" /> Aucune photo pour l’instant.</p>
          )}
        </Section>

        {/* Résultats & bio */}
        <Section id="results" title="Résultats & bio">
          <FieldArea label="Bio" value={bio} onChange={setBio} placeholder="Décris ce que tu fais en quelques phrases." />
          <FieldArea label="Tes clients cibles" value={targetAudience} onChange={setTargetAudience} placeholder="Qui accompagnes-tu ? Ex: sportifs 30-45 ans visant leur premier Hyrox." />
          <FieldArea label="Résultats concrets" value={results} onChange={setResults} placeholder="Qu’obtiennent concrètement tes clients ?" />
        </Section>

        <p className="text-center text-xs text-muted-foreground">
          ✦ Tes prochains posts générés — et ton site — utiliseront ces informations.
        </p>
      </div>
    </div>
  );
}

const areaCls = 'flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <Card id={`section-${id}`} className="scroll-mt-24 p-5">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

function FieldText({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}{required && <span className="text-primary"> *</span>}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function FieldArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder} className={areaCls} />
    </div>
  );
}
