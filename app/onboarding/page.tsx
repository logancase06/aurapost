import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Sparkles, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import OnboardingForm from './OnboardingForm';

export const metadata = { title: 'Configurer mon profil' };

const STEPS = ['Profil', 'Génération', 'Site', 'Abonnement'];

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [me] = await db
    .select({ onboardingCompleted: users.onboardingCompleted })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (me?.onboardingCompleted) redirect('/dashboard');

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

        {/* Stepper horizontal */}
        <div className="mb-2 flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  i === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}
              >
                {i === 0 ? '1' : <Check className="h-3 w-3 opacity-40" />}
              </span>
              <span className={`text-xs font-medium ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            </div>
          ))}
        </div>
        <Progress value={25} />

        <Card className="mt-6 animate-fade-up border-border/80 bg-card/80 p-8 backdrop-blur-xl">
          <h1 className="text-xl font-bold">Configurons votre profil de coach</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ces informations alimentent la génération de votre contenu Instagram &amp; LinkedIn. Vous pourrez les modifier plus tard.
          </p>
          <div className="mt-6">
            <OnboardingForm />
          </div>
        </Card>
      </div>
    </main>
  );
}
