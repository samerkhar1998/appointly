'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Users, Calendar, UserMinus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSalon } from '@/lib/use-salon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageUpload } from '@/components/ui/image-upload';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/lib/use-toast';

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

const createStaffSchema = z.object({
  display_name: z.string().min(1, 'שם נדרש').max(100),
  email: z.string().email('כתובת אימייל לא תקינה'),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional().nullable(),
  is_bookable: z.boolean().default(true),
});

type CreateStaffForm = z.infer<typeof createStaffSchema>;

export function StaffPage() {
  const { salon, isLoading: salonLoading } = useSalon();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data: staffList, isLoading } = trpc.staff.listAll.useQuery(
    { salon_id: salon?.id ?? '' },
    { enabled: !!salon?.id },
  );

  const createMutation = trpc.staff.createSimple.useMutation({
    onSuccess: () => {
      utils.staff.listAll.invalidate();
      setDialogOpen(false);
      toast({ title: 'איש צוות נוסף בהצלחה' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const updateMutation = trpc.staff.update.useMutation({
    onSuccess: () => {
      utils.staff.listAll.invalidate();
      toast({ title: 'עודכן' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const deactivateMutation = trpc.staff.deactivate.useMutation({
    onSuccess: () => {
      utils.staff.listAll.invalidate();
      setDeactivateId(null);
      toast({ title: 'איש הצוות הוסר' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const form = useForm<CreateStaffForm>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { display_name: '', email: '', avatar_url: null, is_bookable: true },
  });

  function onSubmit(values: CreateStaffForm) {
    if (!salon?.id) return;
    createMutation.mutate({
      salon_id: salon.id,
      display_name: values.display_name,
      email: values.email,
      bio: values.bio,
      is_bookable: values.is_bookable,
      ...(values.avatar_url ? { avatar_url: values.avatar_url } : {}),
    });
  }

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  if (salonLoading || isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/50 bg-white p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-foreground">צוות</h1>
            <p className="text-sm text-muted mt-0.5">{staffList?.length ?? 0} אנשי צוות</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            הוסף עובד
          </Button>
        </div>

        {/* Staff grid */}
        {!staffList?.length ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-white py-16 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-surface mb-3">
              <Users className="h-5 w-5 text-muted" />
            </div>
            <p className="font-medium text-foreground">אין אנשי צוות עדיין</p>
            <p className="text-sm text-muted mt-1">הוסף עובד ראשון כדי להתחיל</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((staff) => {
              const isActive = staff.salon_member.is_active;
              const workingDays = staff.schedules
                .filter((s) => s.is_working)
                .map((s) => DAY_NAMES[s.day_of_week])
                .join(' ');

              return (
                <div
                  key={staff.id}
                  className={`rounded-2xl border bg-white p-5 space-y-4 shadow-card transition-opacity ${
                    isActive ? 'border-border/50' : 'border-border/30 opacity-60'
                  }`}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        {staff.avatar_url && <AvatarImage src={staff.avatar_url} alt={staff.display_name} />}
                        <AvatarFallback className="text-sm font-semibold">
                          {getInitials(staff.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{staff.display_name}</p>
                        <p className="text-xs text-muted">{staff.salon_member.user.email}</p>
                      </div>
                    </div>
                    <Badge variant={isActive ? 'success' : 'secondary'}>
                      {isActive ? 'פעיל' : 'לא פעיל'}
                    </Badge>
                  </div>

                  {/* Bio */}
                  {staff.bio && (
                    <p className="text-sm text-muted line-clamp-2">{staff.bio}</p>
                  )}

                  {/* Schedule */}
                  {workingDays && (
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Calendar className="h-3.5 w-3.5" />
                      {workingDays}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">ניתן להזמנה</span>
                      <Switch
                        checked={staff.is_bookable}
                        onCheckedChange={(checked) =>
                          updateMutation.mutate({ staff_id: staff.id, data: { is_bookable: checked } })
                        }
                        disabled={!isActive}
                      />
                    </div>
                    {isActive && (
                      <button
                        onClick={() => setDeactivateId(staff.id)}
                        className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="הסר עובד"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add staff dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוספת עובד חדש</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Avatar upload */}
            <div className="flex items-center gap-4">
              <ImageUpload
                value={form.watch('avatar_url') ?? undefined}
                onChange={(url) => form.setValue('avatar_url', url || null)}
                folder="staff"
                aspect="square"
                label="תמונה"
                disabled={createMutation.isPending}
              />
              <p className="text-xs text-muted leading-relaxed">
                העלה תמונת פרופיל לאיש הצוות.<br />
                JPEG, PNG או WebP, עד 10 MB.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="display_name">שם תצוגה</Label>
              <Input
                id="display_name"
                placeholder="לדוגמה: יוסי כהן"
                {...form.register('display_name')}
              />
              {form.formState.errors.display_name && (
                <p className="text-xs text-red-500">{form.formState.errors.display_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">כתובת אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="yossi@example.com"
                dir="ltr"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">ביוגרפיה (אופציונלי)</Label>
              <Input id="bio" placeholder="תיאור קצר על העובד" {...form.register('bio')} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <Label htmlFor="is_bookable" className="cursor-pointer">
                ניתן להזמנה מלקוחות
              </Label>
              <Switch
                id="is_bookable"
                checked={form.watch('is_bookable')}
                onCheckedChange={(v) => form.setValue('is_bookable', v)}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
                {createMutation.isPending ? 'מוסיף...' : 'הוסף עובד'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                ביטול
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm deactivate dialog */}
      <Dialog open={!!deactivateId} onOpenChange={() => setDeactivateId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הסרת עובד</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted">
            האם אתה בטוח שברצונך להסיר את העובד? הוא לא יוכל יותר לקבל תורים.
          </p>
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={deactivateMutation.isPending}
              onClick={() => deactivateId && deactivateMutation.mutate({ staff_id: deactivateId })}
              className="w-full sm:w-auto"
            >
              {deactivateMutation.isPending ? 'מסיר...' : 'כן, הסר'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeactivateId(null)}
              className="w-full sm:w-auto"
            >
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
