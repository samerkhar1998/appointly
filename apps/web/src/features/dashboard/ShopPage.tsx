'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, ShoppingBag, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSalon } from '@/lib/use-salon';
import { ImageUpload } from '@/components/ui/image-upload';
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

const MAX_PRODUCT_PHOTOS = 5;

const productFormSchema = z.object({
  name: z.string().min(1, 'שם נדרש').max(100),
  description: z.string().max(1000).optional(),
  category_name: z.string().max(100).optional(),
  price: z.coerce.number().min(0, 'מחיר לא יכול להיות שלילי'),
  stock_quantity: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(0).nullable(),
  ),
  low_stock_alert_at: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(0).nullable(),
  ),
  fulfillment: z.enum(['PICKUP', 'DELIVERY', 'BOTH']),
  is_active: z.boolean(),
  photos: z.array(z.string().url()).default([]),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const FULFILLMENT_LABELS: Record<string, string> = {
  PICKUP: 'איסוף עצמי',
  DELIVERY: 'משלוח',
  BOTH: 'שניהם',
};

export function ShopPage() {
  const { salon, isLoading: salonLoading } = useSalon();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data: products, isLoading } = trpc.products.list.useQuery(
    { salon_id: salon?.id ?? '', include_inactive: true },
    { enabled: !!salon?.id },
  );

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      setDialogOpen(false);
      toast({ title: 'מוצר נוסף בהצלחה' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      setDialogOpen(false);
      setEditingId(null);
      toast({ title: 'מוצר עודכן' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const toggleMutation = trpc.products.toggle.useMutation({
    onSuccess: () => utils.products.list.invalidate(),
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      price: 0,
      stock_quantity: null,
      low_stock_alert_at: null,
      fulfillment: 'PICKUP',
      is_active: true,
      photos: [],
    },
  });

  function openCreate() {
    form.reset({
      name: '',
      price: 0,
      stock_quantity: null,
      low_stock_alert_at: null,
      fulfillment: 'PICKUP',
      is_active: true,
      photos: [],
    });
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(product: NonNullable<typeof products>[number]) {
    form.reset({
      name: product.name,
      description: product.description ?? undefined,
      category_name: product.category_name ?? undefined,
      price: parseFloat(String(product.price)),
      stock_quantity: product.stock_quantity,
      low_stock_alert_at: product.low_stock_alert_at,
      fulfillment: product.fulfillment as 'PICKUP' | 'DELIVERY' | 'BOTH',
      is_active: product.is_active,
      photos: product.photos ?? [],
    });
    setEditingId(product.id);
    setDialogOpen(true);
  }

  // Adds a newly uploaded photo URL to the photos array.
  // url: the Cloudinary URL returned after upload
  function handlePhotoAdded(url: string) {
    const current = form.getValues('photos') ?? [];
    if (url && !current.includes(url) && current.length < MAX_PRODUCT_PHOTOS) {
      form.setValue('photos', [...current, url]);
    }
  }

  // Removes a photo from the photos array by index.
  // index: the position to remove
  function handlePhotoRemoved(index: number) {
    const current = form.getValues('photos') ?? [];
    form.setValue('photos', current.filter((_, i) => i !== index));
  }

  function onSubmit(values: ProductFormValues) {
    if (!salon?.id) return;
    const payload = { ...values, currency: 'ILS' as const };
    if (editingId) {
      updateMutation.mutate({ product_id: editingId, data: payload });
    } else {
      createMutation.mutate({ salon_id: salon.id, data: payload });
    }
  }

  const isBusy = createMutation.isPending || updateMutation.isPending;

  if (salonLoading || isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="rounded-2xl border border-border/50 bg-white overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-border/50 last:border-0">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-24" />
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-foreground">חנות</h1>
            <p className="text-sm text-muted mt-0.5">{products?.length ?? 0} מוצרים</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            הוסף מוצר
          </Button>
        </div>

        <div className="rounded-2xl border border-border/50 bg-white shadow-card overflow-hidden">
          {!products?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-surface-elevated mb-3">
                <ShoppingBag className="h-5 w-5 text-muted" />
              </div>
              <p className="font-medium text-foreground">אין מוצרים עדיין</p>
              <p className="text-sm text-muted mt-1">הוסף מוצר ראשון לחנות שלך</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>תמונה</TableHead>
                  <TableHead>שם המוצר</TableHead>
                  <TableHead>קטגוריה</TableHead>
                  <TableHead>מחיר</TableHead>
                  <TableHead>מלאי</TableHead>
                  <TableHead>אספקה</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.photos?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.photos[0]}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover border border-border/50"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-border/50 flex items-center justify-center">
                          <ShoppingBag className="w-4 h-4 text-muted" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-muted mt-0.5 line-clamp-1">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category_name ? (
                        <Badge variant="secondary">{product.category_name}</Badge>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-foreground tabular-nums">
                        {formatPrice(parseFloat(String(product.price)))}
                      </span>
                    </TableCell>
                    <TableCell>
                      {product.stock_quantity !== null ? (
                        <span
                          className={`text-sm tabular-nums font-medium ${
                            product.stock_quantity === 0 ? 'text-red-500' : 'text-foreground'
                          }`}
                        >
                          {product.stock_quantity} יח׳
                        </span>
                      ) : (
                        <span className="text-muted text-xs">ללא הגבלה</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted">
                        {FULFILLMENT_LABELS[product.fulfillment] ?? product.fulfillment}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={product.is_active}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ product_id: product.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => openEdit(product)}
                        className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'עריכת מוצר' : 'הוספת מוצר חדש'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-name">שם המוצר</Label>
              <Input id="prod-name" placeholder="לדוגמה: שמפו מקצועי" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-description">תיאור (אופציונלי)</Label>
              <Input
                id="prod-description"
                placeholder="תיאור קצר של המוצר"
                {...form.register('description')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prod-category">קטגוריה (אופציונלי)</Label>
                <Input
                  id="prod-category"
                  placeholder="לדוגמה: טיפוח שיער"
                  {...form.register('category_name')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prod-price">מחיר (₪)</Label>
                <Input
                  id="prod-price"
                  type="number"
                  min={0}
                  step={0.01}
                  {...form.register('price')}
                />
                {form.formState.errors.price && (
                  <p className="text-xs text-red-500">{form.formState.errors.price.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prod-stock">מלאי (יח׳, ריק = ללא הגבלה)</Label>
                <Input
                  id="prod-stock"
                  type="number"
                  min={0}
                  placeholder="—"
                  {...form.register('stock_quantity')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prod-alert">התראת מלאי נמוך מ-</Label>
                <Input
                  id="prod-alert"
                  type="number"
                  min={0}
                  placeholder="—"
                  {...form.register('low_stock_alert_at')}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>אופן אספקה</Label>
              <Select
                value={form.watch('fulfillment')}
                onValueChange={(v) =>
                  form.setValue('fulfillment', v as 'PICKUP' | 'DELIVERY' | 'BOTH')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PICKUP">איסוף עצמי</SelectItem>
                  <SelectItem value="DELIVERY">משלוח</SelectItem>
                  <SelectItem value="BOTH">שניהם</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <Label htmlFor="prod-active" className="cursor-pointer">
                מוצר פעיל
              </Label>
              <Switch
                id="prod-active"
                checked={form.watch('is_active')}
                onCheckedChange={(v) => form.setValue('is_active', v)}
              />
            </div>

            {/* Product photos */}
            <div className="space-y-2">
              <Label>תמונות המוצר (עד {MAX_PRODUCT_PHOTOS})</Label>
              <div className="flex flex-wrap gap-2">
                {/* Existing photos */}
                {(form.watch('photos') ?? []).map((url, index) => (
                  <div key={url} className="relative group w-20 h-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`תמונה ${index + 1}`}
                      className="w-full h-full object-cover rounded-xl border border-border/50"
                    />
                    <button
                      type="button"
                      onClick={() => handlePhotoRemoved(index)}
                      aria-label="הסר תמונה"
                      className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {/* Add photo slot */}
                {(form.watch('photos') ?? []).length < MAX_PRODUCT_PHOTOS && (
                  <ImageUpload
                    value={undefined}
                    onChange={handlePhotoAdded}
                    folder="products"
                    aspect="square"
                    label="+ תמונה"
                    disabled={isBusy}
                  />
                )}
              </div>
              <p className="text-xs text-muted">לחץ על + להוספת תמונה. לחץ על תמונה קיימת להסרתה.</p>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isBusy} className="w-full sm:w-auto">
                {isBusy ? 'שומר...' : editingId ? 'שמור שינויים' : 'הוסף מוצר'}
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
