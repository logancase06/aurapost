'use client';

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Captions, Loader2, Copy, Check, Download, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { UpgradeBanner } from '@/components/UpgradeGate';

const LANGUAGES = [
  { value: 'fr', label: 'Francais' },
  { value: 'en', label: 'Anglais' },
  { value: 'es', label: 'Espagnol' },
];

const ACCEPT = '.mp4,.mov,.mp3,.m4a,.ogg,.wav,.webm,audio/*,video/mp4,video/quicktime';
const MAX_MB = 25;

export default function SubtitlesClient({ canTranscribe }: { canTranscribe: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState('fr');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; srt: string } | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!canTranscribe) {
    return (
      <>
        <div className="mx-auto max-w-2xl">
          <h1 className="flex items-center gap-2 text-2xl font-bold mb-6">
            <Captions className="h-6 w-6 text-primary" /> Transcription & sous-titres
          </h1>
          <UpgradeBanner featureName="Transcription & sous-titres" requiredPlan="content_only" />
        </div>
      </>
    );
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`Fichier trop lourd (${(f.size / 1024 / 1024).toFixed(1)} MB). Limite : ${MAX_MB} MB.`);
      return;
    }
    setFile(f);
    setResult(null);
  }

  async function transcribe() {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('language', lang);
      const res = await fetch('/api/subtitles/transcribe', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Transcription impossible');
        return;
      }
      setResult({ text: data.text, srt: data.srt });
    } catch {
      toast.error('Erreur reseau — reessaie.');
    } finally {
      setLoading(false);
    }
  }

  function downloadSrt() {
    if (!result?.srt) return;
    const blob = new Blob([result.srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name?.replace(/\.[^.]+$/, '') ?? 'sous-titres'}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyText() {
    if (!result?.text) return;
    navigator.clipboard.writeText(result.text)
      .then(() => { setCopiedText(true); toast.success('Texte copie !'); setTimeout(() => setCopiedText(false), 1500); })
      .catch(() => toast.error('Copie impossible'));
  }

  return (
    <>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Captions className="h-6 w-6 text-primary" /> Transcription & sous-titres
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Uploade ta video ou audio — obtiens le texte complet + un fichier .SRT pret a l'emploi.
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block">Fichier video ou audio</Label>
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-8 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium">Clique ou depose ton fichier</p>
                    <p className="text-xs text-muted-foreground">MP4, MOV, MP3, M4A — max {MAX_MB} MB</p>
                  </div>
                )}
              </div>
              <input ref={inputRef} type="file" accept={ACCEPT} onChange={onFileChange} className="hidden" />
            </div>

            <div>
              <Label className="mb-2 block">Langue</Label>
              <div className="flex gap-4">
                {LANGUAGES.map((l) => (
                  <label key={l.value} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" name="lang" value={l.value} checked={lang === l.value} onChange={() => setLang(l.value)} className="accent-primary" />
                    {l.label}
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={transcribe} disabled={loading || !file} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Transcrire
            </Button>
          </div>
        </Card>

        {result && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={copyText}>
                {copiedText ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                Copier le texte
              </Button>
              <Button size="sm" variant="outline" onClick={downloadSrt}>
                <Download className="h-3.5 w-3.5" /> Telecharger .SRT
              </Button>
              <Button size="sm" variant="gradient" asChild>
                <a href={`/dashboard?prefill=${encodeURIComponent(result.text.slice(0, 300))}`}>
                  <Sparkles className="h-3.5 w-3.5" /> Generer un post depuis ce texte
                </a>
              </Button>
            </div>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Transcription</p>
              <p className="text-sm leading-relaxed whitespace-pre-line">{result.text}</p>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
