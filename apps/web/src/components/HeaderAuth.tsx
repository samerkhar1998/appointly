import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { verifyJwt } from '@/lib/jwt';
import { Button } from '@/components/ui/button';

export async function HeaderAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('appointly_token')?.value;
  const user = token ? await verifyJwt(token) : null;
  const t = await getTranslations('auth');

  if (user) {
    // Logged-in: show avatar that links to dashboard
    const initial = user.email[0]?.toUpperCase() ?? '';
    return (
      <Link
        href="/dashboard"
        title={t('go_to_dashboard')}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-600 text-white text-sm font-bold
                   hover:bg-brand-700 transition-colors focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-brand-600 focus-visible:ring-offset-2 shrink-0"
      >
        {initial || <LayoutDashboard className="w-4 h-4" />}
      </Link>
    );
  }

  return (
    <Link href="/login">
      <Button size="sm" className="text-sm whitespace-nowrap">
        <span className="sm:hidden">{t('sign_in_short')}</span>
        <span className="hidden sm:inline">{t('sign_in_up')}</span>
      </Button>
    </Link>
  );
}
