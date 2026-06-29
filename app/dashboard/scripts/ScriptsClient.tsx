'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Clapperboard, Loader2, Copy, Check, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { generateVideoScriptAction, type VideoFormat, type VideoStyle, type VideoScript } from './actions';

const FORMATS: { value: VideoFormat; label: string }[] = [
  { value: 'reel_tiktok', label: 'Reel / TikTok (30-60s)' },
  { value: 'youtube_shorts', label: 'YouTube Shorts (60s)' },
  { value: 'linkedin', label: 'LinkedIn (60-90s)' },
];

const STYLES: { value: VideoStyle; label: string }[] = [
  { value: 'educatif', label: 'Educatif' },
  { value: 'motivant', label: 'Motivant' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'conseil', label: 'Conseil direct' },
];

export default function ScriptsClient() {
  const [sujet, setSujet] = useState('');
  const [format, setFormat] = useState<VideoFormat>('reel_tiktok');
  const [style, setStyle] = useState<VideoStyle>('educatif');
  const [result, setResult] = useState<VideoScript | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function generate() {
    if (!sujet.trim()) return;
    startTransition(async () => {
      const res = await generateVideoScriptAction(sujet.trim(), format, style);
      if (res.ok && res.data) setResult(res.data);
      else toast.error(res.error || 'Generation impossible');
    });
  }

  function copyAll() {
    if (!result) return;
    const lines = [
      '=== ACCROCHE (0-3s) ===', result.accroche, '',
      '=== SCRIPT ===', ...result.blocs.map((b) => `[${b.temps}] ${b.texte}`), '',
      '=== CALL TO ACTION ===', result.cta, '',
      '=== HASHTAGS ===', result.hashtags.map((h) => `#${h}`).join(' '), '',
      `Duree estimee : ${result.duree_estimee}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => { setCopied(true); toast.success('Script copie !'); setTimeout(() => setCopied(false), 1500); })
      .catch(() => toast.error('Copie impossible'));
  }

  return (
    <>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Clapperboard className="h-6 w-6 text-primary" /> Scripts video
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Genere un script percutant pour tes videos — accroche, corps, CTA, hashtags.
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="sujet">Sujet de ta video</Label>
              <Input
                id="sujet"
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                placeholder="ex : les 3 erreurs de nutrition que font mes clients"
                className="mt-1.5"
                onKeyDown={(e) => { if (e.key === 'Enter') generate(); }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Format</Label>
                <div className="flex flex-col gap-2">
                  {FORMATS.map((f) => (
                    <label key={f.value} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="radio" name="format" value={f.value} checked={format === f.value} onChange={() => setFormat(f.value)} className="accent-primary" />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Style</Label>
                <div className="flex flex-col gap-2">
                  {STYLES.map((s) => (
                    <label key={s.value} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="radio" name="style" value={s.value} checked={style === s.value} onChange={() => setStyle(s.value)} className="accent-primary" />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={generate} disabled={pending || !sujet.trim()} className="w-full">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generer mon script
            </Button>
          </div>
        </Card>

        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{result.duree_estimee}</span>
              </div>
              <Button size="sm" variant="outline" onClick={copyAll}>
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                Copier le script
              </Button>
            </div>

            <Card className="border-primary/30 bg-primary/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">Accroche — 0 a 3s</p>
              <p className="text-base font-semibold leading-snug">{result.accroche}</p>
            </Card>

            <div className="space-y-2">
              {result.blocs.map((bloc, i) => (
                <Card key={i} className="p-4">
                  <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-xs font-mono text-muted-foreground mb-2">
                    {bloc.temps}
                  </span>
                  <p className="text-sm leading-relaxed">{bloc.texte}</p>
                </Card>
              ))}
            </div>

            <Card className="border-success/30 bg-success/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-success mb-2">Call to action</p>
              <p className="text-sm">{result.cta}</p>
            </Card>

            {result.hashtags.length > 0 && (
              <p className="text-sm text-primary">
                {result.hashtags.map((h) => `#${h}`).join(' ')}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
