/**
 * scripts/seed-agency.ts — organisation de démonstration « Réseau Vitalité France »
 * + 8 distributeurs à états variés (actif / inactif / jamais connecté / en validation).
 *
 * C'est LE jeu de données du pitch réseau/Herbalife : sans lui, toute la couche agence
 * (reporting, adoption, validation) est vide à l'écran. Idempotent par email du manager.
 */
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, tenants, coachProfiles, generatedPosts, organizations, orgTenants, activityLogs } from '@/lib/db/schema';
import { createTenantAndOwner, hashPassword } from '@/lib/db/users-actions';
import { createOrganization, upsertBrandKit, addOrgTemplate, setOrgRequiresApproval } from '@/lib/db/organizations';
import { generateMockContent, type CoachProfileInput } from '@/lib/content-generator';
import { currentMonth } from '@/lib/utils';

const MANAGER_EMAIL = 'manager@reseau-vitalite.fr';
const FORBIDDEN = ['revenus', "gagner de l'argent", 'liberté financière', 'guérir', 'garanti', 'certifié cliniquement', 'résultats garantis', 'perdre 10 kg'];

type DistState = 'active' | 'inactive' | 'never' | 'active_pending';

interface Distributor {
  first: string;
  last: string;
  city: string;
  speciality: string;
  state: DistState;
  posts: number;
  pending?: number; // posts en attente de validation
  lastSeenDays?: number; // jours depuis dernière connexion/action
}

const DISTRIBUTORS: Distributor[] = [
  { first: 'Sophie', last: 'Martin', city: 'Lyon', speciality: 'Nutrition', state: 'active', posts: 12, lastSeenDays: 2 },
  { first: 'Thomas', last: 'Dubois', city: 'Paris', speciality: 'Coaching minceur', state: 'active', posts: 8, lastSeenDays: 4 },
  { first: 'Marie', last: 'Leclerc', city: 'Marseille', speciality: 'Fitness nutrition', state: 'active', posts: 10, lastSeenDays: 1 },
  { first: 'Pierre', last: 'Bernard', city: 'Bordeaux', speciality: 'Bien-être holistique', state: 'inactive', posts: 4, lastSeenDays: 18 },
  { first: 'Julie', last: 'Moreau', city: 'Toulouse', speciality: 'Yoga méditation', state: 'inactive', posts: 0, lastSeenDays: 15 },
  { first: 'Laurent', last: 'Petit', city: 'Nice', speciality: 'Nutrition sportive', state: 'never', posts: 0 },
  { first: 'Isabelle', last: 'Roux', city: 'Nantes', speciality: 'Coach bien-être', state: 'never', posts: 0 },
  { first: 'Marc', last: 'Dupont', city: 'Strasbourg', speciality: 'Perte de poids', state: 'active_pending', posts: 6, pending: 3, lastSeenDays: 3 },
];

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

function slugifyName(d: Distributor): string {
  return `${d.first}.${d.last}`.toLowerCase().normalize('NFD').replace(/[^a-z.]/g, '');
}

