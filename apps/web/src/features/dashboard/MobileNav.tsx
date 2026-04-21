'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Calendar,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  Settings,
  ShoppingBag,
  Tag,
  Users,
  UserSquare2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { useLocale, useTranslations } from 'next-intl';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LanguageToggle } from '@/components/LanguageToggle';

function isActiveRoute(pathname: string, href: string, exact = false) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const td = useTranslations('dashboard');
  const ta = useTranslations('auth');
  const tdisc = useTranslations('discovery');
  const [isOpen, setIsOpen] = useState(false);

  const { data: me } = trpc.auth.me.useQuery(undefined, { retry: false });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => router.push('/login'),
  });

  // Close drawer whenever route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const initials = me?.name
    ? me.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  const tabItems = [
    { href: '/dashboard', label: td('overview_short'), icon: LayoutDashboard, exact: true },
    { href: '/dashboard/calendar', label: td('calendar'), icon: Calendar },
    { href: '/dashboard/clients', label: td('clients'), icon: Users },
    { href: '/dashboard/staff', label: td('staff'), icon: UserSquare2 },
    { href: '/dashboard/services', label: td('services'), icon: Scissors },
  ] as const;

  const drawerItems = [
    { href: '/dashboard', label: td('overview'), icon: LayoutDashboard, exact: true },
    { href: '/dashboard/calendar', label: td('calendar'), icon: Calendar },
    { href: '/dashboard/clients', label: td('clients'), icon: Users },
    { href: '/dashboard/staff', label: td('staff'), icon: UserSquare2 },
    { href: '/dashboard/services', label: td('services'), icon: Scissors },
    { href: '/dashboard/shop', label: td('shop'), icon: ShoppingBag },
    { href: '/dashboard/promos', label: td('promos'), icon: Tag },
    { href: '/dashboard/analytics', label: td('analytics'), icon: BarChart3 },
    { href: '/dashboard/settings', label: td('settings'), icon: Settings },
    { href: '/dashboard/plan', label: td('plan'), icon: CreditCard },
  ] as const;

  return (
    <>
      {/* ── Top header bar (mobile only) ── */}
      <header
        dir="ltr"
        className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-border
                   flex items-center justify-between px-3"
      >
        {/* Spacer — keeps logo centred */}
        <div className="w-10 h-10" />

        {/* Logo icon — centre */}
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 shadow-sm">
          <Scissors className="w-4 h-4 text-white" />
        </div>

        {/* Hamburger — physical right */}
        <button
          onClick={() => setIsOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-muted
                     hover:text-foreground hover:bg-surface-elevated transition-colors
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          aria-label={tdisc('open_menu')}
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── Drawer backdrop ── */}
      <div
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
        className={cn(
          'lg:hidden fixed inset-0 z-50 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* ── Drawer panel ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tdisc('nav_menu')}
        className={cn(
          'lg:hidden fixed top-0 bottom-0 right-0 z-50 w-72 bg-white shadow-2xl flex flex-col',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Drawer header */}
        <div
          dir="ltr"
          className="flex items-center justify-between h-14 px-3 border-b border-border shrink-0"
        >
          <button
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-muted
                       hover:text-foreground hover:bg-surface-elevated transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            aria-label={tdisc('close_menu')}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600">
            <Scissors className="w-4 h-4 text-white" />
          </div>

          <div className="w-10 h-10" />
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {drawerItems.map(({ href, label, icon: Icon, ...rest }) => {
            const exact = 'exact' in rest ? rest.exact : false;
            const active = isActiveRoute(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 h-12 text-sm font-medium',
                  'transition-[background-color,color] duration-150',
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-muted hover:bg-surface-elevated hover:text-foreground',
                )}
              >
                <Icon
                  className={cn('w-5 h-5 shrink-0', active ? 'text-brand-600' : 'text-muted')}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User profile + logout */}
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex justify-center mb-3">
            <LanguageToggle currentLocale={locale} variant="drawer" />
          </div>
          <div className="flex items-center gap-3 px-1 mb-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{me?.name ?? '...'}</p>
              <p className="text-xs text-muted truncate">{me?.email ?? ''}</p>
            </div>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="w-full flex items-center gap-3 rounded-xl px-3 h-11 text-sm font-medium
                       text-red-500 hover:bg-red-50 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {ta('logout')}
          </button>
        </div>
      </div>

      {/* ── Bottom tab bar (mobile only) ── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch h-16">
          {tabItems.map(({ href, label, icon: Icon, ...rest }) => {
            const exact = 'exact' in rest ? rest.exact : false;
            const active = isActiveRoute(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px]
                           transition-colors duration-150"
              >
                <Icon
                  className={cn('w-5 h-5 shrink-0', active ? 'text-brand-600' : 'text-muted')}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium leading-none',
                    active ? 'text-brand-600' : 'text-muted',
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
