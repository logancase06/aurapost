import { LayoutDashboard, Globe, Compass, BarChart3, History, CreditCard, CalendarDays, Gift, Settings, User, Sparkles, Share2, Hash, UserRound, Mail, Video, MessageSquareText, Clapperboard, Captions, LayoutGrid, type LucideIcon } from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: boolean;
}

export const DASHBOARD_LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Posts', icon: LayoutDashboard, badge: true },
  { href: '/dashboard/profile', label: 'Mon profil', icon: User },
  { href: '/dashboard/analyze', label: 'Analyse profil', icon: Sparkles },
  { href: '/dashboard/hashtags', label: 'Hashtags', icon: Hash },
  { href: '/dashboard/newsletter', label: 'Newsletter', icon: Mail },
  { href: '/dashboard/reels', label: 'Script Reels', icon: Video },
  { href: '/dashboard/threads', label: 'Fil Twitter/X', icon: MessageSquareText },
  { href: '/dashboard/scripts', label: 'Scripts vidéo', icon: Clapperboard },
  { href: '/dashboard/subtitles', label: 'Sous-titres', icon: Captions },
  { href: '/dashboard/carousels', label: 'Carrousels', icon: LayoutGrid },
  { href: '/dashboard/calendar', label: 'Calendrier', icon: CalendarDays },
  { href: '/dashboard/website', label: 'Mon site', icon: Globe },
  { href: '/dashboard/leads', label: 'Leads', icon: UserRound },
  { href: '/dashboard/website/explore', label: 'Explorer des styles', icon: Compass },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/referral', label: 'Parrainage', icon: Gift },
  { href: '/dashboard/history', label: 'Historique', icon: History },
  { href: '/dashboard/billing', label: 'Abonnement', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
];

// Entrée conditionnelle — visible uniquement si socialPublishEnabled (pack_complet).
// Passée via showSocial dans DashboardShell → SidebarNav, comme showAdmin.
export const SOCIAL_LINK: NavLink = { href: '/dashboard/social', label: 'Mes réseaux', icon: Share2 };

// Section "Création vidéo & visuels" — toujours visible (gating par page).
export const VIDEO_SECTION_LABEL = 'Création vidéo & visuels';
export const VIDEO_LINKS: NavLink[] = [
  { href: '/dashboard/scripts', label: 'Scripts vidéo', icon: Clapperboard },
  { href: '/dashboard/subtitles', label: 'Sous-titres', icon: Captions },
  { href: '/dashboard/carousels', label: 'Carrousels', icon: LayoutGrid },
];
