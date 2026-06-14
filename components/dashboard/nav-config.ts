import { LayoutDashboard, Globe, BarChart3, History, CreditCard, CalendarDays, Gift, Settings, User, type LucideIcon } from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: boolean;
}

export const DASHBOARD_LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Posts', icon: LayoutDashboard, badge: true },
  { href: '/dashboard/profile', label: 'Mon profil', icon: User },
  { href: '/dashboard/calendar', label: 'Calendrier', icon: CalendarDays },
  { href: '/dashboard/website', label: 'Mon site', icon: Globe },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/referral', label: 'Parrainage', icon: Gift },
  { href: '/dashboard/history', label: 'Historique', icon: History },
  { href: '/dashboard/billing', label: 'Abonnement', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
];
