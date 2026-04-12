'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Users, Calendar, UserMinus, Clock, CalendarOff, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSalon } from '@/lib/use-salon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageUpload } from '@/components/ui/image-upload';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/lib/use-toast';

// Formats a UTC datetime to a localised Israeli date string (dd/mm/yyyy).
function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
}

// day_of_week follows JS Date convention: 0 = Sunday … 6 = Saturday
const DAY_LABELS = ['א׳ (ראשון)', 'ב׳ (שני)', 'ג׳ (שלישי)', 'ד׳ (רביעי)', 'ה׳ (חמישי)', 'ו׳ (שישי)', 'ש׳ (שבת)'];
const DAY_SHORT  = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

const createStaffSchema = z.object({
  display_name: z.string().min(1, 'שם נדרש').max(100),
  email: z.string().email('כתובת אימייל לא תקינה'),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional().nullable(),
  is_bookable: z.boolean().default(true),
});

type CreateStaffForm = z.infer<typeof createStaffSchema>;

interface DaySchedule {
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
}

const DEFAULT_SCHEDULE: DaySchedule[] = Array.from({ length: 7 }, (_, i) => ({
  day_of_week: i,
  is_working: false,
  start_time: '09:00',
  end_time: '18:00',
}));

// Merges existing DB schedules onto the full 7-day default template.
// Returns a DaySchedule[] always containing exactly 7 entries.
function buildScheduleState(
  existing: Array<{ day_of_week: number; is_working: boolean; start_time: string; end_time: string }>,
): DaySchedule[] {
  return DEFAULT_SCHEDULE.map((def) => {
    const saved = existing.find((s) => s.day_of_week === def.day_of_week);
    return saved ? { ...saved } : { ...def };
  });
}

