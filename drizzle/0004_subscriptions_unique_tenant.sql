-- Migration 0004 : contrainte UNIQUE sur subscriptions.tenant_id
-- Élimine la race condition : deux webhooks Stripe simultanés ne peuvent plus
-- créer deux lignes pour le même tenant. upsertSubscription utilise désormais
-- INSERT ... ON CONFLICT(tenant_id) DO UPDATE (atomique).

DROP INDEX IF EXISTS subscriptions_tenant_idx;
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_tenant_unique_idx ON subscriptions(tenant_id);
