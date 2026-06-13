import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { listPosts, listGeneratedMonths, type PostRow } from '@/lib/db/posts';
import { currentMonth } from '@/lib/utils';
import { Download, Printer, Camera, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import DashboardShell from '../DashboardShell';

export const metadata = { title: 'Historique' };

type SearchParams = Promise<{ month?: string }>;

export default async function HistoryPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;

  const months = await listGeneratedMonths(tenantId);
  const sp = await searchParams;
  const month = sp.month && months.includes(sp.month) ? sp.month : (months[0] ?? currentMonth());

  const posts = await listPosts(tenantId, { month });
  const originals = posts.filter((p) => !p.variantOfId);
  const variantsByParent = new Map<string, PostRow[]>();
  for (const p of posts) {
    if (p.variantOfId) {
      const arr = variantsByParent.get(p.variantOfId) ?? [];
      arr.push(p);
      variantsByParent.set(p.variantOfId, arr);
    }
  }

  return (
    <DashboardShell active="/dashboard/history">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Historique</h1>
          <p className="mt-1 text-sm text-muted-foreground">Vos posts générés, mois par mois, avec leurs variantes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/api/export/csv?month=${month}`}>
              <Download className="h-4 w-4" /> Export CSV
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/history/print?month=${month}`} target="_blank">
              <Printer className="h-4 w-4" /> PDF
            </Link>
          </Button>
        </div>
      </div>

      {months.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {months.map((m) => (
            <Link
              key={m}
              href={`/dashboard/history?month=${m}`}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200',
                m === month ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              {m}
            </Link>
          ))}
        </div>
      )}

      {originals.length === 0 ? (
        <Card className="mt-8 border-dashed p-12 text-center">
          <p className="text-lg font-semibold">Aucun post pour ce mois</p>
        </Card>
      ) : (
        <div className="mt-8 space-y-6">
          {originals.map((post) => {
            const variants = variantsByParent.get(post.id) ?? [];
            return (
              <Card key={post.id} className="p-5">
                <div className={cn('grid gap-5', variants.length > 0 && 'lg:grid-cols-2')}>
                  <PostBlock post={post} label="Original" />
                  {variants.length > 0 && (
                    <div className="space-y-4 lg:border-l lg:border-border lg:pl-5">
                      {variants.map((v) => (
                        <PostBlock key={v.id} post={v} label="Variante" />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}

function PostBlock({ post, label }: { post: PostRow; label: string }) {
  const Icon = post.network === 'linkedin' ? Briefcase : Camera;
  const variant = post.status === 'approved' ? 'success' : post.status === 'rejected' ? 'destructive' : 'warning';
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge variant={post.network === 'linkedin' ? 'secondary' : 'default'}>
          <Icon className="h-3 w-3" /> {post.network}
        </Badge>
        <Badge variant="outline">{label}</Badge>
        <Badge variant={variant}>{post.status}</Badge>
      </div>
      {post.title && <h3 className="font-bold">{post.title}</h3>}
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{post.content}</p>
      {post.hashtags.length > 0 && <p className="mt-2 text-sm text-primary">{post.hashtags.map((h) => `#${h}`).join(' ')}</p>}
      <Separator className="mt-4 lg:hidden" />
    </div>
  );
}
