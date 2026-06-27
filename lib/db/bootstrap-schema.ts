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
  payment_failed_at TEXT,
  generating_at TEXT,
  unsubscribed_at TEXT,
  unsubscribe_token TEXT,
  is_demo INTEGER NOT NULL DEFAULT 0,
  zernio_profile_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS tenants_owner_idx ON tenants (owner_id);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  email_verified_at TEXT,
  consent_given_at TEXT,
  onboarding_completed INTEGER DEFAULT 0,
  first_login_at TEXT,
  last_login_at TEXT,
  login_count INTEGER NOT NULL DEFAULT 0,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS users_tenant_idx ON users (tenant_id);

CREATE TABLE IF NOT EXISTS coach_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  speciality TEXT NOT NULL,
  city TEXT,
  content_style TEXT,
  tone TEXT NOT NULL DEFAULT 'motivant',
  bio TEXT,
  target_audience TEXT,
  results TEXT,
  linkedin_headline TEXT,
  linkedin_summary TEXT,
  language TEXT NOT NULL DEFAULT 'fr',
  instagram_url TEXT,
  instagram_data TEXT,
  instagram_analysis TEXT,
  reviews_text TEXT,
  reviews_analysis TEXT,
  photos TEXT,
  last_recommendation TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS coach_profiles_tenant_idx ON coach_profiles (tenant_id);
CREATE INDEX IF NOT EXISTS coach_profiles_user_idx ON coach_profiles (user_id);

CREATE TABLE IF NOT EXISTS profile_analyses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  profile_url TEXT,
  score_global INTEGER,
  analysis_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS profile_analyses_tenant_platform_idx ON profile_analyses (tenant_id, platform);

CREATE TABLE IF NOT EXISTS generated_posts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
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
  generated_mode TEXT,
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
  tenant_id TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  plan TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'incomplete',
  current_period_end TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_tenant_unique_idx ON subscriptions (tenant_id);

CREATE TABLE IF NOT EXISTS websites (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS site_visits (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   TEXT    NOT NULL,
  subdomain   TEXT    NOT NULL,
  visited_at  INTEGER NOT NULL,
  referrer    TEXT,
  country     TEXT,
  device      TEXT
);
CREATE INDEX IF NOT EXISTS site_visits_tenant_date_idx ON site_visits (tenant_id, visited_at);
CREATE INDEX IF NOT EXISTS site_visits_subdomain_idx ON site_visits (subdomain);

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

CREATE TABLE IF NOT EXISTS coach_photos (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  r2_key TEXT,
  r2_url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  size_bytes INTEGER,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS coach_photos_tenant_idx ON coach_photos (tenant_id);

CREATE TABLE IF NOT EXISTS post_photos (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  photo_id TEXT NOT NULL,
  final_r2_key TEXT,
  text_overlay TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS post_photos_post_idx ON post_photos (post_id);

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets (status);
CREATE INDEX IF NOT EXISTS support_tickets_created_idx ON support_tickets (created_at);

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#7c3aed',
  brand_tone TEXT,
  requires_approval INTEGER NOT NULL DEFAULT 0,
  is_demo INTEGER NOT NULL DEFAULT 0,
  owner_tenant_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations (slug);
CREATE INDEX IF NOT EXISTS organizations_owner_idx ON organizations (owner_tenant_id);

CREATE TABLE IF NOT EXISTS org_tenants (
  org_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_at TEXT,
  joined_at TEXT
);
CREATE INDEX IF NOT EXISTS org_tenants_org_idx ON org_tenants (org_id);
CREATE INDEX IF NOT EXISTS org_tenants_tenant_idx ON org_tenants (tenant_id);

CREATE TABLE IF NOT EXISTS org_templates (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  is_locked INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS org_templates_org_idx ON org_templates (org_id);

CREATE TABLE IF NOT EXISTS org_brand_kit (
  org_id TEXT PRIMARY KEY,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#7c3aed',
  secondary_color TEXT DEFAULT '#a855f7',
  tone_guidelines TEXT,
  forbidden_words TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS generation_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 12,
  posts_generated TEXT NOT NULL DEFAULT '[]',
  error_message TEXT,
  generation_mode TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS generation_jobs_tenant_idx ON generation_jobs (tenant_id, created_at);

CREATE TABLE IF NOT EXISTS post_approvals (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  reviewer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  comment TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS post_approvals_org_status_idx ON post_approvals (org_id, status);
CREATE INDEX IF NOT EXISTS post_approvals_post_idx ON post_approvals (post_id);

CREATE TABLE IF NOT EXISTS agency_leads (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  distributor_count INTEGER,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS agency_leads_status_idx ON agency_leads (status);
CREATE INDEX IF NOT EXISTS agency_leads_created_idx ON agency_leads (created_at);

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

CREATE TABLE IF NOT EXISTS edited_photos (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source_photo_id TEXT NOT NULL,
  r2_key TEXT,
  r2_url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  validated_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS edited_photos_tenant_idx ON edited_photos (tenant_id);
CREATE INDEX IF NOT EXISTS edited_photos_tenant_month_idx ON edited_photos (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS edited_photos_source_idx ON edited_photos (source_photo_id);

CREATE TABLE IF NOT EXISTS image_edit_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  generation_job_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  photos_requested INTEGER NOT NULL DEFAULT 0,
  photos_done INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS image_edit_jobs_tenant_idx ON image_edit_jobs (tenant_id);
CREATE INDEX IF NOT EXISTS image_edit_jobs_status_idx ON image_edit_jobs (status);

CREATE TABLE IF NOT EXISTS social_connections (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  zernio_account_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  account_name TEXT,
  account_avatar TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  connected_at TEXT NOT NULL,
  last_used_at TEXT
);
CREATE INDEX IF NOT EXISTS social_connections_tenant_idx ON social_connections (tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS social_connections_tenant_platform_idx ON social_connections (tenant_id, platform);

CREATE TABLE IF NOT EXISTS social_publications (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  zernio_post_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  published_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS social_publications_post_idx ON social_publications (post_id);
CREATE INDEX IF NOT EXISTS social_publications_tenant_status_idx ON social_publications (tenant_id, status);
CREATE INDEX IF NOT EXISTS social_publications_zernio_post_idx ON social_publications (zernio_post_id);

CREATE TABLE IF NOT EXISTS site_leads (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'contact_form',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS site_leads_tenant_idx ON site_leads (tenant_id);
CREATE INDEX IF NOT EXISTS site_leads_created_idx ON site_leads (created_at);

CREATE INDEX IF NOT EXISTS notifications_tenant_read_idx ON notifications (tenant_id, read_at);
CREATE INDEX IF NOT EXISTS notifications_tenant_created_idx ON notifications (tenant_id, created_at);
`;
