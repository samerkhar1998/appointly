'use client';

import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, RotateCcw } from 'lucide-react';
import { toast } from '@/lib/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  salonId: string;
  phone: string;
  onVerified: (token: string) => void;
  onBack: () => void;
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export function StepOTP({ salonId, phone, onVerified, onBack }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const sendMutation = trpc.verification.sendOTP.useMutation({
    onSuccess: () => {
      setSent(true);
      setCooldown(RESEND_COOLDOWN);
      toast({ title: 'קוד נשלח!', description: `קוד אימות נשלח ל-${phone}` });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const verifyMutation = trpc.verification.verifyOTP.useMutation({
    onSuccess: (data) => onVerified(data.verification_token),
    onError: (err) => {
      toast({ title: 'קוד שגוי', description: err.message, variant: 'destructive' });
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    },
  });

  // Auto-send on mount
  useEffect(() => {
    sendMutation.mutate({ phone, salon_id: salonId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Auto-verify when all digits filled
  useEffect(() => {
    const code = digits.join('');
    if (code.length === OTP_LENGTH && digits.every((d) => d !== '')) {
      verifyMutation.mutate({ phone, code });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length) {
      e.preventDefault();
      const next = Array(OTP_LENGTH).fill('');
      pasted.split('').forEach((d, i) => { next[i] = d; });
      setDigits(next);
      inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    }
  }

  const isPending = sendMutation.isPending || verifyMutation.isPending;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-250">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 mb-4">
          <MessageCircle className="w-8 h-8 text-brand-600" />
        </div>
        <h2 className="text-xl font-bold tracking-tighter text-foreground">אימות מספר טלפון</h2>
        <p className="text-sm text-muted mt-2 leading-relaxed">
          שלחנו קוד בן 6 ספרות ל-
          <br />
          <span className="font-semibold text-foreground" dir="ltr">{phone}</span>
        </p>
      </div>

      {/* OTP Input */}
      <div
        className="flex justify-center gap-2"
        dir="ltr"
        onPaste={handlePaste}
      >
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={isPending}
            className={cn(
              'w-11 h-14 text-center text-xl font-bold rounded-xl border',
              'transition-[border-color,box-shadow] duration-150',
              'focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-1 focus:border-brand-400',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              digit ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-border bg-white text-foreground',
            )}
          />
        ))}
      </div>

      {/* Dev bypass hint — shown only outside production */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
          🛠 מצב פיתוח — קוד OTP: <span className="font-bold tracking-widest">000000</span>
        </div>
      )}

      {/* Status */}
      {verifyMutation.isPending && (
        <div className="flex items-center justify-center gap-2 text-sm text-brand-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          מאמת...
        </div>
      )}

      {/* Resend */}
      <div className="text-center space-y-2">
        {sent && (
          <p className="text-xs text-muted">
            לא קיבלת קוד?{' '}
            {cooldown > 0 ? (
              <span className="font-medium tabular-nums">שלח שוב בעוד {cooldown}ש׳</span>
            ) : (
              <button
                onClick={() => {
                  sendMutation.mutate({ phone, salon_id: salonId });
                }}
                disabled={isPending}
                className="font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded"
              >
                שלח שוב
              </button>
            )}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={onBack}
          disabled={isPending}
        >
          <RotateCcw className="w-4 h-4" />
          שנה פרטים
        </Button>
      </div>
    </div>
  );
}
