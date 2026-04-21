'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Loader2,
  Lock,
  Mail,
  Phone,
  Scissors,
  Store,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/use-toast';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

// ── Schemas ──────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type LoginForm = z.infer<typeof loginSchema>;

const CUSTOMER_STORAGE_KEY = 'appointly:customer';

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_denied: 'ההתחברות עם Google בוטלה.',
  google_token_failed: 'אירעה שגיאה בהתחברות עם Google. נסה שנית.',
  google_email_unverified: 'כתובת הדוא"ל של חשבון Google אינה מאומתת.',
  google_auth_failed: 'אירעה שגיאה בהתחברות עם Google. נסה שנית.',
};

type Step = 'gateway' | 'owner' | 'customer-phone' | 'customer-otp' | 'customer-name';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('gateway');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('auth');

  const BackArrow = locale === 'en' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const error = searchParams.get('error');
    if (error && GOOGLE_ERROR_MESSAGES[error]) {
      setStep('owner');
      toast({ title: 'שגיאה', description: GOOGLE_ERROR_MESSAGES[error], variant: 'destructive' });
    }
    if (searchParams.get('redirect')) {
      setStep('owner');
    }
  }, [searchParams]);

  // ── Owner login ───────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      const redirect = searchParams.get('redirect') ?? '/dashboard';
      toast({ title: t('welcome_back'), description: t('redirecting_dashboard') });
      router.push(redirect);
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  // ── Customer OTP flow ─────────────────────────────────────────────────────
  const sendOTPMutation = trpc.verification.sendOTP.useMutation({
    onSuccess: () => setStep('customer-otp'),
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const verifyOTPMutation = trpc.verification.verifyOTP.useMutation({
    onSuccess: (data) => {
      setVerificationToken(data.verification_token);
      if (data.customer_name) {
        // Known customer — save and redirect
        saveCustomerAndRedirect(data.customer_name);
      } else {
        setStep('customer-name');
      }
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const setNameMutation = trpc.verification.setCustomerName.useMutation({
    onSuccess: () => saveCustomerAndRedirect(customerName),
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  function saveCustomerAndRedirect(name: string) {
    try {
      localStorage.setItem(
        CUSTOMER_STORAGE_KEY,
        JSON.stringify({ name, phone, email: '' }),
      );
    } catch { /* private browsing — fail silently */ }
    router.push('/');
  }

  // ── Back navigation logic ─────────────────────────────────────────────────
  const BACK: Partial<Record<Step, Step>> = {
    owner: 'gateway',
    'customer-phone': 'gateway',
    'customer-otp': 'customer-phone',
    'customer-name': 'customer-otp',
  };

  function goBack() {
    const prev = BACK[step];
    if (prev) setStep(prev);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-[calc(100vh-3.5rem)] bg-background flex items-center justify-center p-4"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 50% -20%, rgba(124,58,237,0.10) 0%, transparent 70%),
          radial-gradient(ellipse 50% 40% at 80% 80%, rgba(124,58,237,0.05) 0%, transparent 60%)
        `,
      }}
    >
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 shadow-elevated mb-4">
            <Scissors className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter text-foreground">Appointly</h1>
        </div>

        {/* ── Back button (all steps except gateway) ── */}
        {step !== 'gateway' && (
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground
                       transition-colors mb-5 focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-brand-600 rounded"
          >
            <BackArrow className="w-4 h-4" />
            {t('back_to_role')}
          </button>
        )}

        {/* ── STEP: Gateway ── */}
        {step === 'gateway' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-foreground">{t('gateway_title')}</h2>
              <p className="text-sm text-muted mt-1">{t('gateway_subtitle')}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setStep('customer-phone')}
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border
                           bg-white text-center shadow-card hover:border-brand-300 hover:shadow-elevated
                           transition-all duration-200 focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-brand-600"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center
                                group-hover:bg-brand-100 transition-colors duration-200">
                  <CalendarCheck className="w-7 h-7 text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm leading-snug">
                    {t('i_am_customer')}
                  </p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {t('i_am_customer_desc')}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setStep('owner')}
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-brand-200
                           bg-brand-50 text-center shadow-card hover:border-brand-400 hover:shadow-elevated
                           transition-all duration-200 focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-brand-600"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center
                                group-hover:bg-brand-200 transition-colors duration-200">
                  <Store className="w-7 h-7 text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-brand-700 text-sm leading-snug">
                    {t('i_own_business')}
                  </p>
                  <p className="text-xs text-brand-600/70 mt-1 leading-relaxed">
                    {t('i_own_business_desc')}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: Customer phone ── */}
        {step === 'customer-phone' && (
          <div className="bg-white rounded-2xl shadow-elevated border border-border/50 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tighter text-foreground">{t('i_am_customer')}</h2>
              <p className="text-sm text-muted mt-1">{t('customer_phone_subtitle')}</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t('phone_number')}</Label>
                <div className="relative">
                  <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <Input
                    id="phone"
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+972501234567"
                    className="ps-10"
                    autoComplete="tel"
                  />
                </div>
              </div>
              <Button
                size="lg"
                className="w-full"
                disabled={phone.trim().length < 7 || sendOTPMutation.isPending}
                onClick={() => sendOTPMutation.mutate({ phone: phone.trim() })}
              >
                {sendOTPMutation.isPending ? (
                  <><Loader2 className="animate-spin" /> {t('sending_code')}</>
                ) : (
                  t('send_code')
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: Customer OTP ── */}
        {step === 'customer-otp' && (
          <div className="bg-white rounded-2xl shadow-elevated border border-border/50 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tighter text-foreground">{t('verify_phone')}</h2>
              <p className="text-sm text-muted mt-1">
                {t('otp_sent_to')} <span dir="ltr" className="font-semibold text-foreground">{phone}</span>
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="otp">{t('enter_code')}</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="text-center tracking-widest text-lg font-mono"
                  autoComplete="one-time-code"
                />
              </div>
              <Button
                size="lg"
                className="w-full"
                disabled={otp.length !== 6 || verifyOTPMutation.isPending}
                onClick={() => verifyOTPMutation.mutate({ phone: phone.trim(), code: otp })}
              >
                {verifyOTPMutation.isPending ? (
                  <><Loader2 className="animate-spin" /> {t('verifying')}</>
                ) : (
                  t('verify')
                )}
              </Button>
              <button
                onClick={() => sendOTPMutation.mutate({ phone: phone.trim() })}
                disabled={sendOTPMutation.isPending}
                className="w-full text-sm text-muted hover:text-brand-600 transition-colors
                           disabled:opacity-50 focus-visible:outline-none"
              >
                {t('resend_code')}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: Customer name ── */}
        {step === 'customer-name' && (
          <div className="bg-white rounded-2xl shadow-elevated border border-border/50 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tighter text-foreground">{t('whats_your_name')}</h2>
              <p className="text-sm text-muted mt-1">{t('name_for_bookings')}</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">{t('your_name')}</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={locale === 'en' ? 'Your name' : locale === 'ar' ? 'اسمك' : 'שמך'}
                    className="ps-10"
                  />
                </div>
              </div>
              <Button
                size="lg"
                className="w-full"
                disabled={customerName.trim().length < 2 || setNameMutation.isPending}
                onClick={() =>
                  setNameMutation.mutate({
                    phone: phone.trim(),
                    name: customerName.trim(),
                    verification_token: verificationToken,
                  })
                }
              >
                {setNameMutation.isPending ? (
                  <><Loader2 className="animate-spin" /> {t('saving')}</>
                ) : (
                  t('continue')
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: Owner login form ── */}
        {step === 'owner' && (
          <div className="bg-white rounded-2xl shadow-elevated border border-border/50 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tighter text-foreground">
                {t('owner_login_title')}
              </h2>
              <p className="text-sm text-muted mt-1">{t('owner_login_subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit((d) => loginMutation.mutate(d))} className="space-y-5" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t('email')}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    dir="ltr"
                    className={cn('ps-10', errors.email && 'border-red-400 focus-visible:ring-red-400')}
                    placeholder="your@email.com"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">{t('password')}</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    dir="ltr"
                    className={cn('ps-10 pe-10', errors.password && 'border-red-400 focus-visible:ring-red-400')}
                    placeholder="••••••••"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground
                               transition-colors focus-visible:outline-none rounded"
                    aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2"
                disabled={isSubmitting || loginMutation.isPending}
              >
                {(isSubmitting || loginMutation.isPending) ? (
                  <><Loader2 className="animate-spin" /> {t('signing_in')}</>
                ) : (
                  t('login_button')
                )}
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs text-muted bg-white px-2">
                {t('or')}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full gap-3"
              onClick={() => { setIsGoogleLoading(true); window.location.href = '/api/auth/google'; }}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {t('continue_google')}
            </Button>

            <p className="text-center text-sm text-muted mt-5">
              {t('no_account')}{' '}
              <Link
                href="/register"
                className="font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-2
                           transition-colors focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-brand-600 rounded"
              >
                {t('register_link')}
              </Link>
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted mt-6">
          © {new Date().getFullYear()} Appointly
        </p>
      </div>
    </div>
  );
}