async function seedDistributor(orgId: string, d: Distributor): Promise<number> {
  const email = `${slugifyName(d)}@reseau-vitalite.fr`;
  const now = new Date().toISOString();
  const month = currentMonth();
  const displayName = `${d.first} ${d.last}`;
  const passwordHash = await hashPassword(nanoid(24)); // compte magic-link/réseau

  const { tenantId, userId } = await createTenantAndOwner({ email, passwordHash, fullName: displayName, brandName: displayName, consentGivenAt: now });

  // États de connexion (mesure d'adoption).
  const connected = d.state !== 'never';
  await db
    .update(users)
    .set({
      onboardingCompleted: connected,
      emailVerifiedAt: now,
      isDemo: true,
      firstLoginAt: connected ? daysAgo(30) : null,
      lastLoginAt: connected ? daysAgo(d.lastSeenDays ?? 5) : null,
      loginCount: connected ? (d.state === 'inactive' ? 3 : 14) : 0,
    })
    .where(eq(users.id, userId));
  await db.update(tenants).set({ isDemo: true }).where(eq(tenants.id, tenantId));

  await db.insert(coachProfiles).values({
    id: nanoid(),
    tenantId,
    userId,
    displayName,
    speciality: d.speciality,
    city: d.city,
    tone: 'motivant',
    bio: `${displayName}, ${d.speciality.toLowerCase()} à ${d.city}. Accompagnement bien-être au sein du Réseau Vitalité.`,
    language: 'fr',
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(orgTenants).values({ orgId, tenantId, role: 'member', invitedAt: daysAgo(35), joinedAt: connected ? daysAgo(30) : null });

  // Activité (drive l'état du reporting : actif si action < 7 j, sinon inactif).
  if (d.state === 'active' || d.state === 'active_pending') {
    await db.insert(activityLogs).values({ id: nanoid(), tenantId, userId, action: 'content_generated', createdAt: daysAgo(d.lastSeenDays ?? 2) });
  } else if (d.state === 'inactive') {
    await db.insert(activityLogs).values({ id: nanoid(), tenantId, userId, action: 'content_generated', createdAt: daysAgo(d.lastSeenDays ?? 18) });
  }

  // Posts mock (nutrition/bien-être), statuts variés.
  let inserted = 0;
  if (d.posts > 0) {
    const profile: CoachProfileInput = { displayName, speciality: d.speciality, city: d.city, tone: 'motivant', language: 'fr' };
    const drafts = generateMockContent(profile, email).slice(0, d.posts);
    const approvedCount = d.state === 'inactive' ? Math.ceil(d.posts / 2) : d.posts; // actifs : tout approuvé
    for (let i = 0; i < drafts.length; i++) {
      const post = drafts[i];
      await db.insert(generatedPosts).values({
        id: nanoid(),
        tenantId,
        network: post.network,
        status: i < approvedCount ? 'approved' : 'draft',
        title: post.title,
        theme: post.theme,
        content: post.content,
        hashtags: JSON.stringify(post.hashtags),
        callToAction: post.callToAction,
        month,
        variantOfId: null,
        generatedBy: userId,
        generatedMode: 'mock',
        createdAt: now,
        updatedAt: now,
      });
      inserted++;
    }
  }

  // Posts en attente de validation (dont 1 avec allégation interdite → badge warning).
  if (d.pending && d.pending > 0) {
    const profile: CoachProfileInput = { displayName, speciality: d.speciality, city: d.city, tone: 'motivant', language: 'fr' };
    const extra = generateMockContent(profile, `${email}-pending`).slice(0, d.pending);
    for (let i = 0; i < extra.length; i++) {
      const post = extra[i];
      // Le 1er post en attente contient une allégation interdite (démo conformité).
      const content = i === 0 ? `Perds du poids avec des résultats garantis en 30 jours grâce à ma méthode. ${post.content}` : post.content;
      await db.insert(generatedPosts).values({
        id: nanoid(),
        tenantId,
        network: post.network,
        status: 'pending_approval',
        title: i === 0 ? 'Offre minceur 30 jours' : post.title,
        theme: post.theme,
        content,
        hashtags: JSON.stringify(post.hashtags),
        callToAction: post.callToAction,
        month,
        variantOfId: null,
        generatedBy: userId,
        generatedMode: 'mock',
        createdAt: now,
        updatedAt: now,
      });
      inserted++;
    }
  }

  return inserted;
}

export async function seedAgency(): Promise<'created' | 'skipped'> {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, MANAGER_EMAIL)).limit(1);
  if (existing.length > 0) return 'skipped';

  const now = new Date().toISOString();
  // Manager (owner de l'organisation).
  const managerHash = await hashPassword('Demo2024!');
  const { tenantId: managerTenant, userId: managerUser } = await createTenantAndOwner({
    email: MANAGER_EMAIL,
    passwordHash: managerHash,
    fullName: 'Manager Réseau Vitalité',
    brandName: 'Réseau Vitalité France',
    consentGivenAt: now,
  });
  await db.update(users).set({ onboardingCompleted: true, emailVerifiedAt: now, isDemo: true, firstLoginAt: daysAgo(40), lastLoginAt: now, loginCount: 30 }).where(eq(users.id, managerUser));
  await db.update(tenants).set({ isDemo: true }).where(eq(tenants.id, managerTenant));

  const org = await createOrganization(managerTenant, 'Réseau Vitalité France');
  await db.update(organizations).set({ slug: 'reseau-vitalite', brandColor: '#E8A020', brandTone: 'motivant et bienveillant, centré sur le bien-être durable', isDemo: true }).where(eq(organizations.id, org.id));
  await setOrgRequiresApproval(org.id, true);
  await upsertBrandKit(org.id, {
    primaryColor: '#E8A020',
    secondaryColor: '#2D5016',
    toneGuidelines: 'Bienveillant, encourageant, scientifiquement fondé. Éviter le sensationnalisme.',
    forbiddenWords: FORBIDDEN,
  });
  await addOrgTemplate(org.id, { name: 'Post témoignage client', content: 'Template : Prénom a atteint son objectif en {Y} mois grâce à [méthode]. Voici son parcours…', category: 'testimonial', isLocked: true });
  await addOrgTemplate(org.id, { name: 'Conseil nutrition hebdomadaire', content: 'Template : Cette semaine, focus sur [nutriment]. Voici pourquoi c’est essentiel pour ton énergie…', category: 'educational', isLocked: true });

  let total = 0;
  for (const d of DISTRIBUTORS) {
    const n = await seedDistributor(org.id, d);
    total += n;
    console.log(`  · ${d.first} ${d.last} (${d.city}) — ${d.state} — ${n} posts`);
  }

  console.log(`✓ Réseau Vitalité France (slug reseau-vitalite) — ${DISTRIBUTORS.length} distributeurs, ${total} posts`);
  console.log('  Manager : manager@reseau-vitalite.fr / Demo2024!');
  return 'created';
}
