import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, coachProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { listPhotos } from '@/lib/db/photos';
import OnboardingWizard, { type InitialDraft } from './OnboardingWizard';

export const metadata = { title: 'Configurer mon profil' };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [me] = await db
    .select({ onboardingCompleted: users.onboardingCompleted })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (me?.onboardingCompleted) redirect('/dashboard');

  const tenantId = session.user.tenantId!;

  // Reprise : on recharge le brouillon déjà saisi (le coach peut revenir plus tard).
  const [prof] = await db
    .select({
      displayName: coachProfiles.displayName,
      speciality: coachProfiles.speciality,
      city: coachProfiles.city,
      contentStyle: coachProfiles.contentStyle,
      tone: coachProfiles.tone,
      bio: coachProfiles.bio,
      targetAudience: coachProfiles.targetAudience,
      results: coachProfiles.results,
      linkedinHeadline: coachProfiles.linkedinHeadline,
      linkedinSummary: coachProfiles.linkedinSummary,
      language: coachProfiles.language,
      instagramUrl: coachProfiles.instagramUrl,
      instagramAnalysis: coachProfiles.instagramAnalysis,
      reviewsText: coachProfiles.reviewsText,
      reviewsAnalysis: coachProfiles.reviewsAnalysis,
    })
    .from(coachProfiles)
    .where(eq(coachProfiles.tenantId, tenantId))
    .limit(1);

  const photos = await listPhotos(tenantId, 10);

  const igAnalysis = safeParse<{ ton_dominant?: string }>(prof?.instagramAnalysis);
  const rvAnalysis = safeParse<{ strengths?: string[] }>(prof?.reviewsAnalysis);

  const initial: InitialDraft = {
    displayName: prof?.displayName ?? '',
    speciality: prof?.speciality ?? '',
    city: prof?.city ?? '',
    contentStyle: prof?.contentStyle ?? '',
    tone: prof?.tone ?? 'motivant',
    bio: prof?.bio ?? '',
    targetAudience: prof?.targetAudience ?? '',
    results: prof?.results ?? '',
    linkedinHeadline: prof?.linkedinHeadline ?? '',
    linkedinSummary: prof?.linkedinSummary ?? '',
    language: prof?.language ?? 'fr',
    hasInstagram: !!prof?.instagramUrl,
    igTone: igAnalysis?.ton_dominant ?? null,
    hasReviews: !!prof?.reviewsText,
    reviewStrengths: rvAnalysis?.strengths ?? [],
    photos,
  };

  return (
    <main id="main-content" className="relative flex min-h-screen flex-col items-center px-4 py-12">
      <div className="aura-glow absolute inset-0" aria-hidden />
      <div className="relative z-10 w-full max-w-xl">
        <div className="mb-6 flex items-center justify-center gap-2 text-xl font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          AuraPost
        </div>

        <Card className="animate-fade-up border-border/80 bg-card/80 p-6 backdrop-blur-xl sm:p-8">
          <OnboardingWizard initial={initial} />
        </Card>
      </div>
    </main>
  );
}

function safeParse<T>(json: string | null | undefined): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
