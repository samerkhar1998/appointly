import { Scissors } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { SalonSearch } from '@/features/discovery/SalonSearch';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Appointly — גלה עסקים וקבע תור',
  description: 'חפש עסקים קרובים וקבע תור בקלות',
};

export default async function DiscoveryPage() {
  const t = await getTranslations('discovery');

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-12 sm:pt-16 pb-8 sm:pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-medium mb-5">
          <Scissors className="h-3 w-3 shrink-0" />
          <span>{t('badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-foreground leading-tight">
          {t('hero_title_1')}
          <span className="text-brand-600"> {t('hero_title_accent')} </span>
          {t('hero_title_2')}
        </h1>
        <p className="mt-3 sm:mt-4 text-muted text-base sm:text-lg leading-relaxed max-w-sm sm:max-w-md mx-auto">
          {t('hero_subtitle')}
        </p>
      </section>

      {/* Search + Results */}
      <main className="max-w-5xl mx-auto px-3 sm:px-4 pb-20">
        <SalonSearch />
      </main>
    </div>
  );
}
