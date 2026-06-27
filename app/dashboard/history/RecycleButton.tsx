'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, Loader2 } from 'lucide-react';
import { recyclePostAction } from '@/app/dashboard/post-actions';

export default function RecycleButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();

  function recycle() {
    startTransition(async () => {
      const res = await recyclePostAction(postId);
      if (res.ok) toast.success('Post recyclé — disponible dans vos brouillons ✦');
      else toast.error(res.error || 'Recyclage impossible');
    });
  }

  return (
    <button
      onClick={recycle}
      disabled={pending}
      title="Réécrire avec un angle différent"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
      Recycler
    </button>
  );
}
