import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// ─────────────────────────────────────────────────────────────────────────────
// AuraPost — schéma multi-tenant strict (Drizzle / Turso).
//
// tenant_id = tenants.id (le coach en tant qu'entité isolée).
//
// Contrairement à BlazeCheck (où agencyId = id de l'admin fondateur, tenant implicite),
// AuraPost dispose d'une table `tenants` EXPLICITE : un tenant porte le plan, l'abonnement
// Stripe et le site loué, indépendamment de l'utilisateur fondateur.
//
// tenant_id est NOT NULL SANS default : aucune ligne ne doit jamais tomber dans un
// "tenant vide" partagé. L'isolation est garantie à deux niveaux :
//   - schéma : NOT NULL (la base refuse un tenant_id manquant)
//   - applicatif : requireTenantId() (toute mutation passe par là)
// (migration drizzle/0002_fix_tenant_id.sql pour les bases existantes)
// ─────────────────────────────────────────────────────────────────────────────

export const tenants = sqliteTable(
  'tenants',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(), // nom commercial du coach / de la marque
    ownerId: text('owner_id').notNull(), // userId du fondateur
    status: text('status').notNull().default('active'), // 'active' | 'disabled' (admin)
    plan: text('plan').notNull().default('starter'), // 'starter' | 'content_only' | 'pack_complet'
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    planExpiresAt: text('plan_expires_at'),
    paymentFailedAt: text('payment_failed_at'), // début de la période de grâce (échec de paiement)
    generatingAt: text('generating_at'), // verrou anti double-génération (null = libre)
    // RGPD/LCEN — désabonnement des emails marketing (null = abonné).
    // `unsubscribeToken` est réservé : la vérification est stateless via HMAC (lib/unsubscribe.ts).
    unsubscribedAt: text('unsubscribed_at'),
    unsubscribeToken: text('unsubscribe_token'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    ownerIdx: index('tenants_owner_idx').on(t.ownerId),
  })
);

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'), // null pour les comptes magic-link uniquement
    fullName: text('full_name').notNull(),
    role: text('role').notNull().default('owner'), // 'owner' | 'admin' | 'member'
    emailVerifiedAt: text('email_verified_at'),
    consentGivenAt: text('consent_given_at'), // RGPD — consentement explicite
    onboardingCompleted: integer('onboarding_completed', { mode: 'boolean' }).default(false),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    tenantIdx: index('users_tenant_idx').on(t.tenantId),
  })
);

export const coachProfiles = sqliteTable(
  'coach_profiles',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    userId: text('user_id').notNull(),
    displayName: text('display_name').notNull(), // nom public affiché
    speciality: text('speciality').notNull(), // ex: "Préparation physique CrossFit"
    city: text('city'),
    contentStyle: text('content_style'), // ex: "punchy", "storytelling", "expert"
    tone: text('tone').notNull().default('motivant'), // 'motivant' | 'educatif' | 'personnel'
    bio: text('bio'),
    targetAudience: text('target_audience'), // ex: "débutants 25-40 ans"
    results: text('results'), // ce que les clients obtiennent concrètement
    linkedinHeadline: text('linkedin_headline'), // titre LinkedIn (saisie manuelle — pas de scraping)
    linkedinSummary: text('linkedin_summary'), // résumé LinkedIn (saisie manuelle — pas de scraping)
    language: text('language').notNull().default('fr'), // 'fr' | 'en' — langue des posts générés
    instagramUrl: text('instagram_url'),
    instagramData: text('instagram_data'), // JSON : { name, bio, followers, captions[] } (scrape brut)
    instagramAnalysis: text('instagram_analysis'), // JSON : { tone, style, themes[], phrase, bio } (analyse Claude)
    reviewsText: text('reviews_text'), // texte brut collé par le coach
    reviewsAnalysis: text('reviews_analysis'), // JSON : { strengths[], testimonial, tone }
    photos: text('photos'), // JSON : string[] d'URLs (R2 ou data URL en mock)
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    tenantIdx: index('coach_profiles_tenant_idx').on(t.tenantId),
    userIdx: index('coach_profiles_user_idx').on(t.userId),
  })
);

export const generatedPosts = sqliteTable(
  'generated_posts',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    network: text('network').notNull(), // 'instagram' | 'linkedin'
    status: text('status').notNull().default('draft'), // 'draft' | 'approved' | 'rejected'
    title: text('title'), // accroche / titre court du post
    theme: text('theme'), // thématique du post
    content: text('content').notNull(), // corps du post
    hashtags: text('hashtags'), // JSON: string[]
    callToAction: text('call_to_action'),
    month: text('month').notNull(), // YYYY-MM — lot de génération mensuel
    variantOfId: text('variant_of_id'), // null = original ; sinon id du post source
    generatedBy: text('generated_by'), // userId déclencheur
    format: text('format').notNull().default('post'), // 'post' | 'story_caption' (pack de légendes)
    generatedMode: text('generated_mode'), // 'api' | 'mock' — mode de génération réel
    scheduledFor: text('scheduled_for'), // ISO date — planification calendrier éditorial
    copyCount: integer('copy_count').notNull().default(0), // nb de fois copié (stat post)
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    tenantIdx: index('generated_posts_tenant_idx').on(t.tenantId),
    statusIdx: index('generated_posts_status_idx').on(t.status),
    monthIdx: index('generated_posts_tenant_month_idx').on(t.tenantId, t.month),
    // Requête principale du dashboard : WHERE tenant_id=? AND status=? ORDER BY created_at
    tenantStatusDate: index('generated_posts_tenant_status_date_idx').on(
      t.tenantId,
      t.status,
      t.createdAt
    ),
  })
);

