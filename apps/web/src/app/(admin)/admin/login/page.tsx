'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/use-toast';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const loginMutation = trpc.admin.login.useMutation({
    onSuccess: (data) => {
      // Set the admin_token cookie from JS (the server also sets it via Set-Cookie)
      document.cookie = `admin_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
      toast({ title: 'Welcome back!', description: 'Redirecting to dashboard...' });
      router.push('/admin');
    },
    onError: (err) => {
      toast({ title: 'Login failed', description: err.message, variant: 'destructive' });
    },
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-[#0f172a]"
      dir="ltr"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 shadow-lg mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to Appointly Super Admin</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit((d) => loginMutation.mutate(d))} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  className={cn('pl-10', errors.email && 'border-red-400')}
                  placeholder="admin@example.com"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  className={cn('pl-10', errors.password && 'border-red-400')}
                  placeholder="••••••••"
                  {...register('password')}
                />
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? (
                <><Loader2 className="animate-spin w-4 h-4 mr-2" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
