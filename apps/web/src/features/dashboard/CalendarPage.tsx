'use client';

import { useCallback, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DatesSetArg, EventContentArg } from '@fullcalendar/core';
import heLocale from '@fullcalendar/core/locales/he';
import { ChevronLeft, ChevronRight, Clock, Scissors, User } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSalon } from '@/lib/use-salon';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Phone } from 'lucide-react';
import { toast } from '@/lib/use-toast';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';

interface AppointmentEvent {
  id: string;
  customer_name: string;
  customer_phone: string;
  start_datetime: Date | string;
  end_datetime: Date | string;
  status: AppointmentStatus;
  service: { id: string; name: string; duration_mins: number } | null;
  staff: { id: string; display_name: string } | null;
  salon_client: { id: string; name: string; phone: string } | null;
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: '#F59E0B',
  CONFIRMED: '#7C3AED',
  COMPLETED: '#10B981',
  NO_SHOW: '#6B7280',
  CANCELLED: '#EF4444',
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: 'ממתין',
  CONFIRMED: 'מאושר',
  COMPLETED: 'הושלם',
  NO_SHOW: 'לא הגיע',
  CANCELLED: 'בוטל',
};

// Mobile status badge colours
const STATUS_BADGE_CLASS: Record<AppointmentStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-brand-50 text-brand-700 border-brand-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  NO_SHOW: 'bg-gray-50 text-gray-600 border-gray-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

function formatTime(date: Date | string) {
  return new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(date),
  );
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ── Mobile Day View ──────────────────────────────────────────────────────────

