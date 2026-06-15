import { metaLine } from '../theme';
import type { CoachSiteData } from '../types';

export default function SiteFooter({ data, accent }: { data: CoachSiteData; accent: string }) {
  const meta = metaLine(data);
  return (
    <footer id="footer" style={{ background: '#0A0A0A', color: 'rgba(255,255,255,0.6)', padding: '48px 24px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontWeight: 800, color: '#fff' }}>
          {data.displayName} <span style={{ color: accent }}>·</span> {meta}
        </p>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          {data.instagramUrl && (
            <a href={data.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 13 }}>Instagram</a>
          )}
          <a href="https://aurapost.fr" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13 }}>Créé avec ✦ AuraPost</a>
        </div>
      </div>
    </footer>
  );
}
