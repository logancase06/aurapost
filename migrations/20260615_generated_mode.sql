-- Bloc D (monitoring) — mode de génération réel ('api' | 'mock') par post.
-- À appliquer sur Turso prod.
ALTER TABLE generated_posts ADD COLUMN generated_mode TEXT;
