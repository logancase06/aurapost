/**
 * scripts/seed.ts — comptes coach de démonstration réalistes (pitch & tests).
 *
 *   npm run seed:demo   (alias : npx tsx scripts/seed.ts)
 *
 * Cible la base configurée (Turso si TURSO_DATABASE_URL, sinon SQLite mémoire/fichier).
 * Idempotent par email. Trois profils volontairement à des stades différents pour
 * illustrer le produit : un compte complet et publié (Vincent), un compte en brouillon
 * (Sophie), un compte en cours d'onboarding (Thomas).
 *
 *   Vincent Ferré — Coach Hyrox, Nice    → 12 posts, site PUBLIÉ, onboarding complet
 *   Sophie Martin — Coach Yoga, Lyon     → 8 posts, site EN BROUILLON (preview)
 *   Thomas Dubois — Coach Running, Paris → 4 posts (brouillons), onboarding INCOMPLET
 */
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, coachProfiles, websites, generatedPosts, coachPhotos } from '@/lib/db/schema';
import { createTenantAndOwner, hashPassword } from '@/lib/db/users-actions';
import { generateMockContent, type CoachProfileInput } from '@/lib/content-generator';
import { currentMonth } from '@/lib/utils';

type Tone = 'motivant' | 'educatif' | 'personnel';
type PostStatus = 'draft' | 'approved' | 'rejected';

interface SeedCoach {
  fullName: string;
  brandName: string;
  email: string;
  displayName: string;
  speciality: string;
  city: string;
  tone: Tone;
  bio: string;
  targetAudience: string;
  results: string;
  subdomain: string;
  themeColor: string;
  /** Nombre de posts à insérer. */
  postCount: number;
  /** Répartition des statuts sur les posts insérés. */
  approved: number;
  rejected: number;
  /** Statut du site : 'active' (publié), 'inactive' (brouillon), ou null (pas de site). */
  siteStatus: 'active' | 'inactive' | null;
  onboardingCompleted: boolean;
  strengths: string[];
  testimonial: string;
}

const COACHES: SeedCoach[] = [
  {
    fullName: 'Vincent Ferré',
    brandName: 'Vincent Ferré Coaching',
    email: 'vincent.demo@aurapost.fr',
    displayName: 'Vincent Ferré',
    speciality: 'Coach Hyrox & préparation physique',
    city: 'Nice',
    tone: 'motivant',
    bio: 'Coach Hyrox certifié, j’accompagne les amateurs à franchir leur première ligne d’arrivée — et les confirmés à viser le podium.',
    targetAudience: 'amateurs 25-45 ans visant leur premier Hyrox',
    results: 'Premier Hyrox terminé en 12 semaines, sans blessure, pour 9 clients sur 10.',
    subdomain: 'vincent-ferre',
    themeColor: '#7C3AED',
    postCount: 12,
    approved: 8,
    rejected: 1,
    siteStatus: 'active',
    onboardingCompleted: true,
    strengths: ['programmes structurés', 'suivi hebdomadaire', 'ambiance motivante'],
    testimonial: 'Grâce à Vincent j’ai bouclé mon premier Hyrox sans me blesser. Méthode au top !',
  },
  {
    fullName: 'Sophie Martin',
    brandName: 'Sophie Yoga',
    email: 'sophie.demo@aurapost.fr',
    displayName: 'Sophie Martin',
    speciality: 'Yoga & mobilité',
    city: 'Lyon',
    tone: 'personnel',
    bio: 'Professeure de yoga, je remets le souffle et la mobilité au cœur du quotidien des actifs débordés.',
    targetAudience: 'actifs 30-50 ans stressés et sédentaires',
    results: 'Moins de douleurs de dos et un vrai retour au calme dès 3 semaines de pratique.',
    subdomain: 'sophie-yoga',
    themeColor: '#A855F7',
    postCount: 8,
    approved: 5,
    rejected: 0,
    siteStatus: 'inactive',
    onboardingCompleted: true,
    strengths: ['cours accessibles', 'bienveillance', 'progrès rapides sur la souplesse'],
    testimonial: 'Les cours de Sophie m’ont réconciliée avec mon corps. Je dors mieux et j’ai moins mal au dos.',
  },
  {
    fullName: 'Thomas Dubois',
    brandName: 'Thomas Run',
    email: 'thomas.demo@aurapost.fr',
    displayName: 'Thomas Dubois',
    speciality: 'Coach running & semi-marathon',
    city: 'Paris',
    tone: 'educatif',
    bio: 'Coach running, je prépare les coureurs du 10 km au semi-marathon avec des plans simples et tenables.',
    targetAudience: 'coureurs débutants visant leur premier 10 km / semi',
    results: '',
    subdomain: 'thomas-run',
    themeColor: '#6D28D9',
    postCount: 4,
    approved: 0,
    rejected: 0,
    siteStatus: null,
    onboardingCompleted: false,
    strengths: [],
    testimonial: '',
  },
];

