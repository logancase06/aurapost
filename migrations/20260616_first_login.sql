-- Suivi de connexion (mesure d'adoption réseau). Timestamps ISO (cohérence schéma).
-- SQLite : ADD COLUMN sans IF NOT EXISTS → exécuter une seule fois.
ALTER TABLE users ADD COLUMN first_login_at TEXT;
ALTER TABLE users ADD COLUMN last_login_at TEXT;
ALTER TABLE users ADD COLUMN login_count INTEGER NOT NULL DEFAULT 0;
