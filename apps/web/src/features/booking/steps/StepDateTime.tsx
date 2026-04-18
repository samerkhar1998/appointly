'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAppointmentEvents } from '@/lib/use-appointment-events';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import { he } from 'date-fns/locale';

interface Slot {
  start: string;
  end: string;
  staff_id: string;
}

interface Props {
  salonId: string;
  serviceId: string;
  staffId: string | null;
  timezone: string;
  onSelect: (slot: Slot) => void;
  onBack: () => void;
}

const NUM_DAYS = 14;

function formatLocalTime(isoUtc: string, timezone: string) {
  return new Intl.DateTimeFormat('he-IL', {
    timeStyle: 'short',
    timeZone: timezone,
  }).format(new Date(isoUtc));
}

export function StepDateTime({ salonId, serviceId, staffId, timezone, onSelect, onBack }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [weekOffset, setWeekOffset] = useState(0);
  const utils = trpc.useUtils();

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data, isLoading } = trpc.availability.getSlots.useQuery({
    salon_id: salonId,
    service_id: serviceId,
    staff_id: staffId,
    date: dateStr,
  });

  // Re-fetch available slots whenever another booking is made for this salon,
  // so taken slots disappear from the picker in real time.
  useAppointmentEvents(salonId, () => {
    void utils.availability.getSlots.invalidate();
  });

  // Build day strip (14 days from today, paginated by 7)
  const allDays = Array.from({ length: NUM_DAYS }, (_, i) => addDays(new Date(), i));
  const visibleDays = allDays.slice(weekOffset * 7, weekOffset * 7 + 7);
  const canGoBack = weekOffset > 0;
  const canGoForward = (weekOffset + 1) * 7 < NUM_DAYS;

  const weekdayFmt = (d: Date) =>
    new Intl.DateTimeFormat('he-IL', { weekday: 'short' }).format(d);
  const dayNumFmt = (d: Date) =>
    new Intl.DateTimeFormat('he-IL', { day: 'numeric' }).format(d);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-250">
      <div>
        <h2 className="text-xl font-bold tracking-tighter text-foreground">בחר מועד</h2>
        <p className="text-sm text-muted mt-1">מתי תרצה להגיע?</p>
      </div>

      {/* Day picker */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
            disabled={!canGoBack}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            aria-label="שבוע קודם"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <p className="text-sm font-semibold text-foreground">
            {new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(visibleDays[0] ?? new Date())}
          </p>
          <button
            onClick={() => setWeekOffset((w) => (canGoForward ? w + 1 : w))}
            disabled={!canGoForward}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            aria-label="שבוע הבא"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {visibleDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(startOfDay(day))}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 rounded-xl transition-[background-color,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 active:scale-95',
                  isSelected
                    ? 'bg-brand-600 text-white shadow-card'
                    : 'hover:bg-surface-elevated text-foreground',
                )}
              >
                <span className={cn('text-[10px]', isSelected ? 'text-brand-200' : 'text-muted')}>
                  {weekdayFmt(day)}
                </span>
                <span
                  className={cn(
                    'text-sm font-bold',
                    isToday && !isSelected ? 'text-brand-600' : '',
                  )}
                >
                  {dayNumFmt(day)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">
          שעות פנויות —{' '}
          {new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }).format(selectedDate)}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {[...Array(9)].map((_, i) => (
              <Skeleton key={i} className="h-11 rounded-xl" />
            ))}
          </div>
        ) : !data?.slots.length ? (
          <div className="py-10 text-center text-muted text-sm bg-white rounded-2xl border border-border">
            אין זמינות ביום זה
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {data.slots.map((slot, i) => (
              <button
                key={i}
                onClick={() => onSelect(slot)}
                className={cn(
                  'h-11 rounded-xl text-sm font-semibold border tabular-nums',
                  'transition-[background-color,border-color,transform,box-shadow] duration-150',
                  'bg-white border-border text-foreground',
                  'hover:bg-brand-50 hover:border-brand-400 hover:text-brand-700 hover:shadow-card',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
                  'active:scale-95 active:bg-brand-100',
                )}
              >
                {formatLocalTime(slot.start, timezone)}
              </button>
            ))}
          </div>
        )}
      </div>

      <Button variant="outline" onClick={onBack} className="w-full">
        חזרה
      </Button>
    </div>
  );
}
