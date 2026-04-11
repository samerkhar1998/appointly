import Link from 'next/link';
import { Scissors, User } from 'lucide-react';
import { SalonSearch } from '@/features/discovery/SalonSearch';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Appointly — גלה עסקים וקבע תור',
  description: 'חפש עסקים קרובים וקבע תור בקלות',
};

// Public discovery homepage — server component.
// Renders the hero + SalonSearch client island.
export default function DiscoveryPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-600">
              <Scissors className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-foreground tracking-tight">Appointly</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/my-salons">
              <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
                <User className="h-3.5 w-3.5" />
                העסקים שלי
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="text-sm">
                כניסה לעסקים
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-medium mb-6">
          <Scissors className="h-3 w-3" />
          מאות עסקים מחכים לך
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter text-foreground leading-tight">
          גלה עסקים
          <span className="text-brand-600"> וקבע תור </span>
          בשניות
        </h1>
        <p className="mt-4 text-muted text-lg leading-relaxed max-w-md mx-auto">
          מצא סלון, מספרה, קליניקה או כל עסק — וקבע תור ישירות, ללא התקנת אפליקציה
        </p>
      </section>

      {/* Search */}
      <main className="max-w-5xl mx-auto px-4 pb-20">
        <SalonSearch />
      </main>
    </div>
  );
}
