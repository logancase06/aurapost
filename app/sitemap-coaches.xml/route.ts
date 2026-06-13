import { NextResponse } from 'next/server';
import { listActiveCoaches } from '@/lib/db/public';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';

/**
 * GET /sitemap-coaches.xml — sitemap dédié aux pages publiques des coachs (sites actifs).
 * Permet une indexation Google fine et séparée du sitemap principal.
 */
export async function GET() {
  let coaches: { subdomain: string }[] = [];
  try {
    coaches = await listActiveCoaches(500);
  } catch {
    coaches = [];
  }

  const now = new Date().toISOString();
  const urls = coaches
    .map(
      (c) => `  <url>
    <loc>${APP_URL}/site/${c.subdomain}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
  });
}
