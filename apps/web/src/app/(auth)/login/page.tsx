'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock, Mail, Scissors } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('כתובת דוא"ל לא תקינה'),
  password: z.string().min(1, 'נדרשת סיסמה'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast({ title: 'ברוך הבא!', description: 'מתחבר ללוח הבקרה...', variant: 'default' });
      router.push('/dashboard');
    },
    onError: (err) => {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    },
  });

  const onSubmit = (data: LoginForm) => loginMutation.mutate(data);

  return (
    <>
      <div
        className="min-h-screen bg-background flex items-center justify-center p-4"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 50% -20%, rgba(124,58,237,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 80% 80%, rgba(124,58,237,0.06) 0%, transparent 60%)
          `,
        }}
      >
        <div className="w-full max-w-md">
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 shadow-elevated mb-4">
              <Scissors className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tighter text-foreground">Appointly</h1>
            <p className="text-muted text-sm mt-1 leading-relaxed">
              מערכת ניהול תורים לסלונים
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-elevated border border-border/50 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tighter text-foreground">כניסה למערכת</h2>
              <p className="text-sm text-muted mt-1">הכנס את פרטי הגישה שלך</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">דוא"ל</Label>
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
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">סיסמה</Label>
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
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded"
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
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2"
                disabled={isSubmitting || loginMutation.isPending}
              >
                {(isSubmitting || loginMutation.isPending) ? (
                  <>
                    <Loader2 className="animate-spin" />
                    מתחבר...
                  </>
                ) : (
                  'כניסה למערכת'
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-muted mt-6">
            © {new Date().getFullYear()} Appointly — כל הזכויות שמורות
          </p>
        </div>
      </div>
      <Toaster />
    </>
  );
}