function MobileDayView({
  salonId,
  selectedEvent,
  onSelectEvent,
}: {
  salonId: string;
  selectedEvent: AppointmentEvent | null;
  onSelectEvent: (e: AppointmentEvent | null) => void;
}) {
  const [day, setDay] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const from = new Date(day);
  from.setHours(0, 0, 0, 0);
  const to = new Date(day);
  to.setHours(23, 59, 59, 999);

  const { data: appointments, isLoading } = trpc.appointments.listForCalendar.useQuery(
    {
      salon_id: salonId,
      date_from: from.toISOString(),
      date_to: to.toISOString(),
    },
    { enabled: !!salonId },
  );

  const sorted = [...(appointments ?? [])].sort(
    (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime(),
  );

  const isToday = isSameDay(day, new Date());

  return (
    <div className="space-y-4">
      {/* Date navigation
          RTL note: in dir="rtl" flex, first DOM child = visual RIGHT.
          Convention: visual RIGHT = previous (older), visual LEFT = next (newer).
      */}
      <div className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-border/50 px-4 py-3 shadow-sm">
        {/* Previous — visual RIGHT in RTL (first in DOM) */}
        <button
          onClick={() => setDay((d) => addDays(d, -1))}
          className="p-2 rounded-lg hover:bg-surface-elevated text-muted hover:text-foreground transition-colors"
          aria-label="יום קודם"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="text-center flex-1">
          <p className="text-base font-bold text-foreground tracking-tight">{formatDayLabel(day)}</p>
          {isToday && (
            <p className="text-xs text-brand-600 font-medium mt-0.5">היום</p>
          )}
        </div>

        {/* Next — visual LEFT in RTL (last in DOM) */}
        <button
          onClick={() => setDay((d) => addDays(d, 1))}
          className="p-2 rounded-lg hover:bg-surface-elevated text-muted hover:text-foreground transition-colors"
          aria-label="יום הבא"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Today button */}
      {!isToday && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            setDay(d);
          }}
          className="w-full"
        >
          חזור להיום
        </Button>
      )}

      {/* Appointment timeline */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-muted text-sm font-medium">אין תורים ביום זה</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((appt) => {
            const status = appt.status as AppointmentStatus;
            return (
              <button
                key={appt.id}
                onClick={() => onSelectEvent(appt as AppointmentEvent)}
                className="w-full text-start bg-white rounded-xl border border-border/50 shadow-sm p-4
                           hover:shadow-card hover:border-brand-200 transition-all duration-150 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {appt.customer_name}
                    </p>
                    {appt.service && (
                      <p className="text-xs text-muted truncate">{appt.service.name}</p>
                    )}
                    {appt.staff && (
                      <p className="text-xs text-muted truncate">{appt.staff.display_name}</p>
                    )}
                  </div>
                  <div className="text-end shrink-0 space-y-1.5">
                    <p className="text-sm font-bold text-foreground tabular-nums">
                      {formatTime(appt.start_datetime)}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE_CLASS[status]}`}
                    >
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                </div>
                {/* Time bar accent */}
                <div
                  className="mt-3 h-0.5 rounded-full opacity-50"
                  style={{ backgroundColor: STATUS_COLORS[status] }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main CalendarPage ────────────────────────────────────────────────────────

export function CalendarPage() {
  const { salon, isLoading: salonLoading } = useSalon();
  const calendarRef = useRef<FullCalendar | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AppointmentEvent | null>(null);
  const utils = trpc.useUtils();

  const { data: appointments, isLoading: apptLoading } = trpc.appointments.listForCalendar.useQuery(
    {
      salon_id: salon?.id ?? '',
      date_from: dateRange?.from ?? new Date().toISOString(),
      date_to: dateRange?.to ?? new Date().toISOString(),
    },
    { enabled: !!salon?.id && !!dateRange },
  );

  const updateStatusMutation = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => {
      utils.appointments.listForCalendar.invalidate();
      setSelectedEvent(null);
      toast({ title: 'סטטוס עודכן' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setDateRange({ from: arg.startStr, to: arg.endStr });
  }, []);

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const appt = appointments?.find((a) => a.id === arg.event.id);
      if (appt) setSelectedEvent(appt as AppointmentEvent);
    },
    [appointments],
  );

  const calendarEvents = (appointments ?? []).map((appt) => ({
    id: appt.id,
    title: appt.customer_name,
    start: new Date(appt.start_datetime),
    end: new Date(appt.end_datetime),
    backgroundColor: STATUS_COLORS[appt.status as AppointmentStatus],
    borderColor: STATUS_COLORS[appt.status as AppointmentStatus],
    extendedProps: { status: appt.status, service: appt.service?.name },
  }));

  if (salonLoading) {
    return <Skeleton className="h-[600px] w-full rounded-2xl" />;
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-foreground">יומן</h1>
          <p className="text-sm text-muted mt-0.5">כל התורים לפי תצוגת לוח שנה</p>
        </div>

        {/* Legend — desktop only */}
        <div className="hidden lg:flex flex-wrap gap-3">
          {(Object.entries(STATUS_LABELS) as [AppointmentStatus, string][]).map(([status, label]) => (
            <span key={status} className="inline-flex items-center gap-1.5 text-xs text-muted">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[status] }}
              />
              {label}
            </span>
          ))}
        </div>

        {/* ── Mobile day view ── */}
        <div className="lg:hidden">
          <MobileDayView
            salonId={salon?.id ?? ''}
            selectedEvent={selectedEvent}
            onSelectEvent={setSelectedEvent}
          />
        </div>

        {/* ── Desktop FullCalendar ── */}
        <div className="hidden lg:block rounded-2xl border border-border/50 bg-white shadow-card overflow-hidden p-1">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={heLocale}
            direction="rtl"
            headerToolbar={{
              start: 'prev,next today',
              center: 'title',
              end: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            buttonText={{
              today: 'היום',
              month: 'חודש',
              week: 'שבוע',
              day: 'יום',
            }}
            events={calendarEvents}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            slotMinTime="07:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            nowIndicator
            height="auto"
            contentHeight={620}
            loading={(isLoading) => {
              if (isLoading || apptLoading) return;
            }}
            eventContent={(arg: EventContentArg) => (
              <div className="px-1 py-0.5 overflow-hidden h-full">
                <p className="text-xs font-semibold truncate text-white leading-tight">
                  {arg.event.title}
                </p>
                {arg.event.extendedProps['service'] && (
                  <p className="text-[10px] text-white/80 truncate">
                    {arg.event.extendedProps['service']}
                  </p>
                )}
              </div>
            )}
          />
        </div>
      </div>

      {/* Appointment detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  {selectedEvent.customer_name}
                  <Badge
                    style={{
                      backgroundColor: STATUS_COLORS[selectedEvent.status] + '20',
                      color: STATUS_COLORS[selectedEvent.status],
                      borderColor: STATUS_COLORS[selectedEvent.status] + '40',
                    }}
                    variant="outline"
                  >
                    {STATUS_LABELS[selectedEvent.status]}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>
                    {formatTime(selectedEvent.start_datetime)} —{' '}
                    {formatTime(selectedEvent.end_datetime)}
                  </span>
                </div>
                {selectedEvent.service && (
                  <div className="flex items-center gap-2 text-muted">
                    <Scissors className="h-4 w-4 shrink-0" />
                    <span>{selectedEvent.service.name}</span>
                  </div>
                )}
                {selectedEvent.staff && (
                  <div className="flex items-center gap-2 text-muted">
                    <User className="h-4 w-4 shrink-0" />
                    <span>{selectedEvent.staff.display_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted" dir="ltr">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{selectedEvent.customer_phone}</span>
                </div>
              </div>

              {selectedEvent.status === 'PENDING' && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        appointment_id: selectedEvent.id,
                        status: 'CONFIRMED',
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    אשר תור
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        appointment_id: selectedEvent.id,
                        status: 'CANCELLED',
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    בטל תור
                  </Button>
                </div>
              )}
              {selectedEvent.status === 'CONFIRMED' && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        appointment_id: selectedEvent.id,
                        status: 'COMPLETED',
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    סמן כהושלם
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-muted"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        appointment_id: selectedEvent.id,
                        status: 'NO_SHOW',
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    לא הגיע
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
