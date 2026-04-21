'use client';

import { useTransition, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setLocale } from '@/app/actions/locale';

const LOCALES = [
  { code: 'he', label: 'עברית' },
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
] as const;

const LOCALE_SHORT: Record<string, string> = { he: 'עב', ar: 'عر', en: 'EN' };

interface LanguageToggleProps {
  currentLocale: string;
  variant?: 'sidebar' | 'drawer' | 'header';
}

export function LanguageToggle({ currentLocale, variant = 'sidebar' }: LanguageToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  function handleChange(locale: string) {
    if (locale === currentLocale) {
      setOpen(false);
      return;
    }
    setOpen(false);
    startTransition(() => {
      void setLocale(locale).then(() => router.refresh());
    });
  }

  return (
    // dir="ltr" keeps the dropdown anchored consistently regardless of page direction
    <div ref={containerRef} className="relative" dir="ltr">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold',
          'border border-border bg-white shadow-sm',
          'hover:bg-surface-elevated transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
          'disabled:opacity-50',
          variant === 'drawer' && 'w-full justify-center',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="h-3.5 w-3.5 text-muted shrink-0" />
        <span className="text-foreground">{LOCALE_SHORT[currentLocale] ?? currentLocale.toUpperCase()}</span>
        <ChevronDown
          className={cn('h-3 w-3 text-muted transition-transform duration-150', open && 'rotate-180')}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className={cn(
            'absolute z-50 w-36 rounded-xl border border-border bg-white shadow-elevated py-1',
            variant === 'sidebar' || variant === 'drawer'
              ? 'bottom-full mb-1.5 left-0'   // opens upward in sidebar/drawer
              : 'top-full mt-1.5 left-0',     // opens downward in header
          )}
        >
          {LOCALES.map(({ code, label }) => (
            <li key={code}>
              <button
                role="option"
                aria-selected={currentLocale === code}
                onClick={() => handleChange(code)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-sm',
                  'hover:bg-surface-elevated transition-colors duration-100',
                  'focus-visible:outline-none focus-visible:bg-surface-elevated',
                  currentLocale === code ? 'text-brand-700 font-semibold' : 'text-foreground',
                )}
              >
                <span>{label}</span>
                {currentLocale === code && <Check className="h-3.5 w-3.5 text-brand-600 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
