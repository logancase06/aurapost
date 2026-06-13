import { ImageResponse } from 'next/og';
import { getCoachSiteData } from '@/lib/db/public';

// og:image générée dynamiquement avec le nom du coach (partage social).
export const alt = 'Site coach AuraPost';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
  const data = await getCoachSiteData(subdomain).catch(() => null);
  const name = data?.displayName ?? 'Coach AuraPost';
  const speciality = data?.speciality ?? 'Coaching sportif';
  const city = data?.city ? ` · ${data.city}` : '';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: 'linear-gradient(135deg, #0A0A0F 0%, #2e1065 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 28, color: '#A855F7', fontWeight: 800 }}>
          ✦ AuraPost
        </div>
        <div style={{ marginTop: 24, fontSize: 88, fontWeight: 900, letterSpacing: '-3px', lineHeight: 1 }}>{name}</div>
        <div style={{ marginTop: 20, fontSize: 40, color: '#c4b5fd' }}>
          Coach {speciality}
          {city}
        </div>
      </div>
    ),
    { ...size }
  );
}
