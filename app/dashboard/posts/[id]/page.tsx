import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera, Briefcase, History } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getPostWithVariants } from '@/lib/db/posts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardShell from '../../DashboardShell';
import PostDetailClient from './PostDetailClient';

export const metadata = { title: 'Détail du post' };

const STATUS_LABEL: Record<string, string> = { draft: 'En attente', approved: 'Approuvé', rejected: 'Rejeté' };

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;
  const { id } = await params;

  const data = await getPostWithVariants(tenantId, id);
  if (!data) notFound();
  const { post, original, variants } = data;
  const NetworkIcon = post.network === 'linkedin' ? Briefcase : Camera;

  return (
    <DashboardShell active="/dashboard">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour aux posts
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
          <NetworkIcon className="h-5 w-5 text-white" />
        </span>
        <div className="flex-1">
          <h1 className="text-2xl font-black uppercase tracking-tight">{post.title ?? post.theme ?? 'Post'}</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {post.network} · {post.theme ?? 'général'} · {new Date(post.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <Badge variant={post.status === 'approved' ? 'success' : post.status === 'rejected' ? 'destructive' : 'secondary'}>
          {STATUS_LABEL[post.status] ?? post.status}
        </Badge>
        {post.variantOfId && <Badge variant="secondary">Variante</Badge>}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <p className="whitespace-pre-line text-[15px] leading-relaxed">{post.content}</p>
          {post.hashtags.length > 0 && (
            <p className="mt-4 text-sm text-primary">{post.hashtags.map((h) => `#${h}`).join(' ')}</p>
          )}
          {post.callToAction && <p className="mt-4 text-sm font-semibold">{post.callToAction}</p>}
        </Card>

        <div>
          <PostDetailClient
            post={{
              id: post.id,
              content: post.content,
              hashtags: post.hashtags,
              callToAction: post.callToAction,
              network: post.network,
              scheduledFor: post.scheduledFor,
              copyCount: post.copyCount,
            }}
          />
        </div>
      </div>

      <h2 className="mt-12 flex items-center gap-2 text-lg font-bold">
        <History className="h-5 w-5 text-primary" /> Historique des variantes
      </h2>
      <Card className="mt-4 divide-y divide-border">
        {original && (
          <VariantRow label="Original" content={original.content} href={`/dashboard/posts/${original.id}`} muted />
        )}
        {variants.length === 0 && !original ? (
          <p className="p-6 text-sm text-muted-foreground">Aucune variante générée pour ce post.</p>
        ) : (
          variants.map((v) => (
            <VariantRow key={v.id} label="Variante" content={v.content} href={`/dashboard/posts/${v.id}`} />
          ))
        )}
      </Card>
    </DashboardShell>
  );
}

function VariantRow({ label, content, href, muted }: { label: string; content: string; href: string; muted?: boolean }) {
  return (
    <Link href={href} className="flex items-start gap-3 p-4 transition-colors hover:bg-secondary/50">
      <Badge variant={muted ? 'secondary' : 'outline'} className="mt-0.5 shrink-0">
        {label}
      </Badge>
      <p className="line-clamp-2 text-sm text-muted-foreground">{content}</p>
    </Link>
  );
}
