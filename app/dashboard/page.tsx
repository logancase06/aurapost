import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { listPosts, getPostStats, hasGeneratedThisMonth, type PostStatus } from '@/lib/db/posts';
import { getSmartSuggestions } from '@/lib/db/suggestions';
import { getOnboardingProgress, getProfileCompletion } from '@/lib/db/onboarding';
import { currentMonth } from '@/lib/utils';
import { XCircle, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import DashboardShell from './DashboardShell';
import GenerateButton from './GenerateButton';
import CaptionPackButton from './CaptionPackButton';
import OnboardingStepper from './OnboardingStepper';
import ProfileCompletion from './ProfileCompletion';
import PostsBoard from './PostsBoard';
import StatCards from './StatCards';
import SmartSuggestions from './SmartSuggestions';
import { SectionBoundary } from '@/components/SectionBoundary';
import { EmptyPosts } from './EmptyState';

export const metadata = { title: 'Tableau de bord' };
// Server Actions longues hébergées par cette route (variante, pack de légendes) →
// appels Claude possibles, on relève le timeout de la fonction.
export const maxDuration = 60;

type SearchParams = Promise<{ status?: string }>;

const STATUS_FILTERS = [
  { key: '', label: 'Tous' },
  { key: 'draft', label: 'En attente' },
  { key: 'approved', label: 'Approuvés' },
  { key: 'rejected', label: 'Rejetés' },
];

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [me] = await db
    .select({ onboardingCompleted: users.onboardingCompleted, fullName: users.fullName })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (me && !me.onboardingCompleted) redirect('/onboarding');

  const tenantId = session.user.tenantId!;
  const [tenant] = await db.select({ status: tenants.status }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (tenant?.status === 'disabled') {
    return (
      <DashboardShell active="/dashboard">
        <Alert variant="destructive" className="mx-auto max-w-md">
          <XCircle />
          <AlertDescription>Ton compte a été suspendu. Contacte le support à contact@aurapost.fr.</AlertDescription>
        </Alert>
      </DashboardShell>
    );
  }

  const sp = await searchParams;
  const status = (['draft', 'approved', 'rejected'].includes(sp.status ?? '') ? sp.status : undefined) as
    | PostStatus
    | undefined;

  const month = currentMonth();
  const [stats, posts, alreadyGenerated, progress, suggestions, completion] = await Promise.all([
    getPostStats(tenantId, month),
    listPosts(tenantId, { status }),
    hasGeneratedThisMonth(tenantId, month),
    getOnboardingProgress(tenantId),
    getSmartSuggestions(tenantId),
    getProfileCompletion(tenantId),
  ]);

  const firstName = (me?.fullName ?? session.user.name ?? '').split(' ')[0] || 'coach';
  const emailVerified = !!session.user.emailVerifiedAt;

  return (
    <DashboardShell active="/dashboard">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Salut {firstName}.</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan <span className="font-semibold capitalize text-foreground">{session.user.plan}</span> · {month} · prêt à publier ?
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CaptionPackButton />
          <GenerateButton alreadyGenerated={alreadyGenerated} />
        </div>
      </div>

      {!emailVerified && (
        <Alert variant="warning" className="mt-6">
          <Mail />
          <AlertDescription>Vérifie ton adresse email — on t&apos;a envoyé un lien à l&apos;inscription.</AlertDescription>
        </Alert>
      )}

      <OnboardingStepper progress={progress} />

      {completion.score < 100 && (
        <div className="mt-6">
          <ProfileCompletion data={completion} />
        </div>
      )}

      <SectionBoundary label="Suggestions">
        <SmartSuggestions data={suggestions} />
      </SectionBoundary>

      <div className="mt-6">
        <SectionBoundary label="Statistiques">
          <StatCards stats={{ total: stats.total, approved: stats.approved, draft: stats.draft, rejected: stats.rejected }} />
        </SectionBoundary>
      </div>

      <div className="mt-8 inline-flex rounded-lg border border-border bg-card p-1">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/dashboard?status=${f.key}` : '/dashboard'}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-semibold transition-all duration-150',
              (sp.status ?? '') === f.key ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <SectionBoundary label="Posts">
        {posts.length === 0 ? <EmptyPosts alreadyGenerated={alreadyGenerated} /> : <PostsBoard posts={posts} />}
      </SectionBoundary>
    </DashboardShell>
  );
}
