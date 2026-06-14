import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSiteEditorData } from '@/lib/db/coach-site';
import SiteEditor from './SiteEditor';

export const metadata = { title: 'Personnaliser mon site' };
// L'éditeur déclenche des Server Actions (autosave, upload) — timeout confortable.
export const maxDuration = 60;

const APP_DOMAIN = process.env.APP_DOMAIN ?? 'aurapost.fr';

export default async function SiteEditorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;

  const data = await getSiteEditorData(tenantId);
  // Pas de site (profil incomplet ou jamais généré) → retour à la page site.
  if (!data || !data.subdomain) redirect('/dashboard/website');

  return <SiteEditor initial={data} appDomain={APP_DOMAIN} />;
}
