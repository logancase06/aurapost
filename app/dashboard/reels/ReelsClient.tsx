'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Video, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import DashboardShell from '@/app/dashboard/DashboardShell';
import { generateReelScriptAction, type ReelScript } from './actions';
import { UpgradeBanner } from '@/components/UpgradeGate';

export default function ReelsClient({ canExport }: { canExport: boolean }) {
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<ReelScript | null>(null);
  const [pending, startTransition] = useTransition();

  function generate() {
    if (!topic.trim()) return;
    startTransition(async () => {
      const res = await generateReelScriptAction(topic.trim());
      if (res.ok && res.data) setResult(res.data);
      else toast.error(res.error || 'Génération impossible');
    });
  }

  function copyAll() {
    if (!result) return;
    const text = [
      `TITRE : ${result.title}`,
      '',
      `[ACCROCHE – ${result.hook.duration}]`,
      result.hook.text,
      result.hook.visualNote ? `Visuel : ${result.hook.visualNote}` : '',
      '',
      `[DÉVELOPPEMENT – ${result.body.duration}]`,
      result.body.text,
      result.body.visualNote ? `Visuel : ${result.body.visualNote}` : '',
      '',
      `[CONCLUSION / CTA – ${result.cta.duration}]`,
      result.cta.text,
      '',
      `HASHTAGS : ${result.hashtags.map((h) => `#${h}`).join(' ')}`,
      '',
      `CAPTION : ${result.caption}`,
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => toast.success('Script copié !')).catch(() => toast.error('Copie impossible'));
  }

  return (
    <DashboardShell active="/dashboard/reels">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Video className="h-6 w-6 text-primary" /> Script Reels / TikTok
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Génère un script structuré pour un Reel Instagram ou une vidéo TikTok (60s) — accroche, développement, CTA.
          </p>
        </div>

        {!canExport && (
          <UpgradeBanner featureName="Script Reels & TikTok" requiredPlan="pack_complet" className="mb-6" />
        )}

        <Card className="p-5">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Sujet de la vidéo</Label>
              <Input
                placeholder="ex: 3 erreurs qui sabotent ta récupération, comment rester motivé en hiver..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generate()}
              />
            </div>
            <Button onClick={generate} disabled={pending || !topic.trim()} variant="gradient">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Générer le script
            </Button>
          </div>
        </Card>

        {result && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{result.title}</h2>
              <Button size="sm" variant="outline" onClick={copyAll}>
                <Copy className="h-4 w-4" /> Tout copier
              </Button>
            </div>
            <ScriptBlock tag="ACCROCHE" duration={result.hook.duration} text={result.hook.text} visualNote={result.hook.visualNote} color="hsl(var(--primary))" />
            <ScriptBlock tag="DÉVELOPPEMENT" duration={result.body.duration} text={result.body.text} visualNote={result.body.visualNote} color="hsl(var(--accent))" />
            <ScriptBlock tag="CONCLUSION / CTA" duration={result.cta.duration} text={result.cta.text} color="hsl(var(--success))" />
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Caption & Hashtags</p>
              <p className="text-sm">{result.caption}</p>
              <p className="mt-2 text-sm text-primary">{result.hashtags.map((h) => `#${h}`).join(' ')}</p>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button onClick={() => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1200); }).catch(() => {})} className="text-muted-foreground hover:text-primary">
      {done ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function ScriptBlock({ tag, duration, text, visualNote, color }: { tag: string; duration: string; text: string; visualNote?: string; color: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2" style={{ borderLeft: `4px solid ${color}` }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest" style={{ color }}>{tag}</span>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{duration}</span>
        </div>
        <CopyBtn text={text} />
      </div>
      <div className="px-4 pb-4">
        <p className="text-sm whitespace-pre-line">{text}</p>
        {visualNote && <p className="mt-2 rounded bg-secondary px-2 py-1 text-xs text-muted-foreground">🎬 {visualNote}</p>}
      </div>
    </Card>
  );
}
