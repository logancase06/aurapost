-- Couche organisation / réseau (agences, franchises, MLM).
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#7c3aed',
  brand_tone TEXT,
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
