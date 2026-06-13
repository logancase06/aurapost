import type { Session } from 'next-auth';

// Un admin plateforme = rôle 'admin' OU email listé dans ADMIN_EMAILS (séparés par des virgules).
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminSession(session: Session | null): boolean {
  if (!session?.user) return false;
  if (session.user.role === 'admin') return true;
  const email = session.user.email?.toLowerCase();
  return !!email && adminEmails().includes(email);
}
