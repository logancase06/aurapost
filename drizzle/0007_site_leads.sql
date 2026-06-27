-- Migration 0007 : table site_leads (C-4 — capture de leads depuis le formulaire de contact)
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
CREATE INDEX IF NOT EXISTS site_leads_tenant_idx ON site_leads(tenant_id);
CREATE INDEX IF NOT EXISTS site_leads_created_idx ON site_leads(created_at);
