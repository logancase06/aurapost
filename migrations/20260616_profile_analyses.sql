-- Feature « Analyse & Recommandations » : historique des analyses + action prioritaire.
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

-- Action prioritaire en cours (SQLite ne supporte pas ADD COLUMN IF NOT EXISTS :
-- exécuter une seule fois ; ignorer l'erreur « duplicate column » si déjà appliqué).
ALTER TABLE coach_profiles ADD COLUMN last_recommendation TEXT;
