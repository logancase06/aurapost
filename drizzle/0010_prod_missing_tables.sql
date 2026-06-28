-- Migration 0010 : colonnes et tables manquantes en prod (0006 n'avait pas ete appliquee).
-- Idempotente : IF NOT EXISTS sur toutes les instructions.
-- A appliquer dans le shell web Turso avant le prochain deploy.

-- ── 1. Colonne manquante sur tenants ─────────────────────────────────────────

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS zernio_profile_id TEXT;

-- ── 2. Tables manquantes (0006 + 0007) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS social_connections (
  id                TEXT PRIMARY KEY,
  tenant_id         TEXT NOT NULL,
  zernio_account_id TEXT NOT NULL,
  platform          TEXT NOT NULL,
  account_name      TEXT,
  account_avatar    TEXT,
  status            TEXT NOT NULL DEFAULT 'active',
  connected_at      TEXT NOT NULL,
  last_used_at      TEXT
);
CREATE INDEX IF NOT EXISTS social_connections_tenant_idx
  ON social_connections (tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS social_connections_tenant_platform_idx
  ON social_connections (tenant_id, platform);

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

CREATE TABLE IF NOT EXISTS site_leads (
  id        TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name      TEXT NOT NULL,
  email     TEXT NOT NULL,
  phone     TEXT,
  message   TEXT,
  source    TEXT NOT NULL DEFAULT 'contact_form',
  status    TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS site_leads_tenant_idx ON site_leads (tenant_id);
CREATE INDEX IF NOT EXISTS site_leads_created_idx ON site_leads (created_at);
