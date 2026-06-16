-- Jobs de génération asynchrone (fin du timeout 26 s serverless + streaming par polling).
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