/** Statut déterministe d'un post selon son index (approuvés d'abord, puis rejetés, puis brouillons). */
function statusFor(index: number, c: SeedCoach): PostStatus {
  if (index < c.approved) return 'approved';
  if (index < c.approved + c.rejected) return 'rejected';
  return 'draft';
}

async function seedCoach(c: SeedCoach): Promise<'created' | 'skipped'> {
  const email = c.email.toLowerCase();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) return 'skipped';

  const now = new Date().toISOString();
  const month = currentMonth();
  const passwordHash = await hashPassword('Demo!Aura2026');
  const photoUrl = `https://picsum.photos/seed/${c.subdomain}/800/1000`;

  const { tenantId, userId } = await createTenantAndOwner({
    email,
    passwordHash,
    fullName: c.fullName,
    brandName: c.brandName,
    consentGivenAt: now,
  });

  await db
    .update(users)
    .set({ onboardingCompleted: c.onboardingCompleted, emailVerifiedAt: now })
    .where(eq(users.id, userId));

  const reviewsAnalysis = c.strengths.length
    ? JSON.stringify({ strengths: c.strengths, testimonial: c.testimonial, tone: c.tone })
    : null;

  await db.insert(coachProfiles).values({
    id: nanoid(),
    tenantId,
    userId,
    displayName: c.displayName,
    speciality: c.speciality,
    city: c.city,
    tone: c.tone,
    bio: c.bio,
    targetAudience: c.targetAudience,
    results: c.results || null,
    reviewsAnalysis,
    photos: JSON.stringify([photoUrl]),
    language: 'fr',
    createdAt: now,
    updatedAt: now,
  });

  // Photo dans la bibliothèque (alimente le hero du site).
  await db.insert(coachPhotos).values({
    id: nanoid(),
    tenantId,
    r2Url: photoUrl,
    width: 800,
    height: 1000,
    createdAt: now,
  });

  // Site vitrine (publié / brouillon / absent selon le profil).
  if (c.siteStatus) {
    await db.insert(websites).values({
      id: nanoid(),
      tenantId,
      subdomain: c.subdomain,
      template: 'impact',
      status: c.siteStatus,
      themeColor: c.themeColor,
      headline: `${c.displayName} — ${c.speciality}`,
      seoDescription: `${c.displayName}, ${c.speciality} à ${c.city}.`,
      publishedAt: c.siteStatus === 'active' ? now : null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Posts déterministes (mock enrichi seedé) avec statuts variés → analytics réalistes.
  const profileInput: CoachProfileInput = {
    displayName: c.displayName,
    speciality: c.speciality,
    city: c.city,
    tone: c.tone,
    bio: c.bio,
    targetAudience: c.targetAudience,
    clientStrengths: c.strengths.length ? c.strengths : null,
    clientResults: c.results || null,
    language: 'fr',
  };
  const drafts = generateMockContent(profileInput, c.subdomain).slice(0, c.postCount);
  let inserted = 0;
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    await db.insert(generatedPosts).values({
      id: nanoid(),
      tenantId,
      network: d.network,
      status: statusFor(i, c),
      title: d.title,
      theme: d.theme,
      content: d.content,
      hashtags: JSON.stringify(d.hashtags),
      callToAction: d.callToAction,
      month,
      variantOfId: null,
      generatedBy: userId,
      generatedMode: 'mock',
      createdAt: now,
      updatedAt: now,
    });
    inserted++;
  }

  const siteLabel = c.siteStatus === 'active' ? `publié /site/${c.subdomain}` : c.siteStatus === 'inactive' ? 'brouillon' : 'aucun site';
  console.log(`✓ ${c.displayName} (${email}) — ${inserted} posts (${c.approved} approuvés), ${siteLabel}`);
  return 'created';
}

async function main() {
  console.log('Seed AuraPost — 3 coachs de démonstration\n');
  let created = 0;
  let skipped = 0;
  for (const c of COACHES) {
    try {
      const res = await seedCoach(c);
      if (res === 'created') created++;
      else {
        skipped++;
        console.log(`· ${c.email} déjà présent — ignoré`);
      }
    } catch (err) {
      console.error(`✗ ${c.email} :`, err);
    }
  }
  console.log(`\nTerminé : ${created} créés, ${skipped} ignorés.`);
  console.log('Mot de passe commun : Demo!Aura2026');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
