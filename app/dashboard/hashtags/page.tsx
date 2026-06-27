'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Hash, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import DashboardShell from '@/app/dashboard/DashboardShell';
import { generateHashtagsAction, type HashtagSet } from '@/app/dashboard/analyze/actions';

export default function HashtagsPage() {
  const [theme, setTheme] = useState('');
  const [results, setResults] = useState<HashtagSet[] | null>(null);
  const [pending, startTransition] = useTransition();
  const [copiedSet, setCopiedSet] = useState<string | null>(null);
  const [saved, setSaved] = useState<HashtagSet[]>([]);

  function generate() {
    if (!theme.trim()) return;
    startTransition(async () => {
      const res = await generateHashtagsAction(theme.trim());
      if (res.ok && res.data) {
        setResults(res.data);
      } else {
        toast.error(res.error || 'Génération impossible');
      }
    });
  }

  function copySet(set: HashtagSet) {
    const text = set.tags.map((t) => `#${t}`).join(' ');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSet(set.name);
      toast.success('Hashtags copiés !');
      setTimeout(() => setCopiedSet(null), 1500);
    });
  }

  function saveSet(set: HashtagSet) {
    setSaved((prev) => {
      if (prev.find((s) => s.name === set.name && s.tags[0] === set.tags[0])) return prev;
      return [...prev, set];
    });
    toast.success('Ensemble sauvegardé ✦');
  }

  function removeSet(index: number) {
    setSaved((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <DashboardShell active="/dashboard/hashtags">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Générateur de hashtags</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entre un thème ou un sujet de post — l&apos;IA génère 3 ensembles de hashtags optimisés pour Instagram.
          </p>
        </div>

        <Card className="p-5">
          <div className="flex gap-3">
            <Input
              placeholder="ex: préparation mentale marathon, nutrition sportive..."
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generate()}
              className="flex-1"
            />
            <Button onClick={generate} disabled={pending || !theme.trim()}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Générer
            </Button>
          </div>
        </Card>

        {results && (
          <div className="mt-6 space-y-4">
            {results.map((set) => (
              <Card key={set.name} className="p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{set.name}</h3>
                    <p className="text-xs text-muted-foreground">{set.description} · {set.tags.length} hashtags</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8" onClick={() => saveSet(set)}>
                      Sauvegarder
                    </Button>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => copySet(set)}>
                      {copiedSet === set.name ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                      Copier
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {set.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary">
                      <Hash className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {saved.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ensembles sauvegardés</h2>
            <div className="space-y-3">
              {saved.map((set, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{set.name} — {set.tags.length} hashtags</p>
                      <p className="mt-1 text-sm text-primary">{set.tags.map((t) => `#${t}`).join(' ')}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => copySet(set)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <button onClick={() => removeSet(i)} className="text-xs text-muted-foreground hover:text-destructive">✕</button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
