// Force le rendu dynamique sur toutes les routes /dashboard/* :
// auth() appelle headers() en interne — sans ce flag Next.js 16 tente
// un prerender statique qui echoue avec "headers() outside request scope".
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
