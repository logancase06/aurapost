import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listPosts } from '@/lib/db/posts';
import { currentMonth } from '@/lib/utils';
import PrintTrigger from './PrintTrigger';

export const metadata = { title: 'Export imprimable' };

type SearchParams = Promise<{ month?: string }>;

// Page imprimable (impression navigateur → PDF) des posts approuvés du mois.
export default async function PrintPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;

  const sp = await searchParams;
  const month = sp.month ?? currentMonth();
  const posts = await listPosts(tenantId, { status: 'approved', month });

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 32, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <PrintTrigger />
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#4c1d95' }}>✦ AuraPost — Posts approuvés · {month}</h1>
      <p style={{ color: '#6b7280', fontSize: 14 }}>
        {posts.length} post(s) prêt(s) à publier. Utilisez « Imprimer » pour enregistrer en PDF.
      </p>
      {posts.length === 0 && <p style={{ marginTop: 24 }}>Aucun post approuvé pour ce mois.</p>}
      {posts.map((p) => (
        <article
          key={p.id}
          style={{ marginTop: 20, padding: 16, border: '1px solid #ede9fe', borderRadius: 12, pageBreakInside: 'avoid' }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#7c3aed' }}>{p.network}</div>
          {p.title && <h3 style={{ margin: '6px 0', fontSize: 16 }}>{p.title}</h3>}
          <p style={{ whiteSpace: 'pre-line', fontSize: 14, lineHeight: 1.6, color: '#374151' }}>{p.content}</p>
          {p.hashtags.length > 0 && (
            <p style={{ marginTop: 8, fontSize: 13, color: '#7c3aed' }}>{p.hashtags.map((h) => `#${h}`).join(' ')}</p>
          )}
          {p.callToAction && <p style={{ marginTop: 6, fontSize: 13, color: '#6b7280' }}>👉 {p.callToAction}</p>}
        </article>
      ))}
    </main>
  );
}
