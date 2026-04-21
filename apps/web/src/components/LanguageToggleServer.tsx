import { cookies } from 'next/headers';
import { LanguageToggle } from './LanguageToggle';

const SUPPORTED_LOCALES = ['he', 'ar', 'en'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isValidLocale(value: string | undefined): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value ?? '');
}

interface Props {
  variant?: 'sidebar' | 'drawer' | 'header';
}

export async function LanguageToggleServer({ variant }: Props) {
  const cookieStore = await cookies();
  const raw = cookieStore.get('NEXT_LOCALE')?.value;
  const locale: Locale = isValidLocale(raw) ? raw : 'he';

  return <LanguageToggle currentLocale={locale} variant={variant} />;
}
