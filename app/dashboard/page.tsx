import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { listPosts, getPostStats, hasGeneratedThisMonth, getVariantesCount, getLatestGenerationMode, type PostStatus } from '@/lib/db/posts';
import { canExportPost, getPlanLimits } from '@/lib/plans';
import { getConnectionsByTenant, getPublicationsBatch } from '@/lib/db/social-connections';
import { getSmartSuggestions, getGenerationStreak } from '@/lib/db/suggestions';
import { getOnboardingProgress, getProfileCompletion } from '@/lib/db/onboarding';
import { getLatestAnalysis } from '@/lib/db/analyses';
import AnalyzeCard from './AnalyzeCard';
import { currentMonth } from '@/lib/utils';
import { XCircle, CalendarDays, ChevronDown } from 'lucide-react';
import VerifyEmailBanner from './VerifyEmailBanner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
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
  const [stats, posts, alreadyGenerated, progress, suggestions, completion, streak, variantesUsed] = await Promise.all([
    getPostStats(tenantId, month),
    listPosts(tenantId, { status }),
    hasGeneratedThisMonth(tenantId, month),
    getOnboardingProgress(tenantId),
    getSmartSuggestions(tenantId),
    getProfileCompletion(tenantId),
    getGenerationStreak(tenantId),
    getVariantesCount(tenantId, month),
  ]);

  const plan = session.user.plan ?? 'starter';
  const planLimits = getPlanLimits(plan);

  // Social publish : données uniquement pour les plans qui y ont accès.
  const socialPublishEnabled = planLimits.socialPublishEnabled;
  const [rawConnections, postPublications] = socialPublishEnabled && posts.length > 0
    ? await Promise.all([
        getConnectionsByTenant(tenantId),
        getPublicationsBatch(tenantId, posts.map((p) => p.id)),
      ])
    : [[], []];
  const socialConnections = rawConnections.map((c) => ({
    id: c.id,
    platform: c.platform as string,
    accountName: c.accountName,
    accountAvatar: c.accountAvatar,
  }));

  const gating = {
    canExport: canExportPost(plan),
    variantesUsed,
    variantesMax: planLimits.variantesMax,
    watermark: planLimits.watermark,
    socialPublishEnabled,
    socialConnections,
    postPublications,
  };

  // Dégradation silencieuse : posts en mode mock alors qu'une IA est configurée.
  const apiConfigured = !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_TUNNEL_URL);
  const fallbackMock = apiConfigured && alreadyGenerated ? (await getLatestGenerationMode(tenantId, month)) === 'mock' : false;

  const firstName = (me?.fullName ?? session.user.name ?? '').split(' ')[0] || 'coach';
  const emailVerified = !!session.user.emailVerifiedAt;

  // Carte « Analyse de profil » (score Instagram le plus récent + nudge si > 30 j).
  const latestIg = await getLatestAnalysis(tenantId, 'instagram');
  const analyzeCard = latestIg
    ? { score: latestIg.scoreGlobal ?? 0, staleDays: Math.floor((Date.now() - new Date(latestIg.createdAt).getTime()) / 86400000) } // eslint-disable-line react-hooks/purity -- server component, not a hook
    : null;

  // Bandeau « nouveau mois » : a déjà généré au moins une fois, mais pas ce mois-ci.
  const showNewMonth = !alreadyGenerated && progress.generation;
  const monthName = new Date().toLocaleDateString('fr-FR', { month: 'long' });
  const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  // Bloc « améliore ton profil » (stepper setup + complétion) — repliable.
  const showImprove = !progress.complete || completion.score < 100;

  return (
    <DashboardShell active="/dashboard">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Salut {firstName}.</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan <span className="font-semibold capitalize text-foreground">{session.user.plan}</span> · {month} · prêt à publier ?
          </p>
          {streak.streak >= 1 && streak.current && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning">
              {streak.streak >= 2 ? `🔥 ${streak.streak} mois d’affilée` : '✦ 1er mois — garde le rythme !'}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2" data-generate>
          <CaptionPackButton />
          <GenerateButton alreadyGenerated={alreadyGenerated} />
        </div>
      </div>

      {!emailVerified && <VerifyEmailBanner />}

      <AnalyzeCard instagram={analyzeCard ? { score: analyzeCard.score, date: latestIg!.createdAt } : null} staleDays={analyzeCard?.staleDays ?? null} />


      {fallbackMock && (
        <Alert variant="warning" className="mt-6">
          <XCircle />
          <AlertDescription>
            Ces posts ont été générés en mode simplifié (l&apos;IA était momentanément indisponible). La qualité sera meilleure à la prochaine génération mensuelle.
          </AlertDescription>
        </Alert>
      )}

      {/* Bandeau « nouveau mois » — action principale du mois, en haut */}
      {showNewMonth && (
        <Card className="mt-6 flex flex-wrap items-center gap-4 border-primary/30 bg-primary/5 p-5">
          <CalendarDays className="h-6 w-6 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="font-semibold">{monthLabel} est là — génère tes 12 posts du mois</p>
            <p className="text-sm text-muted-foreground">Ton profil a peut-être évolué ? <Link href="/dashboard/profile" className="text-primary hover:underline">Mets-le à jour</Link> avant de générer.</p>
          </div>
          <GenerateButton alreadyGenerated={false} />
        </Card>
      )}

      {/* Posts — remontés : le coach voit son contenu immédiatement */}
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
        {posts.length === 0 ? <EmptyPosts alreadyGenerated={alreadyGenerated} /> : <PostsBoard posts={posts} gating={gating} />}
      </SectionBoundary>

      {/* Améliore ton profil — setup + complétion, repliable (sous les posts) */}
      {showImprove && (
        <details className="mt-8 rounded-xl border border-border bg-card p-1">
          <summary className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm font-semibold">
            <span>Améliore ton profil {completion.score < 100 && <span className="text-primary">· {completion.score}%</span>}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </summary>
          <div className="space-y-4 p-3">
            <OnboardingStepper progress={progress} />
            {completion.score < 100 && <ProfileCompletion data={completion} />}
          </div>
        </details>
      )}

      <SectionBoundary label="Suggestions">
        <SmartSuggestions data={suggestions} />
      </SectionBoundary>

      <div className="mt-6">
        <SectionBoundary label="Statistiques">
          <StatCards stats={{ total: stats.total, approved: stats.approved, draft: stats.draft, rejected: stats.rejected }} />
        </SectionBoundary>
      </div>
    </DashboardShell>
  );
}
