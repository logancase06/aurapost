// SQL de création du schéma — utilisé UNIQUEMENT par le fallback SQLite en mémoire
// (mode mock, quand TURSO_DATABASE_URL est absent). En production, le schéma est géré
// par drizzle-kit (`npm run db:push` / migrations versionnées).
//
// Doit rester synchronisé avec lib/db/schema.ts. CREATE TABLE IF NOT EXISTS → idempotent.

export const MEMORY_BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  plan TEXT NOT NULL DEFAULT 'starter',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS tenants_owner_idx ON tenants (owner_id);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  email_verified_at TEXT,
  consent_given_at TEXT,
  onboarding_completed INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS users_tenant_idx ON users (tenant_id);

CREATE TABLE IF NOT EXISTS coach_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT '',
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  speciality TEXT NOT NULL,
  city TEXT,
  content_style TEXT,
  tone TEXT NOT NULL DEFAULT 'motivant',
  bio TEXT,
  target_audience TEXT,
  language TEXT NOT NULL DEFAULT 'fr',
  instagram_url TEXT,
  instagram_data TEXT,
  reviews_text TEXT,
  reviews_analysis TEXT,
  photos TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS coach_profiles_tenant_idx ON coach_profiles (tenant_id);
CREATE INDEX IF NOT EXISTS coach_profiles_user_idx ON coach_profiles (user_id);

CREATE TABLE IF NOT EXISTS generated_posts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT '',
  network TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  title TEXT,
  theme TEXT,
  content TEXT NOT NULL,
  hashtags TEXT,
  call_to_action TEXT,
  month TEXT NOT NULL,
  variant_of_id TEXT,
  generated_by TEXT,
  format TEXT NOT NULL DEFAULT 'post',
  scheduled_for TEXT,
  copy_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS generated_posts_tenant_idx ON generated_posts (tenant_id);
CREATE INDEX IF NOT EXISTS generated_posts_status_idx ON generated_posts (status);
CREATE INDEX IF NOT EXISTS generated_posts_tenant_month_idx ON generated_posts (tenant_id, month);
CREATE INDEX IF NOT EXISTS generated_posts_tenant_status_date_idx ON generated_posts (tenant_id, status, created_at);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT '',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  plan TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'incomplete',
  current_period_end TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS subscriptions_tenant_idx ON subscriptions (tenant_id);

CREATE TABLE IF NOT EXISTS websites (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT '',
  subdomain TEXT NOT NULL UNIQUE,
  custom_domain TEXT,
  template TEXT NOT NULL DEFAULT 'aura',
  status TEXT NOT NULL DEFAULT 'inactive',
  theme_color TEXT DEFAULT '#7c3aed',
  headline TEXT,
  content TEXT,
  seo_description TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS websites_tenant_idx ON websites (tenant_id);

CREATE TABLE IF NOT EXISTS magic_tokens (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS magic_tokens_token_idx ON magic_tokens (token);
CREATE INDEX IF NOT EXISTS magic_tokens_email_idx ON magic_tokens (email);

CREATE TABLE IF NOT EXISTS referral_codes (
  code TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS referral_codes_tenant_idx ON referral_codes (tenant_id);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  referrer_tenant_id TEXT NOT NULL,
  referee_tenant_id TEXT,
  referee_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  credited_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals (referrer_tenant_id);
CREATE INDEX IF NOT EXISTS referrals_referee_idx ON referrals (referee_tenant_id);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  href TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS notifications_tenant_idx ON notifications (tenant_id);
CREATE INDEX IF NOT EXISTS notifications_created_idx ON notifications (created_at);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  user_id TEXT,
  action TEXT NOT NULL,
  target_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS activity_logs_tenant_idx ON activity_logs (tenant_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_idx ON activity_logs (created_at);
`;
