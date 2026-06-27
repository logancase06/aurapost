'use client';

import { useState, useTransition } from 'react';
import { Camera, Briefcase, LayoutGrid, Check, X, Loader2 } from 'lucide-react';
import { AnimatedTabs } from '@/components/ui/motion-primitives';
import { Button } from '@/components/ui/button';
import PostCard from './PostCard';
import { batchApproveAction, batchRejectAction } from './post-actions';
import toast from 'react-hot-toast';
import type { PostRow } from '@/lib/db/posts';
import type { SerializedConnection, PublicationSummary } from '@/lib/db/social-connections';

export interface PostsBoardGating {
  canExport?: boolean;
  variantesUsed?: number;
  variantesMax?: number;
  watermark?: boolean;
  socialPublishEnabled?: boolean;
  socialConnections?: SerializedConnection[];
  postPublications?: PublicationSummary[];
}

export default function PostsBoard({ posts, gating }: { posts: PostRow[]; gating?: PostsBoardGating }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const ig = posts.filter((p) => p.network === 'instagram');
  const li = posts.filter((p) => p.network === 'linkedin');

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() { setSelected(new Set()); }

  function runBatch(action: 'approve' | 'reject', ids: string[]) {
    startTransition(async () => {
      const fn = action === 'approve' ? batchApproveAction : batchRejectAction;
      const res = await fn(ids);
      if (res.ok) {
        toast.success(`${res.count} post${(res.count ?? 0) > 1 ? 's' : ''} ${action === 'approve' ? 'approuvés' : 'rejetés'}`);
        clearSelection();
      } else {
        toast.error(res.error || 'Action impossible');
      }
    });
  }

  return (
    <div className="relative">
      <AnimatedTabs
        className="mt-6"
        tabs={[
          {
            value: 'all',
            label: (<><LayoutGrid className="h-3.5 w-3.5" /> Tout · {posts.length}</>),
            content: <Grid posts={posts} gating={gating} selected={selected} onToggle={toggle} />,
          },
          {
            value: 'instagram',
            label: (<><Camera className="h-3.5 w-3.5" /> Instagram · {ig.length}</>),
            content: <Grid posts={ig} gating={gating} selected={selected} onToggle={toggle} />,
          },
          {
            value: 'linkedin',
            label: (<><Briefcase className="h-3.5 w-3.5" /> LinkedIn · {li.length}</>),
            content: <Grid posts={li} gating={gating} selected={selected} onToggle={toggle} />,
          },
        ]}
      />

      {/* Barre d'action flottante — visible dès qu'un post est sélectionné */}
      {selected.size > 0 && (
        <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 shadow-xl ring-1 ring-primary/10 md:bottom-8">
          <span className="text-sm font-semibold text-muted-foreground">
            {selected.size} sélectionné{selected.size > 1 ? 's' : ''}
          </span>
          <div className="h-4 w-px bg-border" />
          <Button
            size="sm"
            className="h-8 bg-success text-white hover:bg-success/90"
            onClick={() => runBatch('approve', [...selected])}
            disabled={pending}
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Approuver
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8"
            onClick={() => runBatch('reject', [...selected])}
            disabled={pending}
          >
            <X className="h-3.5 w-3.5" /> Rejeter
          </Button>
          <button onClick={clearSelection} className="ml-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}

function Grid({
  posts,
  gating,
  selected,
  onToggle,
}: {
  posts: PostRow[];
  gating?: PostsBoardGating;
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (posts.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Rien dans cette catégorie.</p>;
  }
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {posts.map((p) => (
        <div key={p.id} className="relative">
          {/* Checkbox de sélection — coin supérieur gauche */}
          <button
            onClick={() => onToggle(p.id)}
            className={`absolute -left-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
              selected.has(p.id)
                ? 'border-primary bg-primary text-white shadow-md'
                : 'border-border bg-card text-transparent hover:border-primary/60'
            }`}
            aria-label={selected.has(p.id) ? 'Désélectionner' : 'Sélectionner'}
          >
            <Check className="h-3 w-3" />
          </button>
          <PostCard
            post={p}
            canExport={gating?.canExport}
            variantesUsed={gating?.variantesUsed}
            variantesMax={gating?.variantesMax}
            watermark={gating?.watermark}
            socialPublishEnabled={gating?.socialPublishEnabled}
            socialConnections={gating?.socialConnections}
            publications={gating?.postPublications?.filter((pub) => pub.postId === p.id)}
          />
        </div>
      ))}
    </div>
  );
}
