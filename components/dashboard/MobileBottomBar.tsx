'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DASHBOARD_LINKS } from './nav-config';
import { cn } from '@/lib/utils';

// Bottom bar = 5 entrées primaires max (le reste reste accessible via le menu avatar).
const PRIMARY = ['/dashboard', '/dashboard/calendar', '/dashboard/website', '/dashboard/analytics', '/dashboard/billing'];

/*
  Navigation mobile par bottom bar (plus naturelle au pouce qu'une sidebar).
  - Visible uniquement < md (la sidebar prend le relais au-dessus).
  - Zones tactiles >= 44px, indicateur actif en glow violet.
  - safe-area iOS respectée via env(safe-area-inset-bottom).
*/
export default function MobileBottomBar({ pending = 0 }: { pending?: number }) {
  const pathname = usePathname();
  const links = PRIMARY.map((href) => DASHBOARD_LINKS.find((l) => l.href === href)).filter(
    (l): l is (typeof DASHBOARD_LINKS)[number] => Boolean(l)
  );

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {links.map((l) => {
          const isActive = pathname === l.href || (l.href !== '/dashboard' && pathname.startsWith(l.href));
          return (
            <li key={l.href} className="flex-1">
              <Link
                href={l.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors duration-150',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {isActive && (
                  <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-gradient-to-r from-primary to-accent shadow-[0_0_12px_hsl(262_83%_58%)]" />
                )}
                <span className="relative">
                  <l.icon className="h-5 w-5" />
                  {l.badge && pending > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                      {pending}
                    </span>
                  )}
                </span>
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
