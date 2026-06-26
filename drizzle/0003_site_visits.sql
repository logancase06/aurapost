-- Migration 0003 : table site_visits (Analytics Volet A)
-- RGPD : aucune IP stockée, aucun cookie — exemption CNIL 2020-091 audience measurement.

CREATE TABLE IF NOT EXISTS `site_visits` (
  `id`          INTEGER PRIMARY KEY AUTOINCREMENT,
  `tenant_id`   TEXT    NOT NULL,
  `subdomain`   TEXT    NOT NULL,
  `visited_at`  INTEGER NOT NULL,      -- timestamp Unix (secondes)
  `referrer`    TEXT,                  -- domaine source tronqué, pas URL complète
  `country`     TEXT,                  -- ISO-2 via CF-IPCountry (Cloudflare), peut être null
  `device`      TEXT                   -- 'mobile' | 'tablet' | 'desktop'
);

CREATE INDEX IF NOT EXISTS `site_visits_tenant_date_idx` ON `site_visits` (`tenant_id`, `visited_at`);
CREATE INDEX IF NOT EXISTS `site_visits_subdomain_idx`   ON `site_visits` (`subdomain`);
