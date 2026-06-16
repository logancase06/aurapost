-- File de validation des posts (conformité réseau/MLM).
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

-- Validation obligatoire au niveau organisation (SQLite : exécuter une fois).
ALTER TABLE organizations ADD COLUMN requires_approval INTEGER NOT NULL DEFAULT 0;
