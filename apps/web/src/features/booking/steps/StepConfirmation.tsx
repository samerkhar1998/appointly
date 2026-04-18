'use client';

import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Calendar, Clock, Scissors, Phone } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { BookingState } from '../BookingFlow';

interface Props {
  booking: BookingState;
  salonTimezone: string;
  // Called when the server rejects the booking because the slot was taken by
  // a concurrent request. The flow should navigate back to datetime selection.
  onSlotTaken: () => void;
}

function formatLocalDateTime(isoUtc: string, timezone: string) {
  return {
    date: new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: timezone,
    }).format(new Date(isoUtc)),
    time: new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    }).format(new Date(isoUtc)),
  };
}

export function StepConfirmation({ booking, salonTimezone, onSlotTaken }: Props) {
  const createMutation = trpc.appointments.create.useMutation({
    onError: (err) => {
      // A CONFLICT means someone else booked this slot between the user selecting
      // it and submitting. Send them back to pick a fresh time.
      if (err.data?.code === 'CONFLICT') {
        onSlotTaken();
      }
    },
  });

  useEffect(() => {
    createMutation.mutate({
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      customer_email: booking.customer_email || undefined,
      service_id: booking.service_id,
      staff_id: booking.staff_id,
      start_datetime: booking.start_datetime,
      verification_token: booking.verification_token,
    });
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { date, time } = formatLocalDateTime(booking.start_datetime, salonTimezone);

  if (createMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-in fade-in duration-250">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
        <p className="text-muted text-sm">קובע את התור שלך...</p>
      </div>
    );
  }

  if (createMutation.isError) {
    return (
      <div className="space-y-4 animate-in fade-in duration-250">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="font-semibold text-red-700 mb-1">לא הצלחנו לקבוע את התור</p>
          <p className="text-sm text-red-600">{createMutation.error.message}</p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.location.reload()}
        >
          נסה שוב מההתחלה
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-250">
      {/* Success header */}
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 mb-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold tracking-tighter text-foreground">התור נקבע!</h2>
        <p className="text-sm text-muted mt-2 leading-relaxed">
          תקבל הודעת WhatsApp עם פרטי התור
        </p>
      </div>

      {/* Booking summary card */}
      <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="bg-brand-600 px-5 py-3 flex items-center justify-between">
          <p className="text-white font-semibold text-sm">{booking.salon_name}</p>
          <Badge className="bg-white/20 text-white border-white/30 text-xs">מאושר</Badge>
        </div>
        <div className="p-5 space-y-4">
          <InfoRow icon={Scissors} label="שירות" value={`${booking.service_name} · ${formatPrice(booking.service_price)}`} />
          <InfoRow icon={Calendar} label="תאריך" value={date} />
          <InfoRow icon={Clock} label="שעה" value={`${time} · ${booking.service_duration} דקות`} />
          <InfoRow icon={Phone} label="טלפון" value={booking.customer_phone} dir="ltr" />
        </div>
      </div>

      {/* WhatsApp preview hint */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-700 flex items-start gap-3">
        <span className="text-xl shrink-0">💬</span>
        <div>
          <p className="font-semibold mb-0.5">הודעת אישור בדרך</p>
          <p className="text-emerald-600 text-xs leading-relaxed">
            שלחנו אישור ל-{booking.customer_phone} עם קישור לביטול התור אם תצטרך.
          </p>
        </div>
      </div>

      {/* Actions */}
      <Button
        size="lg"
        className="w-full"
        onClick={() => window.location.href = `https://wa.me/${booking.customer_phone.replace('+', '')}`}
        variant="outline"
      >
        פתח WhatsApp
      </Button>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  dir,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-brand-600" />
      </div>
      <div>
        <p className="text-xs text-muted font-medium">{label}</p>
        <p className="text-sm font-semibold text-foreground" dir={dir}>
          {value}
        </p>
      </div>
    </div>
  );
}
