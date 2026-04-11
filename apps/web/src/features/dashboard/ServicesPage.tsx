'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Tag, Clock, CircleDollarSign } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSalon } from '@/lib/use-salon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/lib/use-toast';
import { formatPrice } from '@/lib/utils';

const serviceSchema = z.object({
  name: z.string().min(1, 'שם שירות נדרש').max(100),
  description: z.string().max(500).optional(),
  duration_mins: z.coerce.number().int().min(5, 'מינימום 5 דקות').max(480),
  price: z.coerce.number().min(0, 'מחיר לא יכול להיות שלילי'),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  duration_mins: number;
  price: string;
  is_active: boolean;
  sort_order: number;
  category: { id: string; name: string } | null;
}

export function ServicesPage() {
  const { salon, isLoading: salonLoading } = useSalon();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);
  const utils = trpc.useUtils();

  const { data: services, isLoading } = trpc.services.list.useQuery(
    { salon_id: salon?.id ?? '', include_inactive: true },
    { enabled: !!salon?.id },
  );

  const createMutation = trpc.services.create.useMutation({
    onSuccess: () => {
      utils.services.list.invalidate();
      setDialogOpen(false);
      toast({ title: 'שירות נוסף בהצלחה' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const updateMutation = trpc.services.update.useMutation({
    onSuccess: () => {
      utils.services.list.invalidate();
      setDialogOpen(false);
      setEditingService(null);
      toast({ title: 'שירות עודכן' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const toggleMutation = trpc.services.toggle.useMutation({
    onSuccess: () => utils.services.list.invalidate(),
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: '', duration_mins: 30, price: 0, is_active: true, sort_order: 0 },
  });

  function openCreate() {
    form.reset({ name: '', duration_mins: 30, price: 0, is_active: true, sort_order: 0 });
    setEditingService(null);
    setDialogOpen(true);
  }

  function openEdit(service: ServiceRow) {
    form.reset({
      name: service.name,
      description: service.description ?? undefined,
      duration_mins: service.duration_mins,
      price: parseFloat(service.price),
      is_active: service.is_active,
      sort_order: service.sort_order,
    });
    setEditingService(service);
    setDialogOpen(true);
  }

  function onSubmit(values: ServiceFormValues) {
    if (!salon?.id) return;
    if (editingService) {
      updateMutation.mutate({ service_id: editingService.id, data: values });
    } else {
      createMutation.mutate({ salon_id: salon.id, data: values });
    }
  }

  const isBusy = createMutation.isPending || updateMutation.isPending;

  if (salonLoading || isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="rounded-2xl border border-border/50 bg-white overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-border/50 last:border-0">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-20" />
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
            <h1 className="text-2xl font-bold tracking-tighter text-foreground">שירותים</h1>
            <p className="text-sm text-muted mt-0.5">{services?.length ?? 0} שירותים במערכת</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            הוסף שירות
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border/50 bg-white shadow-card overflow-hidden">
          {!services?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-surface mb-3">
                <Tag className="h-5 w-5 text-muted" />
              </div>
              <p className="font-medium text-foreground">אין שירותים עדיין</p>
              <p className="text-sm text-muted mt-1">הוסף שירות ראשון כדי להתחיל</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם השירות</TableHead>
                  <TableHead>קטגוריה</TableHead>
                  <TableHead>משך</TableHead>
                  <TableHead>מחיר</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-muted mt-0.5 line-clamp-1">{service.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.category ? (
                        <Badge variant="secondary">{service.category.name}</Badge>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm text-foreground">
                        <Clock className="h-3.5 w-3.5 text-muted" />
                        {service.duration_mins} דק׳
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                        <CircleDollarSign className="h-3.5 w-3.5 text-muted" />
                        {formatPrice(parseFloat(service.price))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={service.is_active}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ service_id: service.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => openEdit(service as ServiceRow)}
                        className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
                        aria-label="ערוך"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'עריכת שירות' : 'הוספת שירות חדש'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">שם השירות</Label>
              <Input id="name" placeholder="לדוגמה: עיצוב שיער" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">תיאור (אופציונלי)</Label>
              <Input id="description" placeholder="תיאור קצר של השירות" {...form.register('description')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="duration_mins">משך (דקות)</Label>
                <Input
                  id="duration_mins"
                  type="number"
                  min={5}
                  max={480}
                  {...form.register('duration_mins')}
                />
                {form.formState.errors.duration_mins && (
                  <p className="text-xs text-red-500">{form.formState.errors.duration_mins.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">מחיר (₪)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={0.01}
                  {...form.register('price')}
                />
                {form.formState.errors.price && (
                  <p className="text-xs text-red-500">{form.formState.errors.price.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sort_order">סדר תצוגה</Label>
              <Input id="sort_order" type="number" min={0} {...form.register('sort_order')} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <Label htmlFor="is_active" className="cursor-pointer">
                שירות פעיל
              </Label>
              <Switch
                id="is_active"
                checked={form.watch('is_active')}
                onCheckedChange={(v) => form.setValue('is_active', v)}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isBusy} className="w-full sm:w-auto">
                {isBusy ? 'שומר...' : editingService ? 'שמור שינויים' : 'הוסף שירות'}
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
    </>
  );
}
