-- RGPD/LCEN : désabonnement des emails marketing.
-- À appliquer sur Turso prod (idempotent par tenant ; les colonnes sont nullable).
--   unsubscribed_at  : horodatage du désabonnement (NULL = abonné).
--   unsubscribe_token : réservé (la vérification est stateless via HMAC, cf. lib/unsubscribe.ts).
ALTER TABLE tenants
  ADD COLUMN unsubscribed_at TEXT;
ALTER TABLE tenants
  ADD COLUMN unsubscribe_token TEXT;
