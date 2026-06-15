-- Bloc A (facturation) + Bloc C (robustesse) — colonnes tenants.
-- À appliquer sur Turso prod : `turso db shell <db> < migrations/20260615_tenants_billing_lock.sql`
ALTER TABLE tenants ADD COLUMN payment_failed_at TEXT;
ALTER TABLE tenants ADD COLUMN generating_at TEXT;
