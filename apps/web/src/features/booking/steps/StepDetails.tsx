'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { Calendar, Clock, Scissors } from 'lucide-react';
import type { BookingState } from '../BookingFlow';

const detailsSchema = z.object({
  customer_name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים').max(100),
  customer_phone: z
    .string()
    .min(1, 'מספר טלפון נדרש')
    .refine((p) => isValidPhoneNumber(p, 'IL'), 'מספר טלפון לא תקין'),
  customer_email: z.string().email('כתובת דוא"ל לא תקינה').optional().or(z.literal('')),
});

type DetailsForm = z.infer<typeof detailsSchema>;

interface Props {
  booking: Partial<BookingState>;
  onSubmit: (data: Pick<BookingState, 'customer_name' | 'customer_phone' | 'customer_email'>) => void;
  onBack: () => void;
}

function formatLocalDateTime(isoUtc: string, timezone: string) {
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  }).format(new Date(isoUtc));
}

export function StepDetails({ booking, onSubmit, onBack }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      customer_name: booking.customer_name ?? '',
      customer_phone: booking.customer_phone ?? '',
      customer_email: booking.customer_email ?? '',
    },
  });

  function normalizePhone(raw: string) {
    const cleaned = raw.startsWith('0') ? '+972' + raw.slice(1) : raw;
    const parsed = parsePhoneNumberFromString(cleaned, 'IL');
    return parsed?.format('E.164') ?? raw;
  }

  function onFormSubmit(data: DetailsForm) {
    onSubmit({
      customer_name: data.customer_name,
      customer_phone: normalizePhone(data.customer_phone),
      customer_email: data.customer_email ?? '',
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-250">
      <div>
        <h2 className="text-xl font-bold tracking-tighter text-foreground">הפרטים שלך</h2>
        <p className="text-sm text-muted mt-1">נשתמש בפרטים אלה כדי לשלוח לך אישור</p>
      </div>

      {/* Booking summary */}
      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest">סיכום הזמנה</p>
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Scissors className="w-4 h-4 text-brand-500 shrink-0" />
          <span className="font-medium">{booking.service_name}</span>
          <span className="text-muted">·</span>
          <span className="text-brand-700 font-bold">{formatPrice(booking.service_price ?? 0)}</span>
        </div>
        {booking.start_datetime && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{formatLocalDateTime(booking.start_datetime, booking.salon_timezone ?? 'Asia/Jerusalem')}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted">
          <Clock className="w-4 h-4 shrink-0" />
          <span>{booking.service_duration} דקות</span>
        </div>
      </div>

      <Separator />

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5" noValidate>
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">שם מלא</Label>
          <Input
            id="name"
            placeholder="ישראל ישראלי"
            autoComplete="name"
            className={errors.customer_name ? 'border-red-400 focus-visible:ring-red-400' : ''}
            {...register('customer_name')}
          />
          {errors.customer_name && (
            <p className="text-xs text-red-500">{errors.customer_name.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone">מספר טלפון</Label>
          <Input
            id="phone"
            type="tel"
            dir="ltr"
            placeholder="050-000-0000"
            autoComplete="tel"
            inputMode="tel"
            className={errors.customer_phone ? 'border-red-400 focus-visible:ring-red-400' : ''}
            {...register('customer_phone', {
              onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                const normalized = normalizePhone(e.target.value);
                setValue('customer_phone', normalized);
              },
            })}
          />
          {errors.customer_phone && (
            <p className="text-xs text-red-500">{errors.customer_phone.message}</p>
          )}
          <p className="text-xs text-muted">נשתמש במספר זה לאישור ב-WhatsApp</p>
        </div>

        {/* Email (optional) */}
        <div className="space-y-1.5">
          <Label htmlFor="email">
            דוא"ל{' '}
            <span className="text-muted font-normal text-xs">(אופציונלי)</span>
          </Label>
          <Input
            id="email"
            type="email"
            dir="ltr"
            placeholder="your@email.com"
            autoComplete="email"
            className={errors.customer_email ? 'border-red-400 focus-visible:ring-red-400' : ''}
            {...register('customer_email')}
          />
          {errors.customer_email && (
            <p className="text-xs text-red-500">{errors.customer_email.message}</p>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <Button type="submit" size="lg" className="w-full">
            המשך לאימות
          </Button>
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={onBack}>
            חזרה
          </Button>
        </div>
      </form>
    </div>
  );
}
