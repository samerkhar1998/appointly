import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string, currency = 'ILS') {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency }).format(Number(amount));
}

export function formatDate(date: Date | string, locale = 'he-IL') {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(date));
}

export function formatTime(date: Date | string, timezone: string, locale = 'he-IL') {
  return new Intl.DateTimeFormat(locale, {
    timeStyle: 'short',
    timeZone: timezone,
  }).format(new Date(date));
}
