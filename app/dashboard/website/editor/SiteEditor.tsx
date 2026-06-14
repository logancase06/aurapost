'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ExternalLink, Loader2, Upload, Trash2, Plus, Monitor, Smartphone,
  Eye, Pencil, Globe, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SiteContent } from '@/lib/db/site';
import type { SiteEditorData } from '@/lib/db/coach-site';
import { saveSiteContent, uploadSitePhoto, setSitePublished } from '../actions';

const STYLE_LABEL: Record<string, string> = { impact: 'Impact', clarte: 'Clarté', authenticite: 'Authenticité' };

export default function SiteEditor({ initial, appDomain }: { initial: SiteEditorData; appDomain: string }) {
  const subdomain = initial.subdomain as string;
  const [content, setContent] = useState<SiteContent>(initial.content);
  const [published, setPublished] = useState(initial.published);
  const [publishing, setPublishing] = useState(false);

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const [iframeKey, setIframeKey] = useState(0);

  const firstRun = useRef(true);
  const contentRef = useRef(content);
  contentRef.current = content;

  function markSaved(ok: boolean) {
    setSaveState(ok ? 'saved' : 'error');
    if (resetTimer.current) clearTimeout(resetTimer.current);
    if (ok) resetTimer.current = setTimeout(() => setSaveState('idle'), 2000);
  }

  // Autosave debounce 1s (pattern onboarding) + refresh aperçu après save OK.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(async () => {
      setSaveState('saving');
      const res = await saveSiteContent(contentRef.current);
      markSaved(res.ok);
      if (res.ok) setIframeKey((k) => k + 1);
      else toast.error(res.error || 'Sauvegarde impossible');
    }, 1000);
    return () => clearTimeout(t);
  }, [content]);

  // Avertit si l'utilisateur quitte pendant une sauvegarde.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (saveState === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [saveState]);

  // ── Updaters immutables ──────────────────────────────────────────────────
  const setHero = (patch: Partial<SiteContent['hero']>) => setContent((c) => ({ ...c, hero: { ...c.hero, ...patch } }));
  const setAbout = (patch: Partial<SiteContent['about']>) => setContent((c) => ({ ...c, about: { ...c.about, ...patch } }));
  const setContact = (patch: Partial<SiteContent['contact']>) => setContent((c) => ({ ...c, contact: { ...c.contact, ...patch } }));
  const setStrength = (i: number, patch: Partial<SiteContent['strengths'][number]>) =>
    setContent((c) => ({ ...c, strengths: c.strengths.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const setTestimonials = (list: SiteContent['testimonials']) => setContent((c) => ({ ...c, testimonials: list }));

  const uploadPhoto = useCallback(async (file: File): Promise<string | null> => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Photo trop lourde (max 10 Mo).');
      return null;
    }
    const fd = new FormData();
    fd.append('photo', file);
    const res = await uploadSitePhoto(fd);
    if (!res.ok || !res.url) {
      toast.error(res.error || 'Upload impossible');
      return null;
    }
    return res.url;
  }, []);

  async function togglePublish() {
    setPublishing(true);
    const res = await setSitePublished(!published);
    setPublishing(false);
    if (!res.ok) {
      toast.error(res.error || 'Action impossible');
      return;
    }
    setPublished(!published);
    toast.success(!published ? 'Site publié 🌐' : 'Site dépublié');
    setIframeKey((k) => k + 1);
  }

  const previewSrc = `/site/${subdomain}?preview=1`;

  const Editor = (
    <div className="space-y-5 pb-24">
      {/* HERO */}
      <Panel title="Accroche (hero)">
        <FieldText label="Titre principal" value={content.hero.title ?? ''} max={80} onChange={(v) => setHero({ title: v })} />
        <FieldArea label="Sous-titre" value={content.hero.subtitle ?? ''} max={200} onChange={(v) => setHero({ subtitle: v })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldText label="Texte du bouton" value={content.hero.ctaLabel ?? ''} max={30} placeholder="Prendre RDV" onChange={(v) => setHero({ ctaLabel: v })} />
          <FieldText label="Lien du bouton" value={content.hero.ctaUrl ?? ''} placeholder="https://calendly.com/… ou wa.me/…" onChange={(v) => setHero({ ctaUrl: v })} />
        </div>
        <PhotoField label="Photo du hero" url={content.hero.photoUrl} onUpload={uploadPhoto} onChange={(u) => setHero({ photoUrl: u })} />
      </Panel>

      {/* FORCES */}
      <Panel title="Mes forces (3 cartes)">
        {content.strengths.map((s, i) => (
          <div key={i} className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Force {i + 1}</span>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                <input type="checkbox" checked={s.enabled} onChange={(e) => setStrength(i, { enabled: e.target.checked })} />
                Affichée
              </label>
            </div>
            <FieldText label="Titre" value={s.title} max={40} onChange={(v) => setStrength(i, { title: v })} />
            <FieldArea label="Description" value={s.description} max={120} onChange={(v) => setStrength(i, { description: v })} />
          </div>
        ))}
      </Panel>

      {/* TÉMOIGNAGES */}
      <Panel title="Témoignages">
        {content.testimonials.length === 0 && (
          <p className="text-xs text-muted-foreground">Aucun témoignage — la section sera masquée sur le site.</p>
        )}
        {content.testimonials.map((q, i) => (
          <div key={i} className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Témoignage {i + 1}</span>
              <button type="button" onClick={() => setTestimonials(content.testimonials.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <FieldArea label="Citation" value={q.quote} max={300} onChange={(v) => setTestimonials(content.testimonials.map((t, j) => (j === i ? { ...t, quote: v } : t)))} />
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldText label="Prénom" value={q.author} max={50} onChange={(v) => setTestimonials(content.testimonials.map((t, j) => (j === i ? { ...t, author: v } : t)))} />
              <FieldText label="Résultat (ex: -8 kg)" value={q.result ?? ''} max={60} onChange={(v) => setTestimonials(content.testimonials.map((t, j) => (j === i ? { ...t, result: v } : t)))} />
            </div>
          </div>
        ))}
        {content.testimonials.length < 6 && (
          <Button type="button" variant="outline" size="sm" onClick={() => setTestimonials([...content.testimonials, { quote: '', author: '' }])}>
            <Plus className="h-4 w-4" /> Ajouter un témoignage
          </Button>
        )}
      </Panel>

      {/* À PROPOS */}
      <Panel title="À propos">
        <FieldText label="Votre titre" value={content.about.headline ?? ''} max={100} onChange={(v) => setAbout({ headline: v })} />
        <FieldArea label="Votre bio" value={content.about.bio ?? ''} max={800} rows={6} onChange={(v) => setAbout({ bio: v })} />
        <PhotoField label="Photo de profil" url={content.about.photoUrl} onUpload={uploadPhoto} onChange={(u) => setAbout({ photoUrl: u })} />
      </Panel>

      {/* CONTACT */}
      <Panel title="Contact & réservation">
        <FieldText label="Email de contact" type="email" inputMode="email" autoComplete="email" value={content.contact.email ?? ''} onChange={(v) => setContact({ email: v })} placeholder="coach@exemple.com" />
        <FieldText label="WhatsApp" type="tel" inputMode="tel" autoComplete="tel" value={content.contact.whatsapp ?? ''} onChange={(v) => setContact({ whatsapp: v })} placeholder="+33612345678" helper="Format international : +33612345678" />
        <FieldText
          label="Instagram"
          value={content.contact.instagram ?? ''}
          onChange={(v) => setContact({ instagram: v })}
          onBlur={(v) => {
            // « @handle » → URL complète (le rendu sait déjà normaliser, mais on clarifie).
            const t = v.trim();
            if (t && !/^https?:\/\//.test(t)) setContact({ instagram: `https://instagram.com/${t.replace(/^@/, '')}` });
          }}
          placeholder="@ton_compte ou URL"
        />
        <FieldText label="Lien de réservation" type="url" inputMode="url" value={content.contact.calendly ?? ''} onChange={(v) => setContact({ calendly: v })} placeholder="https://calendly.com/votre-lien" helper="Calendly, Cal.com… → devient le bouton principal de ton site" />
      </Panel>
    </div>
  );

  const Preview = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="text-xs text-muted-foreground">Aperçu live</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setDevice('desktop')} className={cn('rounded p-1.5', device === 'desktop' ? 'bg-primary/15 text-primary' : 'text-muted-foreground')}><Monitor className="h-4 w-4" /></button>
          <button onClick={() => setDevice('mobile')} className={cn('rounded p-1.5', device === 'mobile' ? 'bg-primary/15 text-primary' : 'text-muted-foreground')}><Smartphone className="h-4 w-4" /></button>
          <button onClick={() => setIframeKey((k) => k + 1)} className="text-xs text-primary hover:underline">Actualiser</button>
        </div>
      </div>
      <div className="flex flex-1 items-start justify-center overflow-auto bg-muted/30 p-4">
        <iframe
          key={iframeKey}
          src={previewSrc}
          title="Aperçu du site"
          className="h-[calc(100vh-220px)] rounded-xl border border-border bg-white shadow-xl transition-all"
          style={{ width: device === 'mobile' ? 375 : '100%', maxWidth: device === 'mobile' ? 375 : '100%' }}
        />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2.5">
        <Link href="/dashboard/website" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{initial.profile.name || 'Mon site'}</span>
          <Badge variant="secondary">{STYLE_LABEL[initial.style] ?? initial.style}</Badge>
        </div>
        <span className="text-xs">
          {saveState === 'saving' && <span className="text-muted-foreground">Sauvegarde…</span>}
          {saveState === 'saved' && <span className="text-success">Sauvegardé ✓</span>}
          {saveState === 'error' && <span className="text-destructive">Échec — réessaie</span>}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/site/${subdomain}`} target="_blank" rel="noreferrer">Voir le site <ExternalLink className="h-3.5 w-3.5" /></a>
          </Button>
          <Button size="sm" variant={published ? 'ghost' : 'gradient'} onClick={togglePublish} disabled={publishing}>
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : published ? <EyeOff className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
            {published ? 'Dépublier' : 'Publier'}
          </Button>
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="flex border-b border-border lg:hidden">
        <button onClick={() => setMobileTab('edit')} className={cn('flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium', mobileTab === 'edit' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground')}>
          <Pencil className="h-4 w-4" /> Éditer
        </button>
        <button onClick={() => setMobileTab('preview')} className={cn('flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium', mobileTab === 'preview' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground')}>
          <Eye className="h-4 w-4" /> Aperçu
        </button>
      </div>

      {/* Body : 2 colonnes desktop, 1 colonne + tabs mobile */}
      <div className="flex flex-1 overflow-hidden">
        <div className={cn('overflow-y-auto p-4 lg:w-[45%] lg:border-r lg:border-border', mobileTab === 'edit' ? 'block w-full' : 'hidden lg:block')}>
          {Editor}
        </div>
        <div className={cn('lg:w-[55%]', mobileTab === 'preview' ? 'block w-full' : 'hidden lg:block')}>
          {Preview}
        </div>
      </div>
    </div>
  );
}

// ── Sous-composants ──────────────────────────────────────────────────────────

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-bold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function FieldText({ label, value, onChange, onBlur, max, placeholder, helper, type, inputMode, autoComplete }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: (v: string) => void;
  max?: number;
  placeholder?: string;
  helper?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        {max && <span className="text-[10px] text-muted-foreground">{value.length}/{max}</span>}
      </div>
      <Input
        value={value}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={max}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur ? (e) => onBlur(e.target.value) : undefined}
      />
      {helper && <p className="text-[10px] text-muted-foreground">{helper}</p>}
    </div>
  );
}

function FieldArea({ label, value, onChange, max, rows = 3, placeholder }: { label: string; value: string; onChange: (v: string) => void; max?: number; rows?: number; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        {max && <span className="text-[10px] text-muted-foreground">{value.length}/{max}</span>}
      </div>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        maxLength={max}
        onChange={(e) => onChange(e.target.value)}
        className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

function PhotoField({ label, url, onUpload, onChange }: { label: string; url?: string; onUpload: (f: File) => Promise<string | null>; onChange: (u: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    const u = await onUpload(file);
    setBusy(false);
    if (u) onChange(u);
  }
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground"><Upload className="h-5 w-5" /></div>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : url ? 'Changer' : 'Ajouter'}
          </Button>
          {url && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>Supprimer</Button>
          )}
        </div>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" className="hidden" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
    </div>
  );
}
