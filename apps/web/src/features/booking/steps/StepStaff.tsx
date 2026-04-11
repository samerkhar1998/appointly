'use client';

import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Shuffle } from 'lucide-react';

interface StaffMember {
  id: string;
  display_name: string;
  bio?: string | null;
  avatar_url?: string | null;
}

interface Props {
  salonId: string;
  onSelect: (staff: StaffMember | null) => void;
  onBack: () => void;
  /** When true, auto-skips this step if only 1 bookable staff exists */
  autoSkipSingle?: boolean;
}

export function StepStaff({ salonId, onSelect, onBack, autoSkipSingle = true }: Props) {
  const { data, isLoading, isError } = trpc.staff.list.useQuery({ salon_id: salonId });

  // Auto-skip when only 1 bookable staff member — no choice to make
  useEffect(() => {
    if (autoSkipSingle && data && data.length === 1 && data[0]) {
      onSelect(data[0]);
    }
  }, [autoSkipSingle, data, onSelect]);

  const initials = (name: string) =>
    name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-250">
      <div>
        <h2 className="text-xl font-bold tracking-tighter text-foreground">בחר איש צוות</h2>
        <p className="text-sm text-muted mt-1">עם מי תרצה לקבוע את התור?</p>
      </div>

      {isError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          שגיאה בטעינת אנשי הצוות. אנא נסה שוב.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {/* "No preference" option — let the system pick any available staff */}
          <button className="w-full text-start" onClick={() => onSelect(null)}>
            <Card className="p-4 flex items-center gap-4 hover:shadow-elevated hover:border-brand-200 active:scale-[0.99] transition-[transform,box-shadow,border-color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-50 border-2 border-brand-200 shrink-0">
                <Shuffle className="w-4 h-4 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">ללא העדפה</p>
                <p className="text-xs text-muted mt-0.5">הזמן הפנוי המוקדם ביותר</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-muted shrink-0" />
            </Card>
          </button>

          {data?.map((staff) => (
            <button key={staff.id} className="w-full text-start" onClick={() => onSelect(staff)}>
              <Card className="p-4 flex items-center gap-4 hover:shadow-elevated hover:border-brand-200 active:scale-[0.99] transition-[transform,box-shadow,border-color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={staff.avatar_url ?? undefined} alt={staff.display_name} />
                  <AvatarFallback className="bg-brand-100 text-brand-700 font-semibold text-xs">
                    {initials(staff.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{staff.display_name}</p>
                  {staff.bio && (
                    <p className="text-xs text-muted mt-0.5 leading-relaxed line-clamp-2">
                      {staff.bio}
                    </p>
                  )}
                </div>
                <ChevronLeft className="w-4 h-4 text-muted shrink-0" />
              </Card>
            </button>
          ))}
        </div>
      )}

      {!isLoading && !data?.length && (
        <div className="py-12 text-center text-muted text-sm">אין אנשי צוות זמינים כרגע.</div>
      )}

      <Button variant="outline" className="w-full" onClick={onBack}>
        חזור
      </Button>
    </div>
  );
}
