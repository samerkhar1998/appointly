import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import './globals.css';

import { Providers } from '@/components/providers';
import BugReportButton from '@/components/BugReportButton';

const heebo = Heebo({
  subsets: ['latin', 'hebrew'],
  variable: '--font-heebo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Appointly',
    template: '%s | Appointly',
  },
  description: 'פלטפורמת קביעת תורים לסלונים',
};

const SUPPORTED_LOCALES = ['he', 'ar', 'en'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isValidLocale(value: string | undefined): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value ?? '');
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const raw = cookieStore.get('NEXT_LOCALE')?.value;
  const locale: Locale = isValidLocale(raw) ? raw : 'he';
  const dir = locale === 'en' ? 'ltr' : 'rtl';

  const messages = (
    (await import(`../../messages/${locale}.json`)) as { default: Record<string, string> }
  ).default;

  return (
    <html lang={locale} dir={dir} className={heebo.variable}>
      <body className="bg-background text-foreground font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            {children}
            <BugReportButton />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
