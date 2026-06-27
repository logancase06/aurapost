'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Menu, LogOut, User } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import SidebarNav from './SidebarNav';
import NotificationsBell, { type NotifItem } from './NotificationsBell';

export default function Topbar({
  active,
  pending,
  showAdmin,
  showSocial = false,
  name,
  email,
  notifications = [],
  unread = 0,
}: {
  active?: string;
  pending: number;
  showAdmin: boolean;
  showSocial?: boolean;
  name: string;
  email: string;
  notifications?: NotifItem[];
  unread?: number;
}) {
  const [open, setOpen] = useState(false);
  const initial = (name || email || '?').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-8">
      {/* Mobile : ouvre la sidebar dans un Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary md:hidden">
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-5">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav active={active} pending={pending} showAdmin={showAdmin} showSocial={showSocial} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      <NotificationsBell initial={notifications} initialUnread={unread} />

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none transition-opacity hover:opacity-90">
          <Avatar>
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col">
              <span className="font-semibold">{name}</span>
              <span className="text-xs text-muted-foreground">{email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/onboarding">
              <User className="h-4 w-4" /> Profil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })} className="text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" /> Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
