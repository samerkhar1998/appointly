'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MessageCircle, Clock, Settings2, Store, Globe, Lock, Copy, Check, Link as LinkIcon, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSalon } from '@/lib/use-salon';
import { ImageUpload } from '@/components/ui/image-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/lib/use-toast';

// ─── Local form schemas ───────────────────────────────────────────────────────

const infoSchema = z.object({
  name: z.string().min(1, 'שם הסלון נדרש').max(100),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  logo_url: z.string().url().optional().nullable(),
  cover_url: z.string().url().optional().nullable(),
});

const bookingSchema = z.object({
  confirmation_mode: z.enum(['MANUAL', 'AUTO']),
  cancellation_method: z.enum(['MAGIC_LINK', 'PHONE_OTP']),
  cancellation_window_hours: z.coerce.number().int().min(0).max(168),
  booking_slot_interval_mins: z.coerce
    .number()
    .int()
    .refine((v) => [10, 15, 20, 30].includes(v), { message: 'בחר 10, 15, 20 או 30 דקות' }),
  buffer_after_mins: z.coerce.number().int().min(0).max(120),
});

const waSchema = z.object({
  wa_phone_number: z.string().max(20).optional(),
  wa_confirmation_template: z.string().max(1000).optional(),
  wa_reminder_template: z.string().max(1000).optional(),
  wa_post_visit_template: z.string().max(1000).optional(),
});

type InfoForm = z.infer<typeof infoSchema>;
type BookingForm = z.infer<typeof bookingSchema>;
type WaForm = z.infer<typeof waSchema>;

// ─── Days ─────────────────────────────────────────────────────────────────────

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

interface DayHour {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

function defaultHours(): DayHour[] {
  return Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    open_time: '09:00',
    close_time: '18:00',
    is_closed: i === 6, // Saturday closed by default
  }));
}

// ─── WhatsApp preview ─────────────────────────────────────────────────────────

const WA_SAMPLE: Record<string, string> = {
  '{{customer_name}}': 'יוסי כהן',
  '{{service_name}}': 'עיצוב שיער',
  '{{staff_name}}': 'מירי לוי',
  '{{date}}': new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(),
  ),
  '{{time}}': '14:30',
  '{{cancel_link}}': 'https://appointly.co/cancel/…',
  '{{rebook_link}}': 'https://appointly.co/book/…',
};

