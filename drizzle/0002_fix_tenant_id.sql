-- Migration 0002 — durcissement de l'isolation multi-tenant.
-- Retire le DEFAULT '' sur tenant_id (foot-gun : une mutation oubliant le filtre
-- pouvait écrire dans un "tenant vide" partagé). tenant_id devient NOT NULL strict.
--
-- SQLite/libSQL ne permet pas DROP DEFAULT via ALTER ; on reconstruit chaque table
-- concernée (pattern officiel : table temporaire → copie → swap). Idempotent et sûr :
-- toute ligne ayant tenant_id = '' est d'abord détectée (aucune ne devrait exister,
-- l'app posant toujours un tenant_id explicite).
--
-- ⚠ À exécuter une seule fois sur une base Turso de production existante. Les bases
-- créées après ce commit ont déjà le bon schéma (CREATE TABLE sans default).

PRAGMA foreign_keys=OFF;

-- Garde-fou : refuse la migration s'il reste des lignes orphelines (tenant_id vide).
-- (Décommente pour auditer avant migration.)
-- SELECT 'users' AS t, COUNT(*) FROM users WHERE tenant_id = ''
-- UNION ALL SELECT 'coach_profiles', COUNT(*) FROM coach_profiles WHERE tenant_id = ''
-- UNION ALL SELECT 'generated_posts', COUNT(*) FROM generated_posts WHERE tenant_id = ''
-- UNION ALL SELECT 'subscriptions', COUNT(*) FROM subscriptions WHERE tenant_id = ''
-- UNION ALL SELECT 'websites', COUNT(*) FROM websites WHERE tenant_id = '';

BEGIN TRANSACTION;

-- users
ALTER TABLE users RENAME TO _users_old;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  email_verified_at TEXT,
  consent_given_at TEXT,
  onboarding_completed INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
INSERT INTO users SELECT id, tenant_id, email, password_hash, full_name, role, email_verified_at, consent_given_at, onboarding_completed, created_at FROM _users_old;
DROP TABLE _users_old;
CREATE INDEX IF NOT EXISTS users_tenant_idx ON users (tenant_id);

-- coach_profiles
ALTER TABLE coach_profiles RENAME TO _coach_profiles_old;
CREATE TABLE coach_profiles (
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
  language TEXT NOT NULL DEFAULT 'fr',
  instagram_url TEXT,
  instagram_data TEXT,
  reviews_text TEXT,
  reviews_analysis TEXT,
  photos TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT INTO coach_profiles SELECT id, tenant_id, user_id, display_name, speciality, city, content_style, tone, bio, target_audience, language, instagram_url, instagram_data, reviews_text, reviews_analysis, photos, created_at, updated_at FROM _coach_profiles_old;
DROP TABLE _coach_profiles_old;
CREATE INDEX IF NOT EXISTS coach_profiles_tenant_idx ON coach_profiles (tenant_id);
CREATE INDEX IF NOT EXISTS coach_profiles_user_idx ON coach_profiles (user_id);

-- generated_posts
ALTER TABLE generated_posts RENAME TO _generated_posts_old;
CREATE TABLE generated_posts (
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
  scheduled_for TEXT,
  copy_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT INTO generated_posts SELECT id, tenant_id, network, status, title, theme, content, hashtags, call_to_action, month, variant_of_id, generated_by, format, scheduled_for, copy_count, created_at, updated_at FROM _generated_posts_old;
DROP TABLE _generated_posts_old;
CREATE INDEX IF NOT EXISTS generated_posts_tenant_idx ON generated_posts (tenant_id);
CREATE INDEX IF NOT EXISTS generated_posts_status_idx ON generated_posts (status);
CREATE INDEX IF NOT EXISTS generated_posts_tenant_month_idx ON generated_posts (tenant_id, month);
CREATE INDEX IF NOT EXISTS generated_posts_tenant_status_date_idx ON generated_posts (tenant_id, status, created_at);

-- subscriptions
ALTER TABLE subscriptions RENAME TO _subscriptions_old;
CREATE TABLE subscriptions (
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
INSERT INTO subscriptions SELECT id, tenant_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, plan, status, current_period_end, created_at, updated_at FROM _subscriptions_old;
DROP TABLE _subscriptions_old;
CREATE INDEX IF NOT EXISTS subscriptions_tenant_idx ON subscriptions (tenant_id);

-- websites
ALTER TABLE websites RENAME TO _websites_old;
CREATE TABLE websites (
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
INSERT INTO websites SELECT id, tenant_id, subdomain, custom_domain, template, status, theme_color, headline, content, seo_description, published_at, created_at, updated_at FROM _websites_old;
DROP TABLE _websites_old;
CREATE INDEX IF NOT EXISTS websites_tenant_idx ON websites (tenant_id);

COMMIT;

PRAGMA foreign_keys=ON;
