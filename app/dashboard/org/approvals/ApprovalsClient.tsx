'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Check, X, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { approvePostAction, rejectPostAction } from './actions';
import { findForbidden, DEFAULT_MLM_FORBIDDEN } from '@/lib/compliance';

interface Pending {
  id: string;
  distributor: string;
  network: string;
  title: string | null;
  content: string;
  createdAt: string;
}

export default function ApprovalsClient({ posts, forbidden }: { posts: Pending[]; forbidden: string[] }) {
  const words = forbidden.length ? forbidden : DEFAULT_MLM_FORBIDDEN;
  const [list, setList] = useState(posts);
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  function approve(id: string) {
    start(async () => {
      const res = await approvePostAction(id, comment || undefined);
      if (res.ok) { toast.success('Post approuvé ✓'); setList((l) => l.filter((p) => p.id !== id)); setComment(''); }
      else toast.error(res.error || 'Action impossible');
    });
  }
  function reject(id: string) {
    if (!comment.trim()) { toast.error('Ajoute un commentaire pour rejeter.'); return; }
    start(async () => {
      const res = await rejectPostAction(id, comment);
      if (res.ok) { toast.success('Post rejeté'); setList((l) => l.filter((p) => p.id !== id)); setComment(''); setRejecting(null); }
      else toast.error(res.error || 'Action impossible');
    });
  }

  if (list.length === 0) {
    return <Card className="mt-8 border-dashed p-12 text-center text-muted-foreground">Aucun post en attente de validation. 🎉</Card>;
  }

  return (
    <div className="mt-6 space-y-4">
      {list.map((p) => {
        const breaches = findForbidden(p.content, words);
        return (
          <Card key={p.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{p.distributor}</span>
                <Badge variant="secondary">{p.network}</Badge>
                {breaches.length > 0 && <Badge variant="destructive"><AlertTriangle className="h-3 w-3" /> Contenu à vérifier</Badge>}
              </div>
              <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
            {p.title && <p className="mt-2 font-bold">{p.title}</p>}
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{p.content}</p>
            {breaches.length > 0 && (
              <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                Termes sensibles détectés : {breaches.join(', ')} — à faire reformuler.
              </p>
            )}

            {rejecting === p.id && (
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Commentaire pour le distributeur (obligatoire)…"
                className="mt-3 flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
              />
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" className="bg-success text-white hover:bg-success/90" disabled={pending} onClick={() => approve(p.id)}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approuver
              </Button>
              {rejecting === p.id ? (
                <Button size="sm" variant="destructive" disabled={pending} onClick={() => reject(p.id)}>
                  <X className="h-4 w-4" /> Confirmer le rejet
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => { setRejecting(p.id); setComment(''); }}>
                  <X className="h-4 w-4" /> Rejeter avec commentaire
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
