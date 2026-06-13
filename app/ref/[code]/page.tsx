import { redirect } from 'next/navigation';

/**
 * /ref/[code] — point d'entrée d'un lien de parrainage.
 * Redirige vers l'inscription en propageant le code (prérempli + banner « 1 mois offert »).
 */
export default async function ReferralEntry({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clean = encodeURIComponent((code || '').trim().toUpperCase().slice(0, 16));
  redirect(`/register?ref=${clean}`);
}
