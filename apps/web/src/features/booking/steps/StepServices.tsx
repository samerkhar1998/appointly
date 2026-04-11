'use client';

import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { ChevronLeft, Clock } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  duration_mins: number;
  price: string | number;
  description?: string | null;
  category?: { name: string } | null;
}

interface Props {
  salonId: string;
  onSelect: (service: Service) => void;
}

export function StepServices({ salonId, onSelect }: Props) {
  const { data, isLoading, isError } = trpc.services.list.useQuery({
    salon_id: salonId,
    include_inactive: false,
  });

  // Group by category
  const grouped = (data ?? []).reduce<Record<string, Service[]>>((acc, svc) => {
    const cat = svc.category?.name ?? 'שירותים';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-250">
      <div>
        <h2 className="text-xl font-bold tracking-tighter text-foreground">בחר שירות</h2>
        <p className="text-sm text-muted mt-1">איזה שירות תרצה לקבוע?</p>
      </div>

      {isError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          שגיאה בטעינת השירותים. אנא נסה שוב.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        Object.entries(grouped).map(([category, services]) => (
          <div key={category}>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2 px-1">
              {category}
            </p>
            <div className="space-y-2">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => onSelect(service)}
                  className="w-full text-start"
                >
                  <Card className="p-4 flex items-center gap-4 hover:shadow-elevated hover:border-brand-200 active:scale-[0.99] transition-[transform,box-shadow,border-color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{service.name}</p>
                      {service.description && (
                        <p className="text-xs text-muted mt-0.5 leading-relaxed line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <Clock className="w-3 h-3" />
                          {service.duration_mins} דקות
                        </span>
                        <Badge variant="default" className="text-xs">
                          {formatPrice(service.price)}
                        </Badge>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-muted shrink-0" />
                  </Card>
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      {!isLoading && !data?.length && (
        <div className="py-12 text-center text-muted text-sm">
          אין שירותים זמינים כרגע.
        </div>
      )}
    </div>
  );
}
