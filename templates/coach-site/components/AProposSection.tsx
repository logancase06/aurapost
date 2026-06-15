import Reveal from '../Reveal';
import { headStyle, type Theme } from '../theme';
import type { CoachSiteData, SiteStyle } from '../types';

export default function AProposSection({ data, style, accent, t }: { data: CoachSiteData; style: SiteStyle; accent: string; t: Theme }) {
  const story = data.story || data.about || data.bio || '';
  if (!story) return null;
  const headFont = headStyle(t);
  const wrap = { maxWidth: 1080, margin: '0 auto', padding: '100px 24px' } as const;

  return (
    <Reveal as="section" style={wrap}>
      <div id="apropos" style={{ display: 'grid', gridTemplateColumns: data.photoUrl ? 'minmax(0,0.9fr) minmax(0,1.4fr)' : '1fr', gap: 56, alignItems: 'center' }}>
        {data.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.photoUrl} alt={data.displayName} style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', borderRadius: style === 'impact' ? 2 : 14 }} />
        )}
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: accent }}>Mon histoire</p>
          <p style={{ margin: '18px 0 0', fontSize: 18, lineHeight: 1.7, color: t.muted, whiteSpace: 'pre-line' }}>{story}</p>
          {data.storyQuote && (
            <p style={{ ...headFont, textTransform: 'none', margin: '30px 0 0', fontSize: 'clamp(1.3rem, 3vw, 1.9rem)', fontStyle: style === 'authenticite' ? 'italic' : 'normal', lineHeight: 1.3, color: t.ink, borderLeft: `3px solid ${accent}`, paddingLeft: 20 }}>
              {data.storyQuote}
            </p>
          )}
        </div>
      </div>
    </Reveal>
  );
}
