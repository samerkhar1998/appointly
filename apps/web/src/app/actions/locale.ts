'use server';

import { cookies } from 'next/headers';

const SUPPORTED_LOCALES = ['he', 'ar', 'en'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isValidLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export async function setLocale(locale: string) {
  if (!isValidLocale(locale)) return;
  (await cookies()).set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
  });
}
