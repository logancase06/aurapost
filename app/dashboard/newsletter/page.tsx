import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import NewsletterClient from './NewsletterClient';

export const metadata = { title: 'Newsletter — AuraPost' };
export const maxDuration = 60;

export default async function NewsletterPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  return <NewsletterClient />;
}
