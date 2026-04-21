'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, Mail, User, Scissors, Store } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/use-toast';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

const registerFormSchema = z
  .object({
    name: z.string().min(1, 'שם נדרש').max(100),
    email: z.string().email('כתובת דוא"ל לא תקינה'),
    password: z.string().min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים'),
    confirm_password: z.string().min(1, 'אנא אשר את הסיסמה'),
    salon_name: z.string().min(1, 'שם הסלון נדרש').max(100),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'הסיסמאות אינן תואמות',
    path: ['confirm_password'],
  });

type RegisterForm = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerFormSchema) });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast({ title: 'ברוך הבא!', description: 'החשבון נוצר בהצלחה. מעביר לדשבורד...', variant: 'default' });
      router.push('/dashboard');
    },
    onError: (err) => {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    },
  });

  // Submits the registration form to create a new salon owner account.
  // Strips the confirm_password field before sending to the server.
  function onSubmit(data: RegisterForm) {
    registerMutation.mutate({
      name: data.name,
      email: data.email,
      password: data.password,
      salon_name: data.salon_name,
    });
  }

  const isPending = registerMutation.isPending;

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
              פתיחת חשבון לסלון
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-elevated border border-border/50 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tighter text-foreground">יצירת חשבון חדש</h2>
              <p className="text-sm text-muted mt-1">מלא את הפרטים כדי להתחיל</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">שם מלא</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    className={cn('ps-10', errors.name && 'border-red-400 focus-visible:ring-red-400')}
                    placeholder="ישראל ישראלי"
                    {...register('name')}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              {/* Salon name */}
              <div className="space-y-1.5">
                <Label htmlFor="salon_name">שם הסלון</Label>
                <div className="relative">
                  <Store className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <Input
                    id="salon_name"
                    type="text"
                    className={cn('ps-10', errors.salon_name && 'border-red-400 focus-visible:ring-red-400')}
                    placeholder="לדוגמה: סלון דנה"
                    {...register('salon_name')}
                  />
                </div>
                {errors.salon_name && <p className="text-xs text-red-500">{errors.salon_name.message}</p>}
              </div>

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
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">סיסמה</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    dir="ltr"
                    className={cn('ps-10', errors.password && 'border-red-400 focus-visible:ring-red-400')}
                    placeholder="לפחות 8 תווים"
                    {...register('password')}
                  />
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirm_password">אימות סיסמה</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <Input
                    id="confirm_password"
                    type="password"
                    autoComplete="new-password"
                    dir="ltr"
                    className={cn('ps-10', errors.confirm_password && 'border-red-400 focus-visible:ring-red-400')}
                    placeholder="הכנס שוב את הסיסמה"
                    {...register('confirm_password')}
                  />
                </div>
                {errors.confirm_password && (
                  <p className="text-xs text-red-500">{errors.confirm_password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    יוצר חשבון...
                  </>
                ) : (
                  'יצירת חשבון'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted mt-6">
              יש לך חשבון?{' '}
              <Link
                href="/login"
                className="font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded"
              >
                כניסה למערכת
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted mt-6">
            © {new Date().getFullYear()} Appointly — כל הזכויות שמורות
          </p>
        </div>
      </div>
    </>
  );
}
