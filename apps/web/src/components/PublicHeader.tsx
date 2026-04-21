import Link from 'next/link';
import { Scissors } from 'lucide-react';
import { LanguageToggleServer } from './LanguageToggleServer';
import { HeaderAuth } from './HeaderAuth';
import { BackButton } from './BackButton';

// Shared sticky top nav used on all public and auth pages.
// dir="ltr" keeps logo-left / actions-right regardless of page locale.
export function PublicHeader() {
  return (
    <header
      dir="ltr"
      className="border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-30"
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
        {/* Left: back button + logo */}
        <div className="flex items-center gap-1 shrink-0">
          <BackButton />
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-600">
              <Scissors className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="hidden sm:block font-bold text-foreground tracking-tight">
              Appointly
            </span>
          </Link>
        </div>

        {/* Right: language + auth */}
        <div className="flex items-center gap-2 shrink-0">
          <LanguageToggleServer variant="header" />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
