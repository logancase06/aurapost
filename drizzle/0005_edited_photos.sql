-- Migration 0005 : édition d'images par IA (EU AI Act Art.50 — provenance stockée)

CREATE TABLE IF NOT EXISTS `edited_photos` (
  `id`               TEXT    PRIMARY KEY NOT NULL,
  `tenant_id`        TEXT    NOT NULL,
  `source_photo_id`  TEXT    NOT NULL,   -- FK → coach_photos.id (original jamais écrasé)
  `r2_key`           TEXT,
  `r2_url`           TEXT    NOT NULL,
  `prompt`           TEXT    NOT NULL,   -- description de la modification (traçabilité)
  `model`            TEXT    NOT NULL,   -- ex: "gpt-image-1.5" (conformité EU AI Act)
  `status`           TEXT    NOT NULL DEFAULT 'pending',  -- pending | done | failed
  `validated_at`     TEXT,              -- NULL = en attente de validation coach
  `error_message`    TEXT,
  `created_at`       TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS `edited_photos_tenant_idx`        ON `edited_photos` (`tenant_id`);
CREATE INDEX IF NOT EXISTS `edited_photos_tenant_month_idx`  ON `edited_photos` (`tenant_id`, `created_at`);
CREATE INDEX IF NOT EXISTS `edited_photos_source_idx`        ON `edited_photos` (`source_photo_id`);

-- Jobs d'édition automatique (découplés du job texte pour ne pas re-créer les timeouts)
CREATE TABLE IF NOT EXISTS `image_edit_jobs` (
  `id`               TEXT    PRIMARY KEY NOT NULL,
  `tenant_id`        TEXT    NOT NULL,
  `generation_job_id` TEXT,             -- job texte déclencheur (si mode automatique)
  `status`           TEXT    NOT NULL DEFAULT 'pending',  -- pending | running | done | failed
  `photos_requested` INTEGER NOT NULL DEFAULT 0,
  `photos_done`      INTEGER NOT NULL DEFAULT 0,
  `error_message`    TEXT,
  `started_at`       TEXT,
  `completed_at`     TEXT,
  `created_at`       TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS `image_edit_jobs_tenant_idx`  ON `image_edit_jobs` (`tenant_id`);
CREATE INDEX IF NOT EXISTS `image_edit_jobs_status_idx`  ON `image_edit_jobs` (`status`);
