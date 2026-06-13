/**
 * scripts/seed.ts — crée 3 comptes coach fictifs réalistes (démos & tests).
 *
 *   npx tsx scripts/seed.ts
 *
 * Cible la base configurée (Turso si TURSO_DATABASE_URL est défini, sinon SQLite
 * mémoire — dans ce cas les données ne persistent pas au-delà du process).
 * Idempotent par email : un coach déjà présent est ignoré.
 */
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, coachProfiles, websites } from '@/lib/db/schema';
import { createTenantAndOwner, hashPassword } from '@/lib/db/users-actions';
import { runMonthlyGeneration } from '@/lib/db/posts';

interface SeedCoach {
  fullName: string;
  brandName: string;
  email: string;
  displayName: string;
  speciality: string;
  city: string;
  tone: 'motivant' | 'educatif' | 'personnel';
  bio: string;
  targetAudience: string;
  subdomain: string;
  themeColor: string;
}

const COACHES: SeedCoach[] = [
  {
    fullName: 'Karim Benali',
    brandName: 'Karim Performance',
    email: 'karim.demo@aurapost.fr',
    displayName: 'Coach Karim',
    speciality: 'Préparation physique & CrossFit',
    city: 'Nice',
    tone: 'motivant',
    bio: 'Ancien athlète, j’accompagne les sportifs amateurs vers leurs objectifs depuis 8 ans.',
    targetAudience: 'amateurs 25-45 ans qui veulent progresser durablement',
    subdomain: 'karim-performance',
    themeColor: '#7C3AED',
  },
  {
    fullName: 'Léa Martin',
    brandName: 'Léa Fitness',
    email: 'lea.demo@aurapost.fr',
    displayName: 'Léa Fitness',
    speciality: 'Renforcement & remise en forme féminine',
    city: 'Lyon',
    tone: 'personnel',
    bio: 'Coach certifiée, je crée des programmes sur-mesure pour les femmes actives.',
    targetAudience: 'femmes 30-50 ans débordées par le quotidien',
    subdomain: 'lea-fitness',
    themeColor: '#A855F7',
  },
  {
    fullName: 'Thomas Roche',
    brandName: 'Roche Mobilité',
    email: 'thomas.demo@aurapost.fr',
    displayName: 'Thomas Roche',
    speciality: 'Yoga, mobilité & prévention des blessures',
    city: 'Bordeaux',
    tone: 'educatif',
    bio: 'Professeur de yoga et préparateur, je remets le mouvement au centre du quotidien.',
    targetAudience: 'sédentaires et sportifs en quête de mobilité',
    subdomain: 'roche-mobilite',
    themeColor: '#6D28D9',
  },
];

async function seedCoach(c: SeedCoach): Promise<'created' | 'skipped'> {
  const email = c.email.toLowerCase();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) return 'skipped';

  const now = new Date().toISOString();
  const passwordHash = await hashPassword('Demo!Aura2026');

  const { tenantId, userId } = await createTenantAndOwner({
    email,
    passwordHash,
    fullName: c.fullName,
    brandName: c.brandName,
    consentGivenAt: now,
  });

  await db.update(users).set({ onboardingCompleted: true, emailVerifiedAt: now }).where(eq(users.id, userId));

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
    language: 'fr',
    createdAt: now,
    updatedAt: now,
  });

  // Site vitrine actif (apparaît dans la galerie publique /coaches).
  await db.insert(websites).values({
    id: nanoid(),
    tenantId,
    subdomain: c.subdomain,
    template: 'aura',
    status: 'active',
    themeColor: c.themeColor,
    headline: `${c.displayName} — ${c.speciality}`,
    seoDescription: `${c.displayName}, coach ${c.speciality} à ${c.city}.`,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  // Génère un mois de contenu (mock déterministe si SDK indisponible).
  const gen = await runMonthlyGeneration(tenantId, userId);
  const count = gen.ok ? gen.count : 0;

  console.log(`✓ ${c.displayName} (${email}) — ${count} posts, site /site/${c.subdomain}`);
  return 'created';
}

async function main() {
  console.log('Seed AuraPost — 3 coachs de démonstration\n');
  let created = 0;
  let skipped = 0;
  for (const c of COACHES) {
    try {
      const res = await seedCoach(c);
      res === 'created' ? created++ : (skipped++, console.log(`· ${c.email} déjà présent — ignoré`));
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
