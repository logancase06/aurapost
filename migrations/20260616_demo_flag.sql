-- Flag is_demo : exclut les comptes de démonstration des métriques admin (seed:demo
-- peut tourner en prod sans polluer MRR/conversion/coachs actifs). SQLite : 1 fois.
ALTER TABLE tenants ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0;
ALTER TABLE organizations ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0;
