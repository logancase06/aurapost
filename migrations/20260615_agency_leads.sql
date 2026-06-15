-- Prospects agence / réseau (formulaire /agency-demo → /api/agency-contact).
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
