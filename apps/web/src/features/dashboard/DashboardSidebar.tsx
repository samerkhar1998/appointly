'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Calendar,
  LayoutDashboard,
  LogOut,
  Scissors,
  Settings,
  ShoppingBag,
  Tag,
  Users,
  UserSquare2,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { useLocale, useTranslations } from 'next-intl';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { LanguageToggle } from '@/components/LanguageToggle';

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const td = useTranslations('dashboard');
  const ta = useTranslations('auth');

  const navItems = [
    { href: '/dashboard', label: td('overview'), icon: LayoutDashboard, exact: true },
    { href: '/dashboard/calendar', label: td('calendar'), icon: Calendar },
    { href: '/dashboard/clients', label: td('clients'), icon: Users },
    { href: '/dashboard/staff', label: td('staff'), icon: UserSquare2 },
    { href: '/dashboard/services', label: td('services'), icon: Scissors },
    { href: '/dashboard/shop', label: td('shop'), icon: ShoppingBag },
    { href: '/dashboard/promos', label: td('promos'), icon: Tag },
    { href: '/dashboard/analytics', label: td('analytics'), icon: BarChart3 },
  ];

  const bottomItems = [
    { href: '/dashboard/settings', label: td('settings'), icon: Settings },
    { href: '/dashboard/plan', label: td('plan'), icon: CreditCard },
  ];

  const { data: me } = trpc.auth.me.useQuery(undefined, { retry: false });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => router.push('/login'),
  });

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const initials = me?.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="hidden lg:flex w-64 min-h-screen bg-white border-e border-border flex-col shadow-card shrink-0">
      {/* Brand */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 shadow-card">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tighter text-foreground">Appointly</span>
        </div>
      </div>

      <Separator />

      {/* Primary Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 h-10 text-sm font-medium',
              'transition-[background-color,color] duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
              isActive(href, exact)
                ? 'bg-brand-50 text-brand-700'
                : 'text-muted hover:bg-surface-elevated hover:text-foreground active:bg-surface-floating',
            )}
          >
            <Icon
              className={cn(
                'w-4 h-4 shrink-0',
                isActive(href, exact) ? 'text-brand-600' : 'text-muted',
              )}
            />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className="p-3 space-y-0.5">
        <Separator className="mb-3" />
        {bottomItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 h-10 text-sm font-medium',
              'transition-[background-color,color] duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
              isActive(href)
                ? 'bg-brand-50 text-brand-700'
                : 'text-muted hover:bg-surface-elevated hover:text-foreground active:bg-surface-floating',
            )}
          >
            <Icon
              className={cn('w-4 h-4 shrink-0', isActive(href) ? 'text-brand-600' : 'text-muted')}
            />
            {label}
          </Link>
        ))}

        {/* Language */}
        <Separator className="my-3" />
        <div className="flex items-center justify-center px-3 pb-1">
          <LanguageToggle currentLocale={locale} variant="sidebar" />
        </div>

        {/* User */}
        <Separator className="my-3" />
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials ?? '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{me?.name ?? '...'}</p>
            <p className="text-xs text-muted truncate">{me?.email ?? ''}</p>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            className="text-muted hover:text-red-500 transition-colors duration-150 p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 active:scale-95"
            aria-label={ta('logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
