'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import DashboardShell from '@/app/dashboard/DashboardShell';
import { generateNewsletterAction, type NewsletterResult } from './actions';

export default function NewsletterClient() {
  const [theme, setTheme] = useState('');
  const [result, setResult] = useState<NewsletterResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function generate() {
    if (!theme.trim()) return;
    startTransition(async () => {
      const res = await generateNewsletterAction(theme.trim());
      if (res.ok && res.data) setResult(res.data);
      else toast.error(res.error || 'Génération impossible');
    });
  }

  function copyAll() {
    if (!result) return;
    const text = [
      `Objet : ${result.subject}`,
      '',
      result.intro,
      '',
      ...result.sections.flatMap((s) => [`## ${s.title}`, '', s.body, '']),
      result.cta,
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Newsletter copiée !');
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => toast.error('Copie impossible'));
  }

  return (
    <DashboardShell active="/dashboard/newsletter">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Générateur de newsletter</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Génère une newsletter mensuelle complète (intro, 3 sections, CTA) prête à copier dans Mailchimp, Brevo, etc.
          </p>
        </div>

        <Card className="p-5">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Thème du mois</Label>
              <Input
                placeholder="ex: préparation mentale pour la reprise, nutrition en hiver..."
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generate()}
              />
            </div>
            <Button onClick={generate} disabled={pending || !theme.trim()} variant="gradient">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Générer la newsletter
            </Button>
          </div>
        </Card>

        {result && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Résultat</h2>
              <Button size="sm" variant="outline" onClick={copyAll}>
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                Tout copier
              </Button>
            </div>

            <Card className="p-5 space-y-4">
              <Section label="Objet de l'email" content={result.subject} />
              <Section label="Introduction" content={result.intro} />
              {result.sections.map((s, i) => (
                <div key={i} className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm">Section {i + 1} : {s.title}</p>
                    <CopyBtn text={`## ${s.title}\n\n${s.body}`} />
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{s.body}</p>
                </div>
              ))}
              <Section label="Call to action final" content={result.cta} />
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function Section({ label, content }: { label: string; content: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
        <CopyBtn text={content} />
      </div>
      <p className="text-sm whitespace-pre-line">{content}</p>
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1200); }).catch(() => {})}
      className="shrink-0 text-muted-foreground hover:text-primary"
    >
      {done ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}
