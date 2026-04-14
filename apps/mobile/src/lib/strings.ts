/**
 * Locale-aware translation helper.
 *
 * Detects the device language via expo-localization and returns the matching
 * string from the appropriate locale catalogue. Falls back to Hebrew (he) for
 * any key not found in the active catalogue.
 *
 * Usage:  import { t } from '@/lib/strings';
 *         t('back')  →  'חזור' | 'رجوع' | 'Back'
 */
import * as Localization from 'expo-localization';
import { he } from './i18n/he';
import { ar } from './i18n/ar';
import { en } from './i18n/en';

export type StringKey = keyof typeof he;

// Read locale once at module load — same lifetime as the JS bundle.
const languageCode = Localization.getLocales()[0]?.languageCode ?? 'he';

function getStrings(): Record<StringKey, string> {
  // This app targets the Israeli market — default to Hebrew for all locales
  // except Arabic (which is also RTL and has full translations).
  if (languageCode === 'ar') return ar;
  return he;
}

const strings = getStrings();

/** Returns the translated string for the given key in the active locale. */
export function t(key: StringKey): string {
  return strings[key] ?? he[key];
}

/** The active language code ('he' | 'ar' | 'en' | …). */
export const locale = languageCode;

/** Always RTL — the app targets the Israeli market. */
export const isRTL = true;
