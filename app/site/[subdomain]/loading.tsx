import { Skeleton } from '@/components/ui/skeleton';

// Skeleton pendant la construction/chargement du site public.
export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-primary to-accent px-6 py-24 text-center">
        <Skeleton className="mx-auto h-28 w-28 rounded-full bg-white/30" />
        <Skeleton className="mx-auto mt-6 h-9 w-64 bg-white/30" />
        <Skeleton className="mx-auto mt-3 h-5 w-48 bg-white/20" />
      </div>
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
