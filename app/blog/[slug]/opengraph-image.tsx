import { ImageResponse } from 'next/og';
import { getArticle } from '@/lib/blog';

// og:image générée dynamiquement pour chaque article (partage social).
export const alt = 'Article AuraPost';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  const title = article?.title ?? 'Blog AuraPost';
  const category = article?.category ?? 'Conseils contenu';
  const accent = article?.cover ?? '#7C3AED';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: `linear-gradient(135deg, #0A0A0F 0%, ${accent} 220%)`,
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 30, color: '#A855F7', fontWeight: 800 }}>
          ✦ AuraPost
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 24, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 4, color: '#c4b5fd' }}>
            {category}
          </div>
          <div style={{ marginTop: 20, fontSize: 64, fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.05, maxWidth: 1000 }}>
            {title}
          </div>
        </div>
        <div style={{ fontSize: 28, color: '#a1a1aa' }}>Le blog des coachs qui veulent être vus.</div>
      </div>
    ),
    { ...size }
  );
}
