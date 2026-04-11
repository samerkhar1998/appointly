'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Tag, Copy, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSalon } from '@/lib/use-salon';
import { createPromoCodeSchema } from '@appointly/shared';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/lib/use-toast';
import { formatPrice } from '@/lib/utils';

type PromoFormValues = z.infer<typeof createPromoCodeSchema>;

const TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: 'אחוז הנחה',
  FIXED: 'הנחה קבועה',
  FREE_SERVICE: 'שירות חינם',
  FREE_PRODUCT: 'מוצר חינם',
};

const APPLIES_LABELS: Record<string, string> = {
  BOOKINGS: 'הזמנות',
  PRODUCTS: 'מוצרים',
  BOTH: 'הכל',
};

function formatPromoValue(promo: {
  type: string;
  value: string | null;
  free_service: { name: string } | null;
  free_product: { name: string } | null;
}) {
  if (promo.type === 'PERCENTAGE') return `${promo.value}%`;
  if (promo.type === 'FIXED') return formatPrice(Number(promo.value ?? 0));
  if (promo.type === 'FREE_SERVICE') return promo.free_service?.name ?? '—';
  if (promo.type === 'FREE_PRODUCT') return promo.free_product?.name ?? '—';
  return '—';
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded text-muted hover:text-brand-600 transition-colors duration-150"
      aria-label="העתק קוד"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function PromosPage() {
  const { salon, isLoading: salonLoading } = useSalon();
  const [dialogOpen, setDialogOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: promos, isLoading } = trpc.promoCodes.list.useQuery(
    { salon_id: salon?.id ?? '' },
    { enabled: !!salon?.id },
  );

  const { data: services } = trpc.services.list.useQuery(
    { salon_id: salon?.id ?? '', include_inactive: false },
    { enabled: !!salon?.id && dialogOpen },
  );

  const { data: products } = trpc.products.list.useQuery(
    { salon_id: salon?.id ?? '', include_inactive: false },
    { enabled: !!salon?.id && dialogOpen },
  );

  const createMutation = trpc.promoCodes.create.useMutation({
    onSuccess: () => {
      utils.promoCodes.list.invalidate();
      setDialogOpen(false);
      toast({ title: 'קוד הנחה נוסף בהצלחה' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const toggleMutation = trpc.promoCodes.toggle.useMutation({
    onSuccess: () => utils.promoCodes.list.invalidate(),
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const form = useForm<PromoFormValues>({
    resolver: zodResolver(createPromoCodeSchema),
    defaultValues: {
      code: '',
      type: 'PERCENTAGE',
      applies_to: 'BOTH',
      first_time_only: false,
      is_active: true,
    },
  });

  const watchedType = form.watch('type');

  function openCreate() {
    form.reset({
      code: '',
      type: 'PERCENTAGE',
      applies_to: 'BOTH',
      first_time_only: false,
      is_active: true,
    });
    setDialogOpen(true);
  }

  function onSubmit(values: PromoFormValues) {
    if (!salon?.id) return;
    createMutation.mutate({ salon_id: salon.id, data: values });
  }

  function formatDate(date: Date | string | null) {
    if (!date) return null;
    return new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(date),
    );
  }

  if (salonLoading || isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="rounded-2xl border border-border/50 bg-white overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-border/50 last:border-0">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-foreground">קודי הנחה</h1>
            <p className="text-sm text-muted mt-0.5">{promos?.length ?? 0} קודים פעילים</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            הוסף קוד הנחה
          </Button>
        </div>

        <div className="rounded-2xl border border-border/50 bg-white shadow-card overflow-hidden">
          {!promos?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-surface-elevated mb-3">
                <Tag className="h-5 w-5 text-muted" />
              </div>
              <p className="font-medium text-foreground">אין קודי הנחה עדיין</p>
              <p className="text-sm text-muted mt-1">צור קוד הנחה ראשון ללקוחות שלך</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>קוד</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead>ערך</TableHead>
                  <TableHead>חל על</TableHead>
                  <TableHead>תוקף</TableHead>
                  <TableHead>שימושים</TableHead>
                  <TableHead>סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promos.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <code className="text-sm font-mono font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-lg">
                          {promo.code}
                        </code>
                        <CopyButton text={promo.code} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{TYPE_LABELS[promo.type] ?? promo.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-foreground">
                        {formatPromoValue(promo)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted">
                        {APPLIES_LABELS[promo.applies_to] ?? promo.applies_to}
                      </span>
                    </TableCell>
                    <TableCell>
                      {promo.valid_until ? (
                        <span className="text-sm text-muted">{formatDate(promo.valid_until)}</span>
                      ) : (
                        <span className="text-muted text-xs">ללא הגבלה</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm tabular-nums text-muted">
                        {promo.times_used}
                        {promo.max_uses_total !== null ? ` / ${promo.max_uses_total}` : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={promo.is_active}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ promo_id: promo.id, is_active: checked })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>הוספת קוד הנחה</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Code */}
            <div className="space-y-1.5">
              <Label htmlFor="promo-code">קוד הנחה</Label>
              <Input
                id="promo-code"
                placeholder="לדוגמה: SUMMER25"
                dir="ltr"
                className="font-mono uppercase"
                {...form.register('code', {
                  onChange: (e) => {
                    e.target.value = e.target.value.toUpperCase();
                  },
                })}
              />
              {form.formState.errors.code && (
                <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>
              )}
            </div>

            {/* Type + Value */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>סוג ההנחה</Label>
                <Select
                  value={watchedType}
                  onValueChange={(v) =>
                    form.setValue('type', v as PromoFormValues['type'], { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">אחוז הנחה</SelectItem>
                    <SelectItem value="FIXED">הנחה קבועה (₪)</SelectItem>
                    <SelectItem value="FREE_SERVICE">שירות חינם</SelectItem>
                    <SelectItem value="FREE_PRODUCT">מוצר חינם</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(watchedType === 'PERCENTAGE' || watchedType === 'FIXED') && (
                <div className="space-y-1.5">
                  <Label htmlFor="promo-value">
                    {watchedType === 'PERCENTAGE' ? 'אחוז (%)' : 'סכום (₪)'}
                  </Label>
                  <Input
                    id="promo-value"
                    type="number"
                    min={0}
                    max={watchedType === 'PERCENTAGE' ? 100 : undefined}
                    step={watchedType === 'FIXED' ? 0.01 : 1}
                    dir="ltr"
                    {...form.register('value', { valueAsNumber: true })}
                  />
                  {form.formState.errors.value && (
                    <p className="text-xs text-red-500">{form.formState.errors.value.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Free service selector */}
            {watchedType === 'FREE_SERVICE' && (
              <div className="space-y-1.5">
                <Label>שירות חינם</Label>
                <Select
                  value={form.watch('free_service_id') ?? ''}
                  onValueChange={(v) => form.setValue('free_service_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר שירות..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.free_service_id && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.free_service_id.message}
                  </p>
                )}
              </div>
            )}

            {/* Free product selector */}
            {watchedType === 'FREE_PRODUCT' && (
              <div className="space-y-1.5">
                <Label>מוצר חינם</Label>
                <Select
                  value={form.watch('free_product_id') ?? ''}
                  onValueChange={(v) => form.setValue('free_product_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מוצר..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.free_product_id && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.free_product_id.message}
                  </p>
                )}
              </div>
            )}

            {/* Applies to */}
            <div className="space-y-1.5">
              <Label>חל על</Label>
              <Select
                value={form.watch('applies_to')}
                onValueChange={(v) =>
                  form.setValue('applies_to', v as PromoFormValues['applies_to'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOOKINGS">הזמנות בלבד</SelectItem>
                  <SelectItem value="PRODUCTS">מוצרים בלבד</SelectItem>
                  <SelectItem value="BOTH">הזמנות ומוצרים</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Validity dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="promo-from">תאריך התחלה (אופציונלי)</Label>
                <Input
                  id="promo-from"
                  type="date"
                  dir="ltr"
                  {...form.register('valid_from', {
                    setValueAs: (v) =>
                      v ? new Date(v).toISOString() : undefined,
                  })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promo-until">תאריך סיום (אופציונלי)</Label>
                <Input
                  id="promo-until"
                  type="date"
                  dir="ltr"
                  {...form.register('valid_until', {
                    setValueAs: (v) =>
                      v ? new Date(v).toISOString() : undefined,
                  })}
                />
              </div>
            </div>

            {/* Usage limits */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="promo-max-total">שימושים מקסימלי (סה״כ)</Label>
                <Input
                  id="promo-max-total"
                  type="number"
                  min={1}
                  placeholder="ללא הגבלה"
                  {...form.register('max_uses_total', {
                    setValueAs: (v) => (v === '' ? undefined : Number(v)),
                  })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promo-max-per">שימושים מקסימלי (ללקוח)</Label>
                <Input
                  id="promo-max-per"
                  type="number"
                  min={1}
                  placeholder="ללא הגבלה"
                  {...form.register('max_uses_per_client', {
                    setValueAs: (v) => (v === '' ? undefined : Number(v)),
                  })}
                />
              </div>
            </div>

            {/* Min spend */}
            <div className="space-y-1.5">
              <Label htmlFor="promo-min-spend">רכישה מינימלית (₪, אופציונלי)</Label>
              <Input
                id="promo-min-spend"
                type="number"
                min={0}
                step={0.01}
                placeholder="—"
                dir="ltr"
                {...form.register('min_spend', {
                  setValueAs: (v) => (v === '' ? undefined : Number(v)),
                })}
              />
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <Label htmlFor="promo-first-time" className="cursor-pointer">
                  לקוחות חדשים בלבד
                </Label>
                <Switch
                  id="promo-first-time"
                  checked={form.watch('first_time_only')}
                  onCheckedChange={(v) => form.setValue('first_time_only', v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <Label htmlFor="promo-active" className="cursor-pointer">
                  קוד פעיל
                </Label>
                <Switch
                  id="promo-active"
                  checked={form.watch('is_active')}
                  onCheckedChange={(v) => form.setValue('is_active', v)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
                {createMutation.isPending ? 'שומר...' : 'הוסף קוד הנחה'}
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
