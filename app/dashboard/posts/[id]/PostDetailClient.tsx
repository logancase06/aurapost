'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Copy, Check, CalendarClock, ExternalLink, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { schedulePostAction, trackCopyAction } from '../../post-actions';

interface PostLite {
  id: string;
  content: string;
  hashtags: string[];
  callToAction: string | null;
  network: string;
  scheduledFor: string | null;
  copyCount: number;
}

/** Bloc d'actions du détail post : copier (+stat), planifier, exporter Buffer/Later. */
export default function PostDetailClient({ post }: { post: PostLite }) {
  const [copied, setCopied] = useState(false);
  const [copyCount, setCopyCount] = useState(post.copyCount);
  const [date, setDate] = useState(post.scheduledFor ? post.scheduledFor.slice(0, 10) : '');
  const [pending, startTransition] = useTransition();

  const fullText = [post.content, '', post.hashtags.map((h) => `#${h}`).join(' '), post.callToAction ?? '']
    .filter(Boolean)
    .join('\n');

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Post copié ✦');
      const res = await trackCopyAction(post.id);
      if (res.ok && typeof res.count === 'number') setCopyCount(res.count);
    } catch {
      toast.error('Copie impossible.');
    }
  }

  function schedule(next: string | null) {
    startTransition(async () => {
      const res = await schedulePostAction(post.id, next);
      if (res.ok) {
        toast.success(next ? 'Post programmé ✦' : 'Planification retirée');
      } else {
        toast.error(res.error || 'Action impossible');
      }
    });
  }

  const bufferUrl = `https://buffer.com/add?text=${encodeURIComponent(fullText)}`;
  const laterNote = () => {
    void navigator.clipboard.writeText(fullText);
    toast('Copié — collez-le dans Later ✦', { icon: '📋' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={copy} variant="gradient" className="min-h-[44px]">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copié' : 'Copier le post'}
        </Button>
        <span className="text-sm text-muted-foreground">
          Copié <strong className="text-foreground">{copyCount}</strong> fois
        </span>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          <CalendarClock className="h-4 w-4 text-primary" /> Programmer
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="sched" className="mb-1 block text-xs text-muted-foreground">
              Date de publication
            </label>
            <Input
              id="sched"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-44"
            />
          </div>
          <Button onClick={() => schedule(date || null)} disabled={pending || !date} className="min-h-[44px]">
            {post.scheduledFor ? 'Mettre à jour' : 'Planifier'}
          </Button>
          {post.scheduledFor && (
            <Button variant="ghost" onClick={() => schedule(null)} disabled={pending} className="min-h-[44px]">
              Retirer
            </Button>
          )}
        </div>

        <p className="mt-5 text-xs text-muted-foreground">Exporter vers un outil de programmation :</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={bufferUrl} target="_blank" rel="noopener noreferrer">
              <Send className="h-4 w-4" /> Buffer <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={laterNote}>
            <Send className="h-4 w-4" /> Later (copier)
          </Button>
        </div>
      </div>
    </div>
  );
}
