-- Migration Z-1 : intégration Zernio — publication sociale directe depuis AuraPost.
-- Exécuter sur la base Turso prod :
--   turso db shell aurapost-prod < drizzle/0006_social_connections.sql

-- 1. Colonne Zernio Profile ID sur les tenants (un Profile Zernio par coach).
--    Nullable : null tant que le coach n'a pas connecté un réseau social.
ALTER TABLE tenants ADD COLUMN zernio_profile_id TEXT;

-- 2. Comptes réseaux sociaux connectés (LinkedIn, Instagram en v1).
--    UNIQUE (tenant_id, platform) : un seul compte actif par plateforme par coach.
CREATE TABLE IF NOT EXISTS social_connections (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  zernio_account_id TEXT NOT NULL,
  platform        TEXT NOT NULL,
  account_name    TEXT,
  account_avatar  TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  connected_at    TEXT NOT NULL,
  last_used_at    TEXT
);
CREATE INDEX IF NOT EXISTS social_connections_tenant_idx
  ON social_connections (tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS social_connections_tenant_platform_idx
  ON social_connections (tenant_id, platform);

-- 3. Historique des publications (post × connexion × statut).
--    Index sur zernio_post_id pour réconcilier les webhooks entrants.
CREATE TABLE IF NOT EXISTS social_publications (
  id              TEXT PRIMARY KEY,
  post_id         TEXT NOT NULL,
  tenant_id       TEXT NOT NULL,
  connection_id   TEXT NOT NULL,
  zernio_post_id  TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  published_at    TEXT,
  error_message   TEXT,
  created_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS social_publications_post_idx
  ON social_publications (post_id);
CREATE INDEX IF NOT EXISTS social_publications_tenant_status_idx
  ON social_publications (tenant_id, status);
CREATE INDEX IF NOT EXISTS social_publications_zernio_post_idx
  ON social_publications (zernio_post_id);
