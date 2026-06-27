'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Check, X, RefreshCw, Copy, Camera, Briefcase, Loader2, Maximize2, ImageIcon, Lock, Share2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BorderBeam } from '@/components/ui/border-beam';
import { approvePostAction, rejectPostAction, requestVariantAction } from './post-actions';
import ApprovePostDialog from './ApprovePostDialog';
import PublishButton, { PlatformStatusBadge } from '@/components/social/PublishButton';
import { WATERMARK_TEXT } from '@/lib/plans';
import type { PostRow } from '@/lib/db/posts';
import type { SerializedConnection, PublicationSummary } from '@/lib/db/social-connections';

const STATUS: Record<string, { label: string; variant: 'warning' | 'success' | 'destructive' | 'secondary' }> = {
  draft: { label: 'Brouillon', variant: 'warning' },
  approved: { label: 'Approuvé', variant: 'success' },
  rejected: { label: 'Rejeté', variant: 'destructive' },
  pending_approval: { label: 'En validation', variant: 'secondary' },
};

export default function PostCard({
  post,
  canExport = true,
  variantesUsed = 0,
  variantesMax = Infinity,
  watermark = false,
  socialPublishEnabled = false,
  socialConnections = [],
  publications = [],
}: {
  post: PostRow;
  canExport?: boolean;
  variantesUsed?: number;
  variantesMax?: number;
  watermark?: boolean;
  socialPublishEnabled?: boolean;
  socialConnections?: SerializedConnection[];
  publications?: PublicationSummary[];
}) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const status = STATUS[post.status];
  const variantesLeft = variantesMax === Infinity || variantesUsed < variantesMax;

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const res = await action();
      if (res.ok) toast.success(success);
      else toast.error(res.error || 'Action impossible');
    });
  }

  // Approbation 1-clic + nudge « et maintenant ? » avec action copier inline.
  function approveQuick() {
    startTransition(async () => {
      const res = await approvePostAction(post.id);
      if (!res.ok) {
        toast.error(res.error || 'Action impossible');
        return;
      }
      toast(
        (t) => (
          <span className="flex items-center gap-2">
            Post approuvé ✓
            <button
              onClick={() => {
                void copy();
                toast.dismiss(t.id);
              }}
              className="font-semibold text-primary underline underline-offset-2"
            >
              Copier la légende →
            </button>
          </span>
        ),
        { icon: '✅', duration: 6000 }
      );
    });
  }

  async function copy() {
    const base = `${post.content}\n\n${post.hashtags.map((h) => `#${h}`).join(' ')}`.trim();
    const text = watermark ? `${base}\n\n${WATERMARK_TEXT}` : base;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Post copié !');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copie impossible');
    }
  }

  const Icon = post.network === 'linkedin' ? Briefcase : Camera;

  return (
    <Card className="hover-lift relative flex flex-col overflow-hidden p-5">
      {post.status === 'draft' && <BorderBeam duration={7} />}
      <div className="mb-3 flex items-center justify-between">
        <Badge variant={post.network === 'linkedin' ? 'secondary' : 'default'}>
          <Icon className="h-3 w-3" /> {post.network}
        </Badge>
        <div className="flex items-center gap-2">
          <Badge variant={status.variant}>
            {status.label}
            {post.variantOfId && ' · variante'}
          </Badge>
          <Link
            href={`/dashboard/posts/${post.id}`}
            className="text-muted-foreground transition-colors hover:text-primary"
            aria-label="Voir le détail du post"
            title="Détail, variantes, programmation"
          >
            <Maximize2 className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {post.title && <h3 className="font-bold">{post.title}</h3>}
      {post.theme && <p className="mt-0.5 text-xs font-medium text-primary/80">Thème : {post.theme}</p>}

      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{post.content}</p>

      {post.hashtags.length > 0 && <p className="mt-3 text-sm text-primary">{post.hashtags.map((h) => `#${h}`).join(' ')}</p>}
      {post.callToAction && <p className="mt-2 text-sm font-medium text-foreground/80">👉 {post.callToAction}</p>}

      <Separator className="my-4" />

      {post.status === 'pending_approval' && (
        <p className="mb-3 rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
          ⏳ En attente de validation par votre organisation.
        </p>
      )}

      {/* Cibles tactiles ≥44px sur mobile (h-11), compactes sur desktop (sm:h-8). */}
      <div className="flex flex-wrap items-center gap-2">
        {post.status === 'draft' && (
          <>
            {/* Approbation rapide en 1 clic */}
            <Button size="sm" onClick={approveQuick} disabled={pending} className="h-11 bg-success text-white hover:bg-success/90 sm:h-8">
              <Check className="h-3.5 w-3.5" /> Approuver
            </Button>
            {/* Option : approuver avec photo (réservé aux plans payants — export) */}
            {canExport ? (
              <Button size="sm" variant="outline" onClick={() => setApproveOpen(true)} disabled={pending} title="Approuver en ajoutant une photo" className="h-11 sm:h-8">
                <ImageIcon className="h-3.5 w-3.5" /> + photo
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline" title="L'export photo est inclus dans le plan Contenu" className="h-11 sm:h-8 opacity-70">
                <Link href="/dashboard/billing"><Lock className="h-3.5 w-3.5" /> + photo</Link>
              </Button>
            )}
          </>
        )}
        {post.status !== 'rejected' && post.status !== 'pending_approval' && (
          <Button size="sm" variant="secondary" onClick={() => run(() => rejectPostAction(post.id), 'Post rejeté')} disabled={pending} className="h-11 sm:h-8">
            <X className="h-3.5 w-3.5" /> Rejeter
          </Button>
        )}
        {post.status !== 'pending_approval' && (
          <Button size="sm" variant="outline" onClick={() => run(() => requestVariantAction(post.id), 'Variante générée ✦')} disabled={pending || !variantesLeft} title={variantesLeft ? 'Générer une variante' : 'Limite de variantes atteinte ce mois'} className="h-11 sm:h-8">
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Variante
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={copy} className="ml-auto h-11 sm:h-8">
          <Copy className="h-3.5 w-3.5" /> {copied ? 'Copié' : 'Copier'}
        </Button>

        {/* Z-5.1 — Bouton "Publier" : visible si plan OK + post approuvé. */}
        {socialPublishEnabled && post.status === 'approved' && (
          socialConnections.length > 0 ? (
            <PublishButton postId={post.id} connections={socialConnections} publications={publications} />
          ) : (
            <Button asChild size="sm" variant="outline" className="h-11 sm:h-8" title="Connecte un réseau pour publier directement">
              <Link href="/dashboard/social">
                <Share2 className="h-3.5 w-3.5" /> Connecter un réseau
              </Link>
            </Button>
          )
        )}
      </div>

      {/* Z-5.4 — Badges de statut de publication par plateforme. */}
      {publications.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {publications.map((pub) => (
            <PlatformStatusBadge key={`${pub.connectionId}-${pub.status}`} pub={pub} />
          ))}
        </div>
      )}

      {approveOpen && <ApprovePostDialog post={post} open onOpenChange={setApproveOpen} />}
    </Card>
  );
}
