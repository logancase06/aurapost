-- Migration 0009 : rattrapage du drift de schema (colonnes ajoutees sans migration + nouvelles tables).
-- Idempotente via IF NOT EXISTS / ADD COLUMN best-effort.
-- A appliquer une seule fois sur le Turso de production.
-- Toutes les ALTER TABLE ADD COLUMN echouent silencieusement si la colonne existe deja
-- (comportement standard libSQL/SQLite quand la colonne manque uniquement).

-- ── 1. Nouvelles colonnes sur tables existantes ────────────────────────────────

-- users : colonnes ajoutees apres migration 0002
ALTER TABLE users ADD COLUMN first_login_at TEXT;
ALTER TABLE users ADD COLUMN last_login_at TEXT;
ALTER TABLE users ADD COLUMN login_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0;

-- tenants : colonnes ajoutees apres migration 0000
ALTER TABLE tenants ADD COLUMN payment_failed_at TEXT;
ALTER TABLE tenants ADD COLUMN generating_at TEXT;
ALTER TABLE tenants ADD COLUMN unsubscribed_at TEXT;
ALTER TABLE tenants ADD COLUMN unsubscribe_token TEXT;
ALTER TABLE tenants ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tenants ADD COLUMN zernio_profile_id TEXT;

-- coach_profiles : colonnes ajoutees apres migration 0002
ALTER TABLE coach_profiles ADD COLUMN results TEXT;
ALTER TABLE coach_profiles ADD COLUMN linkedin_headline TEXT;
ALTER TABLE coach_profiles ADD COLUMN linkedin_summary TEXT;
ALTER TABLE coach_profiles ADD COLUMN instagram_analysis TEXT;
ALTER TABLE coach_profiles ADD COLUMN last_recommendation TEXT;

-- generated_posts : colonne ajoutee apres migration 0002
ALTER TABLE generated_posts ADD COLUMN generated_mode TEXT;

-- ── 2. Nouvelles tables ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profile_analyses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  profile_url TEXT,
  score_global INTEGER,
  analysis_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS profile_analyses_tenant_platform_idx
  ON profile_analyses (tenant_id, platform);

CREATE TABLE IF NOT EXISTS referral_codes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS referral_codes_tenant_idx ON referral_codes (tenant_id);
CREATE INDEX IF NOT EXISTS referral_codes_code_idx ON referral_codes (code);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  referrer_tenant_id TEXT NOT NULL,
  referee_tenant_id TEXT NOT NULL,
  referee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'credited',
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
CREATE INDEX IF NOT EXISTS notifications_tenant_read_idx
  ON notifications (tenant_id, read_at);
CREATE INDEX IF NOT EXISTS notifications_tenant_created_idx
  ON notifications (tenant_id, created_at);

CREATE TABLE IF NOT EXISTS coach_photos (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  url TEXT NOT NULL,
  r2_key TEXT,
  label TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS coach_photos_tenant_idx ON coach_photos (tenant_id);

CREATE TABLE IF NOT EXISTS post_photos (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  url TEXT NOT NULL,
  r2_key TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS post_photos_post_idx ON post_photos (post_id);
CREATE INDEX IF NOT EXISTS post_photos_tenant_idx ON post_photos (tenant_id);

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets (status);
CREATE INDEX IF NOT EXISTS support_tickets_created_idx ON support_tickets (created_at);
CREATE INDEX IF NOT EXISTS support_tickets_tenant_idx ON support_tickets (tenant_id);

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'agency',
  max_tenants INTEGER NOT NULL DEFAULT 10,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS organizations_owner_idx ON organizations (owner_id);

CREATE TABLE IF NOT EXISTS org_tenants (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS org_tenants_org_idx ON org_tenants (org_id);
CREATE INDEX IF NOT EXISTS org_tenants_tenant_idx ON org_tenants (tenant_id);

CREATE TABLE IF NOT EXISTS org_templates (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  prompt_override TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS org_templates_org_idx ON org_templates (org_id);

CREATE TABLE IF NOT EXISTS org_brand_kit (
  org_id TEXT PRIMARY KEY,
  logo_url TEXT,
  primary_color TEXT,
  font TEXT,
  tone_guidelines TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS generation_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  month TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  done INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  started_at TEXT,
  finished_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS generation_jobs_tenant_idx ON generation_jobs (tenant_id);
CREATE INDEX IF NOT EXISTS generation_jobs_status_idx ON generation_jobs (status);

CREATE TABLE IF NOT EXISTS post_approvals (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  approved_by TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  comment TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS post_approvals_post_idx ON post_approvals (post_id);
CREATE INDEX IF NOT EXISTS post_approvals_org_idx ON post_approvals (org_id);

CREATE TABLE IF NOT EXISTS agency_leads (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS agency_leads_status_idx ON agency_leads (status);
CREATE INDEX IF NOT EXISTS agency_leads_created_idx ON agency_leads (created_at);

-- site_leads (etait dans 0007 non commite)
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
