'use client';

import { Camera, Briefcase, LayoutGrid } from 'lucide-react';
import { AnimatedTabs } from '@/components/ui/motion-primitives';
import PostCard from './PostCard';
import type { PostRow } from '@/lib/db/posts';

// Posts avec séparation Instagram / LinkedIn — tabs animés à indicateur glissant.
export default function PostsBoard({ posts }: { posts: PostRow[] }) {
  const ig = posts.filter((p) => p.network === 'instagram');
  const li = posts.filter((p) => p.network === 'linkedin');

  return (
    <AnimatedTabs
      className="mt-6"
      tabs={[
        {
          value: 'all',
          label: (
            <>
              <LayoutGrid className="h-3.5 w-3.5" /> Tout · {posts.length}
            </>
          ),
          content: <Grid posts={posts} />,
        },
        {
          value: 'instagram',
          label: (
            <>
              <Camera className="h-3.5 w-3.5" /> Instagram · {ig.length}
            </>
          ),
          content: <Grid posts={ig} />,
        },
        {
          value: 'linkedin',
          label: (
            <>
              <Briefcase className="h-3.5 w-3.5" /> LinkedIn · {li.length}
            </>
          ),
          content: <Grid posts={li} />,
        },
      ]}
    />
  );
}

function Grid({ posts }: { posts: PostRow[] }) {
  if (posts.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Rien dans cette catégorie.</p>;
  }
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}