export const subscriptions = sqliteTable(
  'subscriptions',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripePriceId: text('stripe_price_id'),
    plan: text('plan').notNull().default('starter'),
    status: text('status').notNull().default('incomplete'), // active|trialing|past_due|canceled|incomplete
    currentPeriodEnd: text('current_period_end'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    tenantIdx: index('subscriptions_tenant_idx').on(t.tenantId),
  })
);

export const websites = sqliteTable(
  'websites',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    subdomain: text('subdomain').notNull().unique(), // <subdomain>.aurapost.fr
    customDomain: text('custom_domain'),
    template: text('template').notNull().default('aura'), // 'aura' | 'momentum' | 'minimal'
    status: text('status').notNull().default('inactive'), // 'active' | 'inactive'
    themeColor: text('theme_color').default('#7c3aed'),
    headline: text('headline'),
    content: text('content'), // JSON : contenu de landing généré par l'IA
    seoDescription: text('seo_description'),
    publishedAt: text('published_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    tenantIdx: index('websites_tenant_idx').on(t.tenantId),
  })
);

// Tokens magic link (auth) ET vérification email — même table, deux usages (pattern BlazeCheck).
export const magicTokens = sqliteTable(
  'magic_tokens',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    token: text('token').notNull(),
    expiresAt: text('expires_at').notNull(),
    usedAt: text('used_at'),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    tokenIdx: index('magic_tokens_token_idx').on(t.token),
    emailIdx: index('magic_tokens_email_idx').on(t.email),
  })
);

// Mapping code de parrainage → coach (référent). Un code unique par tenant.
export const referralCodes = sqliteTable(
  'referral_codes',
  {
    code: text('code').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    userId: text('user_id').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    tenantIdx: index('referral_codes_tenant_idx').on(t.tenantId),
  })
);

// Événements de parrainage : une ligne par filleul rattaché à un référent.
export const referrals = sqliteTable(
  'referrals',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull(), // code utilisé à l'inscription
    referrerTenantId: text('referrer_tenant_id').notNull(),
    refereeTenantId: text('referee_tenant_id'), // rempli à l'inscription du filleul
    refereeEmail: text('referee_email'),
    status: text('status').notNull().default('pending'), // 'pending' | 'credited'
    creditedAt: text('credited_at'),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    referrerIdx: index('referrals_referrer_idx').on(t.referrerTenantId),
    refereeIdx: index('referrals_referee_idx').on(t.refereeTenantId),
  })
);

// Notifications in-app (cloche du header).
export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    userId: text('user_id'), // null = visible par tout le tenant
    type: text('type').notNull(), // 'posts_ready' | 'site_activated' | 'subscription_expiring' | 'referral'
    title: text('title').notNull(),
    body: text('body'),
    href: text('href'), // lien cible au clic
    readAt: text('read_at'),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    tenantIdx: index('notifications_tenant_idx').on(t.tenantId),
    createdIdx: index('notifications_created_idx').on(t.createdAt),
  })
);

// Bibliothèque de photos du coach (upload → R2 ou data URL en mock).
export const coachPhotos = sqliteTable(
  'coach_photos',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    r2Key: text('r2_key'),
    r2Url: text('r2_url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    width: integer('width'),
    height: integer('height'),
    sizeBytes: integer('size_bytes'),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    tenantIdx: index('coach_photos_tenant_idx').on(t.tenantId),
  })
);

// Liaison post ↔ photo + rendu final (texte superposé).
export const postPhotos = sqliteTable(
  'post_photos',
  {
    id: text('id').primaryKey(),
    postId: text('post_id').notNull(),
    photoId: text('photo_id').notNull(),
    finalR2Key: text('final_r2_key'),
    textOverlay: text('text_overlay'),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    postIdx: index('post_photos_post_idx').on(t.postId),
  })
);

// Tickets de support (widget /support → visibles dans /admin).
export const supportTickets = sqliteTable(
  'support_tickets',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id'), // null si soumis hors session
    name: text('name').notNull(),
    email: text('email').notNull(),
    subject: text('subject').notNull(),
    message: text('message').notNull(),
    status: text('status').notNull().default('open'), // 'open' | 'closed'
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    statusIdx: index('support_tickets_status_idx').on(t.status),
    createdIdx: index('support_tickets_created_idx').on(t.createdAt),
  })
);

export const activityLogs = sqliteTable(
  'activity_logs',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id'), // nullable : certains logs sont système
    userId: text('user_id'),
    action: text('action').notNull(),
    targetId: text('target_id'),
    details: text('details'), // JSON: Record<string, unknown>
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    tenantIdx: index('activity_logs_tenant_idx').on(t.tenantId),
    createdIdx: index('activity_logs_created_idx').on(t.createdAt),
  })
);
