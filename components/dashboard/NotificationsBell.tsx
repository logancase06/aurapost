'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Bell, Check, Sparkles, Globe, CreditCard, Gift } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { markNotificationsReadAction } from '@/app/dashboard/notification-actions';

export interface NotifItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

const ICONS: Record<string, typeof Bell> = {
  posts_ready: Sparkles,
  site_activated: Globe,
  subscription_expiring: CreditCard,
  referral: Gift,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'à l’instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.round(hours / 24)} j`;
}

/** Cloche de notifications du header avec dropdown et badge non-lus. */
export default function NotificationsBell({ initial, initialUnread }: { initial: NotifItem[]; initialUnread: number }) {
  const [items, setItems] = useState(initial);
  const [unread, setUnread] = useState(initialUnread);
  const [, startTransition] = useTransition();

  function markAll() {
    setUnread(0);
    setItems((list) => list.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    startTransition(() => void markNotificationsReadAction());
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative rounded-lg p-2 text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground"
        aria-label={`Notifications${unread ? ` (${unread} non lues)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-1">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {unread > 0 && (
            <button onClick={markAll} className="flex items-center gap-1 px-2 text-xs font-medium text-primary hover:underline">
              <Check className="h-3 w-3" /> Tout lire
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">Aucune notification pour l’instant.</p>
        ) : (
          <ul className="max-h-80 overflow-auto">
            {items.map((n) => {
              const Icon = ICONS[n.type] ?? Bell;
              const content = (
                <div
                  className={cn(
                    'flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-secondary/60',
                    !n.readAt && 'bg-primary/[0.06]'
                  )}
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.href ? (
                    <Link href={n.href}>{content}</Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
