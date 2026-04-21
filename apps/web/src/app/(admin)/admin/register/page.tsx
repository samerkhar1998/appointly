'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/use-toast';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { Suspense } from 'react';

const schema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type FormData = z.infer<typeof schema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const registerMutation = trpc.admin.registerWithInvite.useMutation({
    onSuccess: () => {
      toast({ title: 'Account created!', description: 'You can now sign in.' });
      router.push('/admin/login');
    },
    onError: (err) => {
      toast({ title: 'Registration failed', description: err.message, variant: 'destructive' });
    },
  });

  if (!token) {
    return (
      <div className="text-center text-white">
        <p>Invalid or missing invite token.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((d) =>
        registerMutation.mutate({
          token,
          name: d.name,
          email: d.email,
          password: d.password,
        }),
      )}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <Input id="name" type="text" className={cn('pl-10', errors.name && 'border-red-400')} placeholder="Admin Name" {...register('name')} />
        </div>
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <Input id="email" type="email" dir="ltr" className={cn('pl-10', errors.email && 'border-red-400')} placeholder="admin@example.com" {...register('email')} />
        </div>
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <Input id="password" type="password" dir="ltr" className={cn('pl-10', errors.password && 'border-red-400')} placeholder="At least 8 characters" {...register('password')} />
        </div>
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm_password">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <Input id="confirm_password" type="password" dir="ltr" className={cn('pl-10', errors.confirm_password && 'border-red-400')} placeholder="Repeat password" {...register('confirm_password')} />
        </div>
        {errors.confirm_password && <p className="text-xs text-red-500">{errors.confirm_password.message}</p>}
      </div>

      <Button type="submit" className="w-full mt-2" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? (
          <><Loader2 className="animate-spin w-4 h-4 mr-2" /> Creating account...</>
        ) : (
          'Create Admin Account'
        )}
      </Button>
    </form>
  );
}

export default function AdminRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f172a]" dir="ltr">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 shadow-lg mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Admin Account</h1>
          <p className="text-slate-400 text-sm mt-1">Register with your invite link</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Suspense fallback={<div className="text-center text-muted">Loading...</div>}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
