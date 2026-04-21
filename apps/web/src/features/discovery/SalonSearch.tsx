'use client';

import { useState, useRef } from 'react';
import { Search, X, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SalonCard } from './SalonCard';

const PER_PAGE = 12;

function useDebounce(delay = 400) {
  const [value, setValue] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function set(raw: string) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setValue(raw), delay);
  }

  return { debouncedValue: value, set };
}

export function SalonSearch() {
  const t = useTranslations('discovery');
  const tc = useTranslations('common');

  const [rawQuery, setRawQuery] = useState('');
  const [page, setPage] = useState(1);

  const { debouncedValue: query, set: setDebouncedQuery } = useDebounce(400);

  function handleQueryChange(val: string) {
    setRawQuery(val);
    setPage(1);
    setDebouncedQuery(val);
  }

  const { data, isLoading, isError } = trpc.salons.search.useQuery({
    query: query || undefined,
    page,
    per_page: PER_PAGE,
  });

  const totalPages = data ? Math.ceil(data.total / PER_PAGE) : 1;

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        <Input
          value={rawQuery}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={t('search_placeholder')}
          className="ps-10 h-11 rounded-xl text-base"
          autoComplete="off"
        />
        {rawQuery && (
          <button
            onClick={() => handleQueryChange('')}
            className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
            aria-label={t('clear_search')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-border/50">
              <Skeleton className="h-36 w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-8 w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-muted">{t('error')}</p>
        </div>
      ) : !data?.items.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-elevated mb-4">
            <Building2 className="h-6 w-6 text-muted" />
          </div>
          <p className="font-semibold text-foreground">
            {query ? t('no_results_title') : t('no_businesses_title')}
          </p>
          <p className="text-sm text-muted mt-1">
            {query ? t('no_results_for_query', { query }) : t('coming_soon')}
          </p>
          {query && (
            <button
              onClick={() => handleQueryChange('')}
              className="mt-3 text-sm text-brand-600 hover:text-brand-700 underline underline-offset-2"
            >
              {t('show_all')}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((salon) => (
              <SalonCard
                key={salon.id}
                slug={salon.slug}
                name={salon.name}
                description={salon.description}
                city={salon.city}
                logo_url={salon.logo_url}
                cover_url={salon.cover_url}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {tc('prev')}
              </Button>
              <span className="text-sm text-muted tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                {tc('next')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