// Dialog for editing a single staff member's weekly working hours.
function ScheduleDialog({
  staffId,
  staffName,
  existingSchedules,
  open,
  onClose,
}: {
  staffId: string;
  staffName: string;
  existingSchedules: Array<{ day_of_week: number; is_working: boolean; start_time: string; end_time: string }>;
  open: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [days, setDays] = useState<DaySchedule[]>(() => buildScheduleState(existingSchedules));

  const scheduleMutation = trpc.staff.setSchedule.useMutation({
    onSuccess: () => {
      utils.staff.listAll.invalidate();
      toast({ title: 'שעות העבודה עודכנו' });
      onClose();
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  // Toggles the is_working flag for a specific day.
  function toggleDay(dayOfWeek: number) {
    setDays((prev) =>
      prev.map((d) => (d.day_of_week === dayOfWeek ? { ...d, is_working: !d.is_working } : d)),
    );
  }

  // Updates start_time or end_time for a specific day.
  function updateTime(dayOfWeek: number, field: 'start_time' | 'end_time', value: string) {
    setDays((prev) =>
      prev.map((d) => (d.day_of_week === dayOfWeek ? { ...d, [field]: value } : d)),
    );
  }

  // Submits the full 7-day schedule to the setSchedule procedure.
  function handleSave() {
    scheduleMutation.mutate({ staff_id: staffId, schedule: days });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>שעות עבודה — {staffName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pe-1">
          {days.map((day) => (
            <div
              key={day.day_of_week}
              className={`rounded-xl border p-3 transition-colors ${
                day.is_working ? 'border-brand/40 bg-brand/5' : 'border-border/40 bg-surface'
              }`}
            >
              {/* Day toggle row */}
              <div className="flex items-center justify-between">
                <Switch
                  checked={day.is_working}
                  onCheckedChange={() => toggleDay(day.day_of_week)}
                />
                <span className="text-sm font-medium text-foreground">
                  {DAY_LABELS[day.day_of_week]}
                </span>
              </div>

              {/* Time inputs — only shown when the day is active */}
              {day.is_working && (
                <div className="flex items-center gap-2 mt-3 justify-end">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs text-muted shrink-0">עד</Label>
                    <Input
                      type="time"
                      value={day.end_time}
                      onChange={(e) => updateTime(day.day_of_week, 'end_time', e.target.value)}
                      className="h-8 w-28 text-sm text-center"
                      dir="ltr"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs text-muted shrink-0">מ</Label>
                    <Input
                      type="time"
                      value={day.start_time}
                      onChange={(e) => updateTime(day.day_of_week, 'start_time', e.target.value)}
                      className="h-8 w-28 text-sm text-center"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={scheduleMutation.isPending} className="w-full sm:w-auto">
            {scheduleMutation.isPending ? 'שומר...' : 'שמור'}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Dialog for adding and removing days-off (blocked time ranges) for a staff member.
// Converts a local date + time in the given IANA timezone to a UTC ISO string.
// Uses the same offset logic as the server-side getTzOffsetMinutes helper.
// dateStr: "YYYY-MM-DD", timeStr: "HH:mm", timezone: IANA string
function localTimeToUtcIso(dateStr: string, timeStr: string, timezone: string): string {
  const ref = new Date(`${dateStr}T12:00:00Z`);
  const localStr = ref.toLocaleString('en-US', { timeZone: timezone, hour12: false });
  const localDate = new Date(localStr + ' UTC');
  const offsetMs = ref.getTime() - localDate.getTime();
  const localAsUtc = new Date(`${dateStr}T${timeStr}:00.000Z`).getTime();
  return new Date(localAsUtc + offsetMs).toISOString();
}

// Mini calendar for picking specific days (multi-select).
// Renders a navigable month grid; past days are disabled.
function MiniCalendar({
  selected,
  onToggle,
  minDate,
}: {
  selected: Set<string>;
  onToggle: (date: string) => void;
  minDate: string;
}) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  // Navigates the displayed month by delta (+1 or -1).
  function navigate(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDow = firstOfMonth.getDay(); // 0 = Sun

  const monthLabel = new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(firstOfMonth);
  const DAY_HEADERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  // Pads the grid with nulls before the first day and after the last.
  const cells: (number | null)[] = [
    ...Array<null>(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Returns the "YYYY-MM-DD" string for a given day number in the current view month.
  function toDateStr(day: number): string {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const isPrevDisabled = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => navigate(1)}
          className="p-1 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors text-base leading-none"
        >
          ›
        </button>
        <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={isPrevDisabled}
          className="p-1 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-base leading-none"
        >
          ‹
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="text-center text-[11px] font-medium text-muted py-1">
            {h}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const ds = toDateStr(day);
          const isPast = ds < minDate;
          const isSelected = selected.has(ds);
          return (
            <button
              key={ds}
              type="button"
              onClick={() => !isPast && onToggle(ds)}
              disabled={isPast}
              className={[
                'text-xs rounded-lg py-1.5 font-medium transition-colors w-full',
                isPast
                  ? 'text-muted/30 cursor-not-allowed'
                  : isSelected
                  ? 'bg-brand text-white'
                  : 'hover:bg-brand/10 text-foreground cursor-pointer',
              ].join(' ')}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type DaysOffMode = 'range' | 'specific';

// Dialog for managing staff days off — supports full-day or hourly blocks,
// via either a date range or individually selected days from a calendar.
function DaysOffDialog({
  staffId,
  staffName,
  salonTimezone,
  open,
  onClose,
}: {
  staffId: string;
  staffName: string;
  salonTimezone: string;
  open: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const today = new Date().toISOString().split('T')[0] as string;

  const [mode, setMode] = useState<DaysOffMode>('range');

  // Range mode state
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Specific days mode state
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());

  // Shared state
  const [fullDay, setFullDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [reason, setReason] = useState('');

  const { data: blockedTimes, isLoading } = trpc.staff.listBlockedTimes.useQuery(
    { staff_id: staffId },
    { enabled: open },
  );

  const addMutation = trpc.staff.addBlockedTime.useMutation({
    onSuccess: () => {
      utils.staff.listBlockedTimes.invalidate({ staff_id: staffId });
      toast({ title: 'ימי החופשה נוספו' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const removeMutation = trpc.staff.removeBlockedTime.useMutation({
    onSuccess: () => {
      utils.staff.listBlockedTimes.invalidate({ staff_id: staffId });
      toast({ title: 'ימי החופשה הוסרו' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  // Toggles a specific date in the selectedDays set.
  function toggleDay(ds: string) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      next.has(ds) ? next.delete(ds) : next.add(ds);
      return next;
    });
  }

  // Returns the UTC start ISO string for a given date, respecting fullDay and salonTimezone.
  function buildStart(dateStr: string): string {
    if (fullDay) return new Date(dateStr + 'T00:00:00.000Z').toISOString();
    return localTimeToUtcIso(dateStr, startTime, salonTimezone);
  }

  // Returns the UTC end ISO string for a given date, respecting fullDay and salonTimezone.
  function buildEnd(dateStr: string): string {
    if (fullDay) return new Date(dateStr + 'T23:59:59.000Z').toISOString();
    return localTimeToUtcIso(dateStr, endTime, salonTimezone);
  }

  // Submits blocked time records. Range mode creates one record spanning the full range.
  // Specific days mode creates one record per selected day.
  async function handleAdd() {
    const reasonTrimmed = reason.trim() || undefined;

    if (mode === 'range') {
      addMutation.mutate({
        staff_id: staffId,
        start_datetime: buildStart(startDate),
        end_datetime: buildEnd(endDate),
        reason: reasonTrimmed,
      });
    } else {
      const days = Array.from(selectedDays).sort();
      for (const ds of days) {
        await addMutation.mutateAsync({
          staff_id: staffId,
          start_datetime: buildStart(ds),
          end_datetime: buildEnd(ds),
          reason: reasonTrimmed,
        });
      }
      setSelectedDays(new Set());
    }

    setReason('');
  }

  // Ensures endDate never precedes startDate when startDate changes.
  function handleStartChange(value: string) {
    setStartDate(value);
    if (endDate < value) setEndDate(value);
  }

  const canAdd =
    mode === 'range'
      ? !!startDate && !!endDate
      : selectedDays.size > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ימי חופשה — {staffName}</DialogTitle>
        </DialogHeader>

        {/* Mode tabs */}
        <div className="flex rounded-xl border border-border/50 bg-surface p-1 gap-1">
          {(['range', 'specific'] as DaysOffMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={[
                'flex-1 text-sm py-1.5 rounded-lg font-medium transition-colors',
                mode === m
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted hover:text-foreground',
              ].join(' ')}
            >
              {m === 'range' ? 'טווח תאריכים' : 'ימים ספציפיים'}
            </button>
          ))}
        </div>

        {/* Add form */}
        <div className="space-y-3 rounded-xl border border-border/50 bg-surface p-4">

          {mode === 'range' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">מתאריך</Label>
                <Input
                  type="date"
                  min={today}
                  value={startDate}
                  onChange={(e) => handleStartChange(e.target.value)}
                  dir="ltr"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">עד תאריך</Label>
                <Input
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  dir="ltr"
                  className="text-sm"
                />
              </div>
            </div>
          ) : (
            <MiniCalendar selected={selectedDays} onToggle={toggleDay} minDate={today} />
          )}

          {/* Full-day toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">כל היום</span>
            <Switch checked={fullDay} onCheckedChange={setFullDay} />
          </div>

          {/* Hour range — shown only when fullDay is off */}
          {!fullDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">משעה</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  dir="ltr"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">עד שעה</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  dir="ltr"
                  className="text-sm"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">סיבה (אופציונלי)</Label>
            <Input
              placeholder="חופשה, מחלה, אחר..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
            />
          </div>

          <Button
            onClick={handleAdd}
            disabled={!canAdd || addMutation.isPending}
            className="w-full"
            size="sm"
          >
            {addMutation.isPending
              ? 'מוסיף...'
              : mode === 'specific' && selectedDays.size > 0
              ? `הוסף (${selectedDays.size} ימים)`
              : 'הוסף'}
          </Button>
        </div>

        {/* Upcoming blocked periods */}
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {isLoading ? (
            <Skeleton className="h-12 w-full rounded-xl" />
          ) : !blockedTimes?.length ? (
            <p className="text-sm text-muted text-center py-4">אין ימי חופשה קרובים</p>
          ) : (
            blockedTimes.map((bt) => (
              <div
                key={bt.id}
                className="flex items-center justify-between rounded-xl border border-border/40 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground" dir="ltr">
                    {formatDate(bt.start_datetime)}
                    {formatDate(bt.start_datetime) !== formatDate(bt.end_datetime) && (
                      <> – {formatDate(bt.end_datetime)}</>
                    )}
                  </p>
                  {!isFullDayBlock(bt.start_datetime, bt.end_datetime) && (
                    <p className="text-xs text-muted mt-0.5" dir="ltr">
                      {formatTime12(bt.start_datetime, salonTimezone)} – {formatTime12(bt.end_datetime, salonTimezone)}
                    </p>
                  )}
                  {bt.reason && <p className="text-xs text-muted mt-0.5">{bt.reason}</p>}
                </div>
                <button
                  onClick={() => removeMutation.mutate({ id: bt.id })}
                  disabled={removeMutation.isPending}
                  className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label="הסר חופשה"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Returns true if the blocked period spans an entire UTC day (00:00:00 to 23:59:59).
function isFullDayBlock(start: Date | string, end: Date | string): boolean {
  const s = new Date(start).toISOString();
  const e = new Date(end).toISOString();
  return s.endsWith('T00:00:00.000Z') && e.endsWith('T23:59:59.000Z');
}

// Formats a UTC datetime to a 12-hour local time string in the given timezone.
function formatTime12(date: Date | string, timezone: string): string {
  return new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(new Date(date));
}

export function StaffPage() {
  const { salon, isLoading: salonLoading } = useSalon();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [scheduleStaffId, setScheduleStaffId] = useState<string | null>(null);
  const [daysOffStaffId, setDaysOffStaffId] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data: staffList, isLoading } = trpc.staff.listAll.useQuery(
    { salon_id: salon?.id ?? '' },
    { enabled: !!salon?.id },
  );

  const createMutation = trpc.staff.createSimple.useMutation({
    onSuccess: () => {
      utils.staff.listAll.invalidate();
      setDialogOpen(false);
      toast({ title: 'איש צוות נוסף בהצלחה' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const updateMutation = trpc.staff.update.useMutation({
    onSuccess: () => {
      utils.staff.listAll.invalidate();
      toast({ title: 'עודכן' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const deactivateMutation = trpc.staff.deactivate.useMutation({
    onSuccess: () => {
      utils.staff.listAll.invalidate();
      setDeactivateId(null);
      toast({ title: 'איש הצוות הוסר' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const form = useForm<CreateStaffForm>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { display_name: '', email: '', avatar_url: null, is_bookable: true },
  });

  // Submits the create staff form.
  function onSubmit(values: CreateStaffForm) {
    if (!salon?.id) return;
    createMutation.mutate({
      salon_id: salon.id,
      display_name: values.display_name,
      email: values.email,
      bio: values.bio,
      is_bookable: values.is_bookable,
      ...(values.avatar_url ? { avatar_url: values.avatar_url } : {}),
    });
  }

  // Returns the first two letters of a name as initials.
  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  const scheduleStaff = scheduleStaffId ? staffList?.find((s) => s.id === scheduleStaffId) : null;
  const daysOffStaff = daysOffStaffId ? staffList?.find((s) => s.id === daysOffStaffId) : null;

  if (salonLoading || isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/50 bg-white p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-foreground">צוות</h1>
            <p className="text-sm text-muted mt-0.5">{staffList?.length ?? 0} אנשי צוות</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            הוסף עובד
          </Button>
        </div>

        {/* Staff grid */}
        {!staffList?.length ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-white py-16 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-surface mb-3">
              <Users className="h-5 w-5 text-muted" />
            </div>
            <p className="font-medium text-foreground">אין אנשי צוות עדיין</p>
            <p className="text-sm text-muted mt-1">הוסף עובד ראשון כדי להתחיל</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((staff) => {
              const isActive = staff.salon_member.is_active;
              const workingDays = staff.schedules
                .filter((s) => s.is_working)
                .map((s) => DAY_SHORT[s.day_of_week])
                .join(' ');

              return (
                <div
                  key={staff.id}
                  className={`rounded-2xl border bg-white p-5 space-y-4 shadow-card transition-opacity ${
                    isActive ? 'border-border/50' : 'border-border/30 opacity-60'
                  }`}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        {staff.avatar_url && <AvatarImage src={staff.avatar_url} alt={staff.display_name} />}
                        <AvatarFallback className="text-sm font-semibold">
                          {getInitials(staff.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{staff.display_name}</p>
                        <p className="text-xs text-muted">{staff.salon_member.user.email}</p>
                      </div>
                    </div>
                    <Badge variant={isActive ? 'success' : 'secondary'}>
                      {isActive ? 'פעיל' : 'לא פעיל'}
                    </Badge>
                  </div>

                  {/* Bio */}
                  {staff.bio && (
                    <p className="text-sm text-muted line-clamp-2">{staff.bio}</p>
                  )}

                  {/* Schedule summary */}
                  <div className="flex items-center justify-between">
                    {workingDays ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {workingDays}
                      </div>
                    ) : (
                      <span className="text-xs text-muted/60">אין שעות עבודה</span>
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setDaysOffStaffId(staff.id)}
                        className="flex items-center gap-1 text-xs text-muted hover:text-foreground hover:underline"
                        disabled={!isActive}
                      >
                        <CalendarOff className="h-3.5 w-3.5" />
                        חופשות
                      </button>
                      <button
                        onClick={() => setScheduleStaffId(staff.id)}
                        className="flex items-center gap-1 text-xs text-brand hover:underline"
                        disabled={!isActive}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        ערוך שעות
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">ניתן להזמנה</span>
                      <Switch
                        checked={staff.is_bookable}
                        onCheckedChange={(checked) =>
                          updateMutation.mutate({ staff_id: staff.id, data: { is_bookable: checked } })
                        }
                        disabled={!isActive}
                      />
                    </div>
                    {isActive && (
                      <button
                        onClick={() => setDeactivateId(staff.id)}
                        className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="הסר עובד"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add staff dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוספת עובד חדש</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Avatar upload */}
            <div className="flex items-center gap-4">
              <ImageUpload
                value={form.watch('avatar_url') ?? undefined}
                onChange={(url) => form.setValue('avatar_url', url || null)}
                folder="staff"
                aspect="square"
                label="תמונה"
                disabled={createMutation.isPending}
              />
              <p className="text-xs text-muted leading-relaxed">
                העלה תמונת פרופיל לאיש הצוות.<br />
                JPEG, PNG או WebP, עד 10 MB.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="display_name">שם תצוגה</Label>
              <Input
                id="display_name"
                placeholder="לדוגמה: יוסי כהן"
                {...form.register('display_name')}
              />
              {form.formState.errors.display_name && (
                <p className="text-xs text-red-500">{form.formState.errors.display_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">כתובת אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="yossi@example.com"
                dir="ltr"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">ביוגרפיה (אופציונלי)</Label>
              <Input id="bio" placeholder="תיאור קצר על העובד" {...form.register('bio')} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <Label htmlFor="is_bookable" className="cursor-pointer">
                ניתן להזמנה מלקוחות
              </Label>
              <Switch
                id="is_bookable"
                checked={form.watch('is_bookable')}
                onCheckedChange={(v) => form.setValue('is_bookable', v)}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
                {createMutation.isPending ? 'מוסיף...' : 'הוסף עובד'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                ביטול
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Days off dialog */}
      {daysOffStaff && (
        <DaysOffDialog
          key={daysOffStaff.id + '-daysoff'}
          staffId={daysOffStaff.id}
          staffName={daysOffStaff.display_name}
          salonTimezone={salon?.timezone ?? 'Asia/Jerusalem'}
          open={!!daysOffStaffId}
          onClose={() => setDaysOffStaffId(null)}
        />
      )}

      {/* Working hours dialog */}
      {scheduleStaff && (
        <ScheduleDialog
          key={scheduleStaff.id}
          staffId={scheduleStaff.id}
          staffName={scheduleStaff.display_name}
          existingSchedules={scheduleStaff.schedules}
          open={!!scheduleStaffId}
          onClose={() => setScheduleStaffId(null)}
        />
      )}

      {/* Confirm deactivate dialog */}
      <Dialog open={!!deactivateId} onOpenChange={() => setDeactivateId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הסרת עובד</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted">
            האם אתה בטוח שברצונך להסיר את העובד? הוא לא יוכל יותר לקבל תורים.
          </p>
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={deactivateMutation.isPending}
              onClick={() => deactivateId && deactivateMutation.mutate({ staff_id: deactivateId })}
              className="w-full sm:w-auto"
            >
              {deactivateMutation.isPending ? 'מסיר...' : 'כן, הסר'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeactivateId(null)}
              className="w-full sm:w-auto"
            >
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
