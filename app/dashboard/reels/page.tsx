import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { canExportPost } from '@/lib/plans';
import ReelsClient from './ReelsClient';

export const metadata = { title: 'Script Reels' };

export default async function ReelsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const canExport = canExportPost(session.user.plan ?? 'starter');
  return <ReelsClient canExport={canExport} />;
}
