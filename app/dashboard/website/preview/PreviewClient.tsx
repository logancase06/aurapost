'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader2, Globe, RefreshCw, Pencil, ArrowLeft, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CoachSite, { type CoachSiteData } from '@/templates/coach-site/CoachSite';
import type { SiteContent } from '@/lib/site-content';
import { updateSiteContentAction } from './actions';

type Section = 'hero' | 'about' | 'services' | 'testimonials' | 'cta' | null;

export default function PreviewClient({
  subdomain,
  status: initialStatus,
  displayName,
  speciality,
  city,
  photos,
  themeColor,
  content: initialContent,
}: {
  subdomain: string;
  status: string;
  displayName: string;
  speciality: string;
  city: string | null;
  photos: string[];
  themeColor: string;
  content: SiteContent;
}) {
  const router = useRouter();
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [status, setStatus] = useState(initialStatus);
  const [editing, setEditing] = useState<Section>(null);
  const [draft, setDraft] = useState<SiteContent>(initialContent);
  const [busy, setBusy] = useState<'publish' | 'regen' | 'save' | null>(null);

  const data: CoachSiteData = {
    subdomain,
    displayName,
    speciality,
    city,
    themeColor,
    photoUrl: photos[0] ?? null,
    heroTitle: content.hero_title,
    heroSubtitle: content.hero_subtitle,
    about: content.about,
    cta: content.cta,
    services: content.services,
    testimonials: content.testimonials,
  };

  function openEdit(section: Section) {
    setDraft(content);
    setEditing(section);
  }

  async function saveSection() {
    setBusy('save');
    const res = await updateSiteContentAction(draft);
    setBusy(null);
    if (!res.ok) {
      toast.error(res.error || 'Enregistrement impossible');
      return;
    }
    setContent(draft);
    setEditing(null);
    toast.success('Section mise à jour ✓');
  }

  async function publish() {
    setBusy('publish');
    try {
      const res = await fetch('/api/websites/publish', { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || 'Publication impossible');
        return;
      }
      setStatus('active');
      toast.success('Votre site est en ligne 🌐');
    } finally {
      setBusy(null);
    }
  }

  async function regenerate() {
    if (!confirm('Régénérer tout le contenu du site avec les mêmes données ?')) return;
    setBusy('regen');
    try {
      const res = await fetch('/api/websites/generate', { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || 'Régénération impossible');
        return;
      }
      setContent(d.site.content);
      toast.success('Site régénéré ✦');
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const SECTIONS: { key: Exclude<Section, null>; label: string }[] = [
    { key: 'hero', label: 'Hero' },
    { key: 'about', label: 'À propos' },
    { key: 'services', label: 'Services' },
    { key: 'testimonials', label: 'Témoignages' },
    { key: 'cta', label: 'Appel à l’action' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/website">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Link>
          </Button>
          <Badge variant={status === 'active' ? 'success' : 'warning'}>{status === 'active' ? 'En ligne' : 'Brouillon'}</Badge>
          <code className="hidden rounded bg-secondary px-2 py-1 text-xs text-primary sm:inline">{subdomain}.aurapost.fr</code>

          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={regenerate} disabled={busy !== null}>
              {busy === 'regen' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Régénérer
            </Button>
            <Button variant="gradient" size="sm" onClick={publish} disabled={busy !== null || status === 'active'}>
              {busy === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Publier
            </Button>
          </div>
        </div>

        {/* Boutons d'édition par section */}
        <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 pb-3 md:px-6">
          {SECTIONS.map((s) => (
            <Button key={s.key} variant="secondary" size="sm" onClick={() => openEdit(s.key)}>
              <Pencil className="h-3.5 w-3.5" /> {s.label}
            </Button>
          ))}
        </div>
      </div>

      {status === 'active' && (
        <div className="mx-auto max-w-6xl px-4 pt-4 md:px-6">
          <Button asChild variant="link" size="sm">
            <Link href={`/site/${subdomain}`} target="_blank">
              <Globe className="h-4 w-4" /> Voir le site public
            </Link>
          </Button>
        </div>
      )}

      {/* Aperçu réel */}
      <div className="mx-auto my-6 max-w-5xl overflow-hidden rounded-xl border border-border bg-white">
        <CoachSite data={data} />
      </div>

      {/* Dialog d'édition */}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier — {SECTIONS.find((s) => s.key === editing)?.label}</DialogTitle>
          </DialogHeader>

          {editing === 'hero' && (
            <div className="space-y-3">
              <FieldText label="Titre" value={draft.hero_title} onChange={(v) => setDraft({ ...draft, hero_title: v })} />
              <FieldText label="Sous-titre" value={draft.hero_subtitle} onChange={(v) => setDraft({ ...draft, hero_subtitle: v })} />
            </div>
          )}
          {editing === 'about' && (
            <FieldArea label="Texte À propos" value={draft.about} onChange={(v) => setDraft({ ...draft, about: v })} />
          )}
          {editing === 'cta' && <FieldText label="Appel à l’action" value={draft.cta} onChange={(v) => setDraft({ ...draft, cta: v })} />}
          {editing === 'services' && (
            <div className="space-y-4">
              {draft.services.map((s, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                  <FieldText label={`Service ${i + 1} — titre`} value={s.title} onChange={(v) => {
                    const next = [...draft.services]; next[i] = { ...s, title: v }; setDraft({ ...draft, services: next });
                  }} />
                  <FieldArea label="Description" value={s.description} onChange={(v) => {
                    const next = [...draft.services]; next[i] = { ...s, description: v }; setDraft({ ...draft, services: next });
                  }} />
                </div>
              ))}
            </div>
          )}
          {editing === 'testimonials' && (
            <div className="space-y-4">
              {draft.testimonials.map((t, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                  <FieldText label={`Témoignage ${i + 1} — nom`} value={t.name} onChange={(v) => {
                    const next = [...draft.testimonials]; next[i] = { ...t, name: v }; setDraft({ ...draft, testimonials: next });
                  }} />
                  <FieldArea label="Citation" value={t.quote} onChange={(v) => {
                    const next = [...draft.testimonials]; next[i] = { ...t, quote: v }; setDraft({ ...draft, testimonials: next });
                  }} />
                </div>
              ))}
            </div>
          )}

          <Button onClick={saveSection} variant="gradient" className="mt-2 w-full" disabled={busy === 'save'}>
            {busy === 'save' && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FieldText({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FieldArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
