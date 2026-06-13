import type { MetadataRoute } from 'next';
import { ARTICLES } from '@/lib/blog';
import { listActiveCoaches } from '@/lib/db/public';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = ['', '/demo', '/pricing', '/login', '/register', '/blog', '/coaches', '/status'].map(
    (path) => ({
      url: `${APP_URL}${path}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: path === '' ? 1 : 0.7,
    })
  );

  const blogRoutes: MetadataRoute.Sitemap = ARTICLES.map((a) => ({
    url: `${APP_URL}/blog/${a.slug}`,
    lastModified: new Date(a.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Pages coachs publiques (sites actifs). Tolérant aux erreurs DB (build/mock).
  let coachRoutes: MetadataRoute.Sitemap = [];
  try {
    const coaches = await listActiveCoaches();
    coachRoutes = coaches.map((c) => ({
      url: `${APP_URL}/site/${c.subdomain}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    }));
  } catch {
    coachRoutes = [];
  }

  return [...staticRoutes, ...blogRoutes, ...coachRoutes];
}
