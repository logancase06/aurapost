// Skeleton calqué sur la vraie PostCard (badge réseau, thème, ~3 lignes, actions)
// pour préparer visuellement le coach pendant la génération. Partagé wizard + dashboard.
export function PostCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-2.5 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-4 space-y-2">
        <div className="h-2.5 w-full animate-pulse rounded bg-muted" />
        <div className="h-2.5 w-full animate-pulse rounded bg-muted" />
        <div className="h-2.5 w-4/5 animate-pulse rounded bg-muted" />
      </div>
      <div className="my-4 h-px w-full bg-border" />
      <div className="flex gap-2">
        <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
        <div className="ml-auto h-8 w-16 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}

/** Grille de N skeletons. */
export function PostCardSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}
