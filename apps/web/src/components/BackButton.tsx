'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

// Shows a ← home link on every page except the root. Since the header is
// always dir="ltr", ChevronLeft is the correct "back" direction universally.
export function BackButton() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  return (
    <Link
      href="/"
      className="flex items-center justify-center w-8 h-8 rounded-lg text-muted
                 hover:text-foreground hover:bg-surface-elevated transition-colors
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 shrink-0"
      aria-label="Back to home"
    >
      <ChevronLeft className="w-4 h-4" />
    </Link>
  );
}
