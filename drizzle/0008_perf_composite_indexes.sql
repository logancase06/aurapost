-- Migration 0008 : index composites sur notifications pour les requêtes dashboard fréquentes.
-- notifications_tenant_read_idx  : badge non-lu (WHERE tenant_id=? AND read_at IS NULL)
-- notifications_tenant_created_idx : liste triée (WHERE tenant_id=? ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS notifications_tenant_read_idx ON notifications (tenant_id, read_at);
CREATE INDEX IF NOT EXISTS notifications_tenant_created_idx ON notifications (tenant_id, created_at);
