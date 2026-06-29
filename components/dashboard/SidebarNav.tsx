import Link from 'next/link';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { DASHBOARD_LINKS, SOCIAL_LINK, VIDEO_LINKS, VIDEO_SECTION_LABEL } from './nav-config';
import { cn } from '@/lib/utils';

// Navigation présentationnelle (sans hooks) — utilisable côté serveur ET dans le Sheet mobile.
export default function SidebarNav({
  active,
  pending = 0,
  showAdmin = false,
  showSocial = false,
  onNavigate,
}: {
  active?: string;
  pending?: number;
  showAdmin?: boolean;
  showSocial?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2 px-2 py-1 text-lg font-bold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
          <Sparkles className="h-4 w-4 text-white" />
        </span>
        AuraPost
      </Link>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {DASHBOARD_LINKS.map((l) => {
          const isActive = active === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-primary/15 text-primary shadow-[0_0_20px_-6px_hsl(262_83%_58%_/_0.6)]'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground hover:shadow-[0_0_18px_-8px_hsl(262_83%_58%_/_0.7)]'
              )}
            >
              <l.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{l.label}</span>
              {l.badge && pending > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {pending}
                </span>
              )}
            </Link>
          );
        })}

        {showSocial && (
          <Link
            key={SOCIAL_LINK.href}
            href={SOCIAL_LINK.href}
            onClick={onNavigate}
            className={cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150',
              active === SOCIAL_LINK.href
                ? 'bg-primary/15 text-primary shadow-[0_0_20px_-6px_hsl(262_83%_58%_/_0.6)]'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground hover:shadow-[0_0_18px_-8px_hsl(262_83%_58%_/_0.7)]'
            )}
          >
            <SOCIAL_LINK.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{SOCIAL_LINK.label}</span>
          </Link>
        )}

        <p className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {VIDEO_SECTION_LABEL}
        </p>
        {VIDEO_LINKS.map((l) => {
          const isActive = active === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-primary/15 text-primary shadow-[0_0_20px_-6px_hsl(262_83%_58%_/_0.6)]'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground hover:shadow-[0_0_18px_-8px_hsl(262_83%_58%_/_0.7)]'
              )}
            >
              <l.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{l.label}</span>
            </Link>
          );
        })}

        {showAdmin && (
          <Link
            href="/admin"
            onClick={onNavigate}
            className={cn(
              'mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              active === '/admin' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" /> Admin
          </Link>
        )}
      </nav>
    </div>
  );
}
