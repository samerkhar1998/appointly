'use client';

import { useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/lib/use-toast';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Scissors,
  User,
  XCircle,
} from 'lucide-react';

interface Props {
  token: string;
}

type CancelState = 'idle' | 'otp_sent' | 'confirming' | 'success' | 'error';

function formatDate(iso: string, timezone: string) {
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  }).format(new Date(iso));
}

export function CancelPage({ token }: Props) {
  const [cancelState, setCancelState] = useState<CancelState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Load appointment details without consuming the token
  const {
    data: appt,
    isLoading: apptLoading,
    isError: apptError,
  } = trpc.appointments.getByToken.useQuery({ token });

  const cancelMutation = trpc.appointments.cancelByToken.useMutation({
    onSuccess: () => setCancelState('success'),
    onError: (err) => {
      setErrorMsg(err.message);
      setCancelState('error');
    },
  });

  const requestOtpMutation = trpc.appointments.requestOTP.useMutation({
    onSuccess: () => {
      setCancelState('otp_sent');
      startCooldown();
      toast({ title: 'קוד נשלח', description: 'בדוק את הוואטסאפ/SMS שלך' });
    },
    onError: (err) => {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    },
  });

  const cancelByOtpMutation = trpc.appointments.cancelByOTP.useMutation({
    onSuccess: () => setCancelState('success'),
    onError: (err) => {
      setErrorMsg(err.message);
      setCancelState('error');
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    },
  });

  function startCooldown() {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleMagicLinkCancel() {
    setCancelState('confirming');
    cancelMutation.mutate({ token });
  }

  function handleRequestOtp() {
    if (!appt) return;
    requestOtpMutation.mutate({ appointment_id: appt.id });
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 filled
    if (next.every(Boolean) && appt) {
      cancelByOtpMutation.mutate({
        appointment_id: appt.id,
        code: next.join(''),
      });
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      if (appt) {
        cancelByOtpMutation.mutate({ appointment_id: appt.id, code: pasted });
      }
    }
  }

  return (
    <>
      <div
        className="min-h-screen bg-background flex items-center justify-center p-4"
        style={{
          backgroundImage: `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(239,68,68,0.06) 0%, transparent 65%)`,
        }}
      >
        <div className="w-full max-w-sm space-y-6">
          {/* Brand */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 shadow-card mb-3">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-muted">Appointly</p>
          </div>

          {/* Appointment details card (skeleton while loading) */}
          {apptLoading && (
            <div className="bg-white rounded-2xl shadow-card border border-border/50 p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-border rounded-full w-2/3" />
              <div className="h-3 bg-border rounded-full w-1/2" />
              <div className="h-3 bg-border rounded-full w-3/4" />
            </div>
          )}

          {apptError && (
            <div className="bg-white rounded-2xl shadow-elevated border border-border/50 p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold tracking-tighter text-foreground">
                קישור לא תקף
              </h2>
              <p className="text-sm text-muted mt-2 leading-relaxed">
                הקישור לביטול אינו תקף או שכבר שומש. צור קשר עם הסלון ישירות.
              </p>
            </div>
          )}

          {appt && cancelState !== 'success' && (
            <div className="bg-white rounded-2xl shadow-card border border-border/50 p-5 space-y-3 animate-in fade-in duration-250">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest">
                פרטי התור
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Scissors className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span className="font-medium text-foreground">{appt.service_name}</span>
                  <span className="text-muted">·</span>
                  <span className="text-muted">{appt.service_duration} דקות</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span className="text-foreground">
                    {formatDate(appt.start_datetime, appt.salon_timezone)}
                  </span>
                </div>
                {appt.staff_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <span className="text-foreground">{appt.staff_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="text-muted">
                    ביטול אפשרי עד {appt.cancellation_window_hours} שעות לפני התור
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Main action card */}
          <div className="bg-white rounded-2xl shadow-elevated border border-border/50 p-8 text-center">
            {/* ── idle: choose cancel method ── */}
            {cancelState === 'idle' && appt && (
              <div className="space-y-6 animate-in fade-in duration-250">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tighter text-foreground">ביטול תור</h1>
                  <p className="text-sm text-muted mt-2 leading-relaxed">
                    האם אתה בטוח שברצונך לבטל? פעולה זו אינה הפיכה.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    size="lg"
                    variant="destructive"
                    className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700"
                    onClick={handleMagicLinkCancel}
                  >
                    כן, בטל את התור
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    onClick={handleRequestOtp}
                    disabled={requestOtpMutation.isPending}
                  >
                    {requestOtpMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'ביטול עם קוד SMS'
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full text-muted"
                    onClick={() => window.history.back()}
                  >
                    לא, חזור
                  </Button>
                </div>
              </div>
            )}

            {/* ── OTP entry ── */}
            {cancelState === 'otp_sent' && appt && (
              <div className="space-y-6 animate-in fade-in duration-250">
                <div>
                  <h1 className="text-xl font-bold tracking-tighter text-foreground">
                    אימות ביטול
                  </h1>
                  <p className="text-sm text-muted mt-2 leading-relaxed">
                    שלחנו קוד 6 ספרות למספר {appt.customer_phone}
                  </p>
                </div>
                <div
                  className="flex gap-2 justify-center"
                  dir="ltr"
                  onPaste={handleOtpPaste}
                >
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      disabled={cancelByOtpMutation.isPending}
                      className="w-10 h-12 text-center text-lg font-bold rounded-xl border-2 border-border focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-1 transition-colors disabled:opacity-50"
                    />
                  ))}
                </div>
                {cancelByOtpMutation.isPending && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    מבטל...
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted text-xs"
                  disabled={resendCooldown > 0 || requestOtpMutation.isPending}
                  onClick={handleRequestOtp}
                >
                  {resendCooldown > 0 ? `שלח שוב בעוד ${resendCooldown}ש` : 'שלח קוד חדש'}
                </Button>
              </div>
            )}

            {/* ── confirming (magic-link) ── */}
            {cancelState === 'confirming' && (
              <div className="space-y-4 py-4 animate-in fade-in duration-250">
                <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto" />
                <p className="text-muted text-sm">מבטל את התור...</p>
              </div>
            )}

            {/* ── success ── */}
            {cancelState === 'success' && (
              <div className="space-y-6 animate-in fade-in duration-250">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tighter text-foreground">
                    התור בוטל בהצלחה
                  </h2>
                  <p className="text-sm text-muted mt-2 leading-relaxed">
                    נשמח לראות אותך שוב. ניתן לקבוע תור חדש בכל עת.
                  </p>
                </div>
              </div>
            )}

            {/* ── error ── */}
            {cancelState === 'error' && (
              <div className="space-y-6 animate-in fade-in duration-250">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 border-2 border-red-200">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tighter text-foreground">
                    לא ניתן לבטל
                  </h2>
                  <p className="text-sm text-muted mt-2 leading-relaxed">{errorMsg}</p>
                </div>
                <Button size="lg" variant="outline" className="w-full" onClick={() => setCancelState('idle')}>
                  נסה שוב
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}
