import { auth } from '@/lib/auth';
import { isAdminSession } from '@/lib/admin';
import { pendingApprovalCount } from '@/lib/db/analytics';
import { listNotifications, unreadCount } from '@/lib/db/notifications';
import SidebarNav from '@/components/dashboard/SidebarNav';
import Topbar from '@/components/dashboard/Topbar';
import MobileBottomBar from '@/components/dashboard/MobileBottomBar';

// Shell du dashboard : sidebar fixe (desktop) + Sheet (mobile) + header avatar.
export default async function DashboardShell({
  active,
  children,
}: {
  active?: string;
  children: React.ReactNode;
}) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ?? null;
  const pending = tenantId ? await pendingApprovalCount(tenantId) : 0;
  const showAdmin = isAdminSession(session);
  const [notifications, unread] = tenantId
    ? await Promise.all([listNotifications(tenantId), unreadCount(tenantId)])
    : [[], 0];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar fixe (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-card/40 p-5 md:block">
        <SidebarNav active={active} pending={pending} showAdmin={showAdmin} />
      </aside>

      <div className="md:pl-64">
        <Topbar
          active={active}
          pending={pending}
          showAdmin={showAdmin}
          name={session?.user?.name ?? 'Coach'}
          email={session?.user?.email ?? ''}
          notifications={notifications}
          unread={unread}
        />
        <main id="main-content" className="px-4 py-8 pb-24 md:px-8 md:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom bar mobile (remplace la sidebar sur smartphone) */}
      <MobileBottomBar pending={pending} />
    </div>
  );
}