function renderWaPreview(template: string, salonName: string) {
  const vars: Record<string, string> = { ...WA_SAMPLE, '{{salon_name}}': salonName };
  return Object.entries(vars).reduce(
    (str, [key, val]) => str.replaceAll(key, val),
    template,
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-card overflow-hidden">
      <div className="px-6 py-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-50">
            <Icon className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted">{description}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SettingsPage() {
  const { salon, isLoading: salonLoading } = useSalon();
  const utils = trpc.useUtils();
  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? '';

  // ── Remote data ──
  const { data: salonFull, isLoading: fullLoading } = trpc.salons.getBySlug.useQuery(
    { slug: salon?.slug ?? '' },
    { enabled: !!salon?.slug },
  );

  const { data: settings, isLoading: settingsLoading } = trpc.salons.getSettings.useQuery(
    { salon_id: salon?.id ?? '' },
    { enabled: !!salon?.id },
  );

  // ── Hours state ──
  const [hours, setHours] = useState<DayHour[]>(defaultHours());
  const [hoursSaving, setHoursSaving] = useState(false);

  useEffect(() => {
    if (salonFull?.hours && salonFull.hours.length > 0) {
      const filled = defaultHours().map((def) => {
        const found = salonFull.hours.find((h) => h.day_of_week === def.day_of_week);
        return found
          ? { day_of_week: found.day_of_week, open_time: found.open_time, close_time: found.close_time, is_closed: found.is_closed }
          : def;
      });
      setHours(filled);
    }
  }, [salonFull]);

  // ── Info form ──
  const infoForm = useForm<InfoForm>({
    resolver: zodResolver(infoSchema),
    defaultValues: { name: '', phone: '', address: '', city: '' },
  });

  useEffect(() => {
    if (salonFull) {
      infoForm.reset({
        name: salonFull.name,
        phone: salonFull.phone ?? '',
        address: salonFull.address ?? '',
        city: salonFull.city ?? '',
        logo_url: salonFull.logo_url ?? null,
        cover_url: salonFull.cover_url ?? null,
      });
    }
  }, [salonFull, infoForm]);

  const updateSalonMutation = trpc.salons.update.useMutation({
    onSuccess: () => {
      utils.salons.getBySlug.invalidate();
      toast({ title: 'פרטי הסלון עודכנו' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  // ── Booking form ──
  const bookingForm = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      confirmation_mode: 'AUTO',
      cancellation_method: 'MAGIC_LINK',
      cancellation_window_hours: 24,
      booking_slot_interval_mins: 15,
      buffer_after_mins: 0,
    },
  });

  useEffect(() => {
    if (settings) {
      bookingForm.reset({
        confirmation_mode: settings.confirmation_mode as 'MANUAL' | 'AUTO',
        cancellation_method: settings.cancellation_method as 'MAGIC_LINK' | 'PHONE_OTP',
        cancellation_window_hours: settings.cancellation_window_hours,
        booking_slot_interval_mins: settings.booking_slot_interval_mins,
        buffer_after_mins: settings.buffer_after_mins,
      });
    }
  }, [settings, bookingForm]);

  // ── WA form ──
  const waForm = useForm<WaForm>({
    resolver: zodResolver(waSchema),
    defaultValues: {
      wa_phone_number: '',
      wa_confirmation_template: '',
      wa_reminder_template: '',
      wa_post_visit_template: '',
    },
  });

  useEffect(() => {
    if (settings) {
      waForm.reset({
        wa_phone_number: settings.wa_phone_number ?? '',
        wa_confirmation_template: settings.wa_confirmation_template ?? '',
        wa_reminder_template: settings.wa_reminder_template ?? '',
        wa_post_visit_template: settings.wa_post_visit_template ?? '',
      });
    }
  }, [settings, waForm]);

  const updateSettingsMutation = trpc.salons.updateSettings.useMutation({
    onSuccess: () => {
      utils.salons.getSettings.invalidate();
      toast({ title: 'הגדרות נשמרו' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const updateHoursMutation = trpc.salons.updateHours.useMutation({
    onSuccess: () => {
      utils.salons.getBySlug.invalidate();
      toast({ title: 'שעות הפעילות עודכנו' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  // ── Visibility ──
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  useEffect(() => {
    if (salonFull) {
      setIsPublic((salonFull as unknown as { is_public?: boolean }).is_public ?? true);
    }
  }, [salonFull]);

  const updateVisibilityMutation = trpc.salons.updateVisibility.useMutation({
    onSuccess: (data) => {
      setIsPublic(data.is_public);
      utils.salons.getBySlug.invalidate();
      toast({ title: data.is_public ? 'העסק הפך לציבורי' : 'העסק הפך לפרטי' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const { data: activeInvites, refetch: refetchInvites } = trpc.salons.getInvites.useQuery(
    { salon_id: salon?.id ?? '' },
    { enabled: !!salon?.id },
  );

  const createInviteMutation = trpc.salons.createInvite.useMutation({
    onSuccess: (data) => {
      const link = `${appUrl}/invite/${data.token}`;
      setInviteLink(link);
      void refetchInvites();
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const revokeInviteMutation = trpc.salons.revokeInvite.useMutation({
    onSuccess: () => {
      void refetchInvites();
      toast({ title: 'קישור בוטל' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  // Copies the generated invite link to the clipboard.
  function copyInviteLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function onInfoSubmit(values: InfoForm) {
    if (!salon?.id) return;
    updateSalonMutation.mutate({ salon_id: salon.id, data: values });
  }

  function onBookingSubmit(values: BookingForm) {
    if (!salon?.id) return;
    updateSettingsMutation.mutate({ salon_id: salon.id, data: values });
  }

  function onWaSubmit(values: WaForm) {
    if (!salon?.id) return;
    updateSettingsMutation.mutate({ salon_id: salon.id, data: values });
  }

  async function onHoursSave() {
    if (!salon?.id) return;
    setHoursSaving(true);
    try {
      await updateHoursMutation.mutateAsync({ salon_id: salon.id, hours });
    } finally {
      setHoursSaving(false);
    }
  }

  function updateHour(dayIndex: number, patch: Partial<DayHour>) {
    setHours((prev) => prev.map((h) => (h.day_of_week === dayIndex ? { ...h, ...patch } : h)));
  }

  const isLoading = salonLoading || fullLoading || settingsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const watchedConfirmation = bookingForm.watch('wa_phone_number' as never);
  const waConfirmationPreview = renderWaPreview(
    waForm.watch('wa_confirmation_template') ?? '',
    salon?.name ?? 'הסלון שלי',
  );
  const waReminderPreview = renderWaPreview(
    waForm.watch('wa_reminder_template') ?? '',
    salon?.name ?? 'הסלון שלי',
  );
  void watchedConfirmation;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tighter text-foreground">הגדרות</h1>
        <p className="text-sm text-muted mt-0.5">ניהול פרטי הסלון והגדרות המערכת</p>
      </div>

      {/* ── Salon Info ─────────────────────────────────────────────────────── */}
      <Section icon={Store} title="פרטי הסלון" description="שם, טלפון, כתובת ותמונות">
        <form onSubmit={infoForm.handleSubmit(onInfoSubmit)} className="space-y-4">
          {/* Logo + Cover images */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>תמונת שער (Cover)</Label>
              <ImageUpload
                value={infoForm.watch('cover_url') ?? undefined}
                onChange={(url) => infoForm.setValue('cover_url', url || null)}
                folder="salons"
                aspect="wide"
                label="העלה תמונת שער"
                disabled={updateSalonMutation.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label>לוגו הסלון</Label>
              <ImageUpload
                value={infoForm.watch('logo_url') ?? undefined}
                onChange={(url) => infoForm.setValue('logo_url', url || null)}
                folder="salons"
                aspect="square"
                label="העלה לוגו"
                disabled={updateSalonMutation.isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="salon-name">שם הסלון</Label>
              <Input id="salon-name" {...infoForm.register('name')} />
              {infoForm.formState.errors.name && (
                <p className="text-xs text-red-500">{infoForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salon-phone">טלפון</Label>
              <Input id="salon-phone" type="tel" dir="ltr" {...infoForm.register('phone')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salon-address">כתובת</Label>
              <Input id="salon-address" {...infoForm.register('address')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salon-city">עיר</Label>
              <Input id="salon-city" {...infoForm.register('city')} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={updateSalonMutation.isPending} className="gap-2">
              {updateSalonMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              שמור פרטים
            </Button>
          </div>
        </form>
      </Section>

      {/* ── Operating Hours ───────────────────────────────────────────────── */}
      <Section icon={Clock} title="שעות פעילות" description="הגדר שעות פתיחה לכל יום בשבוע">
        <div className="space-y-2">
          {hours.map((day) => (
            <div
              key={day.day_of_week}
              className="flex items-center gap-3 flex-wrap py-2 border-b border-border/40 last:border-0"
            >
              <div className="w-16 shrink-0">
                <p className="text-sm font-medium text-foreground">{DAY_NAMES[day.day_of_week]}</p>
              </div>
              <Switch
                checked={!day.is_closed}
                onCheckedChange={(open) => updateHour(day.day_of_week, { is_closed: !open })}
                aria-label={`${DAY_NAMES[day.day_of_week]} פתוח`}
              />
              {day.is_closed ? (
                <span className="text-sm text-muted">סגור</span>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={day.open_time}
                    onChange={(e) => updateHour(day.day_of_week, { open_time: e.target.value })}
                    className="w-28 text-sm"
                    dir="ltr"
                  />
                  <span className="text-muted text-sm">—</span>
                  <Input
                    type="time"
                    value={day.close_time}
                    onChange={(e) => updateHour(day.day_of_week, { close_time: e.target.value })}
                    className="w-28 text-sm"
                    dir="ltr"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button
            onClick={onHoursSave}
            disabled={hoursSaving || updateHoursMutation.isPending}
            className="gap-2"
          >
            {(hoursSaving || updateHoursMutation.isPending) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            שמור שעות
          </Button>
        </div>
      </Section>

      {/* ── Booking Settings ──────────────────────────────────────────────── */}
      <Section icon={Settings2} title="הגדרות הזמנה" description="אישור תורים, ביטולים, פרקי זמן">
        <form onSubmit={bookingForm.handleSubmit(onBookingSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Confirmation mode */}
            <div className="space-y-1.5">
              <Label>אופן אישור תורים</Label>
              <Select
                value={bookingForm.watch('confirmation_mode')}
                onValueChange={(v) =>
                  bookingForm.setValue('confirmation_mode', v as 'MANUAL' | 'AUTO')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTO">אוטומטי — תור מאושר מיד</SelectItem>
                  <SelectItem value="MANUAL">ידני — בעל הסלון מאשר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cancellation method */}
            <div className="space-y-1.5">
              <Label>אופן ביטול תורים</Label>
              <Select
                value={bookingForm.watch('cancellation_method')}
                onValueChange={(v) =>
                  bookingForm.setValue('cancellation_method', v as 'MAGIC_LINK' | 'PHONE_OTP')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAGIC_LINK">קישור מהיר (Magic Link)</SelectItem>
                  <SelectItem value="PHONE_OTP">קוד OTP לטלפון</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cancellation window */}
            <div className="space-y-1.5">
              <Label htmlFor="cancel-window">חלון ביטול (שעות לפני)</Label>
              <Input
                id="cancel-window"
                type="number"
                min={0}
                max={168}
                dir="ltr"
                {...bookingForm.register('cancellation_window_hours')}
              />
              <p className="text-xs text-muted">לקוחות לא יוכלו לבטל X שעות לפני התור</p>
              {bookingForm.formState.errors.cancellation_window_hours && (
                <p className="text-xs text-red-500">
                  {bookingForm.formState.errors.cancellation_window_hours.message}
                </p>
              )}
            </div>

            {/* Slot interval */}
            <div className="space-y-1.5">
              <Label>פרק זמן בין תורים</Label>
              <Select
                value={String(bookingForm.watch('booking_slot_interval_mins'))}
                onValueChange={(v) =>
                  bookingForm.setValue('booking_slot_interval_mins', Number(v))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 דקות</SelectItem>
                  <SelectItem value="15">15 דקות</SelectItem>
                  <SelectItem value="20">20 דקות</SelectItem>
                  <SelectItem value="30">30 דקות</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Buffer */}
            <div className="space-y-1.5">
              <Label htmlFor="buffer">זמן מרווח אחרי תור (דקות)</Label>
              <Input
                id="buffer"
                type="number"
                min={0}
                max={120}
                dir="ltr"
                {...bookingForm.register('buffer_after_mins')}
              />
              <p className="text-xs text-muted">זמן ניקיון / מנוחה בין תורים</p>
            </div>
          </div>

          <Separator />
          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettingsMutation.isPending} className="gap-2">
              {updateSettingsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              שמור הגדרות
            </Button>
          </div>
        </form>
      </Section>

      {/* ── Visibility & Access ───────────────────────────────────────────── */}
      <Section
        icon={Globe}
        title="חשיפה ונגישות"
        description="שלוט מי יכול למצוא ולהזמין תורים בעסק שלך"
      >
        <div className="space-y-5">
          {/* Public / Private toggle */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                {isPublic ? (
                  <Globe className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 text-brand-600 shrink-0" />
                )}
                <p className="text-sm font-medium text-foreground">
                  {isPublic ? 'עסק ציבורי' : 'עסק פרטי'}
                </p>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {isPublic
                  ? 'העסק מופיע בחיפוש הציבורי — כל אחד יכול למצוא אותך ולקבוע תור.'
                  : 'העסק לא מופיע בחיפוש — רק לקוחות עם קישור הזמנה יכולים לקבוע תור.'}
              </p>
            </div>
            <Switch
              checked={isPublic}
              disabled={updateVisibilityMutation.isPending}
              onCheckedChange={(checked) => {
                if (!salon?.id) return;
                setIsPublic(checked);
                updateVisibilityMutation.mutate({ salon_id: salon.id, is_public: checked });
              }}
              aria-label="עסק ציבורי"
            />
          </div>

          <Separator />

          {/* Invite link generator */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-0.5">
                <LinkIcon className="h-4 w-4 text-brand-600" />
                קישור הזמנה אישי
              </p>
              <p className="text-xs text-muted">
                שלח קישור ייחודי ללקוח כדי לאפשר לו לקבוע תור — גם אם העסק פרטי.
              </p>
            </div>

            {inviteLink ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 rounded-xl border border-border bg-surface-elevated px-3 py-2">
                  <p className="text-xs text-muted truncate" dir="ltr">
                    {inviteLink}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyInviteLink}
                  className="shrink-0 gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      הועתק
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      העתק
                    </>
                  )}
                </Button>
              </div>
            ) : null}

            <Button
              size="sm"
              variant="outline"
              disabled={createInviteMutation.isPending || !salon?.id}
              onClick={() => salon?.id && createInviteMutation.mutate({ salon_id: salon.id })}
              className="gap-1.5"
            >
              {createInviteMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LinkIcon className="h-3.5 w-3.5" />
              )}
              {inviteLink ? 'צור קישור חדש' : 'צור קישור הזמנה'}
            </Button>
          </div>

          {/* Active invite links management */}
          {activeInvites && activeInvites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">קישורי הזמנה פעילים</p>
              <div className="space-y-1.5">
                {activeInvites.map((invite) => {
                  const link = `${appUrl}/invite/${invite.token}`;
                  const isExpired = invite.expires_at && new Date(invite.expires_at) < new Date();
                  return (
                    <div
                      key={invite.id}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isExpired ? 'border-border bg-surface-elevated opacity-60' : 'border-border bg-surface-elevated'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted truncate" dir="ltr">{link}</p>
                        {invite.expires_at && (
                          <p className="text-xs text-muted mt-0.5">
                            {isExpired ? '⚠ פג תוקף' : `פג תוקף: ${new Intl.DateTimeFormat('he-IL').format(new Date(invite.expires_at))}`}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-danger hover:bg-danger/10 shrink-0"
                        disabled={revokeInviteMutation.isPending}
                        onClick={() =>
                          salon?.id &&
                          revokeInviteMutation.mutate({ salon_id: salon.id, invite_id: invite.id })
                        }
                        title="בטל קישור"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ── WhatsApp Settings ─────────────────────────────────────────────── */}
      <Section
        icon={MessageCircle}
        title="הגדרות WhatsApp"
        description="מספר שולח ותבניות הודעות"
      >
        <form onSubmit={waForm.handleSubmit(onWaSubmit)} className="space-y-5">
          {/* WA phone */}
          <div className="space-y-1.5">
            <Label htmlFor="wa-phone">מספר WhatsApp לשליחה</Label>
            <Input
              id="wa-phone"
              type="tel"
              dir="ltr"
              placeholder="+972501234567"
              {...waForm.register('wa_phone_number')}
            />
            <p className="text-xs text-muted">
              מספר ה-WhatsApp המחובר לחשבון Twilio שלך
            </p>
          </div>

          <Separator />

          {/* WA variables reference */}
          <div className="rounded-xl bg-surface-elevated p-3 text-xs text-muted space-y-1">
            <p className="font-semibold text-foreground mb-1.5">משתני תבנית זמינים:</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(WA_SAMPLE).concat(['{{salon_name}}']).map((v) => (
                <code
                  key={v}
                  className="bg-white border border-border px-1.5 py-0.5 rounded text-brand-700"
                >
                  {v}
                </code>
              ))}
            </div>
          </div>

          {/* Confirmation template */}
          <div className="space-y-3">
            <Label htmlFor="wa-confirm">תבנית אישור תור</Label>
            <Textarea
              id="wa-confirm"
              rows={5}
              placeholder={`שלום {{customer_name}}! התור שלך ל{{service_name}} ב{{salon_name}} נקבע ל{{date}} בשעה {{time}}.\nלביטול: {{cancel_link}}`}
              {...waForm.register('wa_confirmation_template')}
            />
            {waConfirmationPreview && (
              <div className="rounded-xl bg-[#ECF8F1] border border-[#D1F2E0] p-3">
                <p className="text-xs font-semibold text-[#075E54] mb-1.5">תצוגה מקדימה:</p>
                <p className="text-sm text-[#111827] whitespace-pre-wrap leading-relaxed">
                  {waConfirmationPreview}
                </p>
              </div>
            )}
          </div>

          {/* Reminder template */}
          <div className="space-y-3">
            <Label htmlFor="wa-reminder">תבנית תזכורת תור</Label>
            <Textarea
              id="wa-reminder"
              rows={5}
              placeholder={`היי {{customer_name}}, רק להזכיר שיש לך תור מחר ב{{time}} ל{{service_name}}.\nלשינוי: {{cancel_link}}`}
              {...waForm.register('wa_reminder_template')}
            />
            {waReminderPreview && (
              <div className="rounded-xl bg-[#ECF8F1] border border-[#D1F2E0] p-3">
                <p className="text-xs font-semibold text-[#075E54] mb-1.5">תצוגה מקדימה:</p>
                <p className="text-sm text-[#111827] whitespace-pre-wrap leading-relaxed">
                  {waReminderPreview}
                </p>
              </div>
            )}
          </div>

          {/* Post-visit template */}
          <div className="space-y-3">
            <Label htmlFor="wa-post">תבנית הודעה לאחר ביקור</Label>
            <Textarea
              id="wa-post"
              rows={4}
              placeholder={`תודה {{customer_name}} על הביקור ב{{salon_name}}! נשמח לראות אותך שוב.\nלקביעת תור נוסף: {{rebook_link}}`}
              {...waForm.register('wa_post_visit_template')}
            />
          </div>

          <Separator />
          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettingsMutation.isPending} className="gap-2">
              {updateSettingsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              שמור הגדרות WhatsApp
            </Button>
          </div>
        </form>
      </Section>
    </div>
  );
}
