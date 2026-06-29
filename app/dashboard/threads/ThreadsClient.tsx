'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { MessageSquareText, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import DashboardShell from '@/app/dashboard/DashboardShell';
import { generateThreadAction, type TwitterThread } from './actions';
import { UpgradeBanner } from '@/components/UpgradeGate';

export default function ThreadsClient({ canExport }: { canExport: boolean }) {
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<TwitterThread | null>(null);
  const [pending, startTransition] = useTransition();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function generate() {
    if (!topic.trim()) return;
    startTransition(async () => {
      const res = await generateThreadAction(topic.trim());
      if (res.ok && res.data) setResult(res.data);
      else toast.error(res.error || 'Génération impossible');
    });
  }

  function copyTweet(text: string, idx: number) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      toast.success('Tweet copié !');
      setTimeout(() => setCopiedIdx(null), 1500);
    }).catch(() => toast.error('Copie impossible'));
  }

  function copyAll() {
    if (!result) return;
    const text = result.tweets.map((t) => t.text).join('\n\n');
    navigator.clipboard.writeText(text).then(() => toast.success('Fil copié !')).catch(() => toast.error('Copie impossible'));
  }

  if (!canExport) {
    return (
      <DashboardShell active="/dashboard/threads">
        <div className="mx-auto max-w-2xl">
          <h1 className="flex items-center gap-2 text-2xl font-bold mb-4">
            <MessageSquareText className="h-6 w-6 text-primary" /> Fil Twitter/X
          </h1>
          <UpgradeBanner featureName="Fil Twitter/X" requiredPlan="content_only" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell active="/dashboard/threads">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <MessageSquareText className="h-6 w-6 text-primary" /> Fil Twitter/X
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Génère un fil de 6 tweets engageants sur un sujet lié à ton expertise.
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="thread-topic">Sujet du fil</Label>
              <Input
                id="thread-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="ex : comment perdre du poids durablement sans se priver"
                className="mt-1.5"
                onKeyDown={(e) => { if (e.key === 'Enter') generate(); }}
              />
            </div>
            <Button onClick={generate} disabled={pending || !topic.trim()} className="w-full">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Générer le fil
            </Button>
          </div>
        </Card>

        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Fil · {result.tweets.length} tweets
              </h2>
              <Button size="sm" variant="outline" onClick={copyAll}>
                <Copy className="h-3.5 w-3.5" /> Copier tout
              </Button>
            </div>

            {result.tweets.map((tweet) => (
              <Card
                key={tweet.index}
                className={`p-4 ${tweet.isHook ? 'border-primary/40 bg-primary/5' : tweet.isCta ? 'border-success/40 bg-success/5' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {tweet.index}
                    </span>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{tweet.text}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[10px] tabular-nums ${tweet.text.length > 240 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {tweet.text.length}/280
                    </span>
                    <button
                      onClick={() => copyTweet(tweet.text, tweet.index)}
                      className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10"
                      title="Copier ce tweet"
                    >
                      {copiedIdx === tweet.index ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                {(tweet.isHook || tweet.isCta) && (
                  <span className={`mt-2 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${tweet.isHook ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                    {tweet.isHook ? 'Accroche' : 'CTA'}
                  </span>
                )}
              </Card>
            ))}

            {result.hashtags.length > 0 && (
              <p className="text-sm text-primary pt-1">
                {result.hashtags.map((h) => `#${h}`).join(' ')}
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
