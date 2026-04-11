'use client';

import { Check, Minus, Zap, Mail } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSalon } from '@/lib/use-salon';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ─── Static plan definitions (from blueprint) ─────────────────────────────────

interface PlanDef {
  name: string;
  displayName: string;
  priceMonthly: number | null;
  highlight: boolean;
  badge?: string;
  features: {
    staff: string;
    services: string;
    bookings: string;
    products: boolean;
    promos: boolean;
    analytics: string;
    customWa: boolean;
    api: boolean;
  };
}

const PLANS: PlanDef[] = [
  {
    name: 'FREE',
    displayName: 'חינם',
    priceMonthly: 0,
    highlight: false,
    features: {
      staff: '1 עובד',
      services: 'עד 5 שירותים',
      bookings: 'עד 50 תורים/חודש',
      products: false,
      promos: false,
      analytics: 'בסיסי',
      customWa: false,
      api: false,
    },
  },
  {
    name: 'BASIC',
    displayName: 'בסיסי',
    priceMonthly: 79,
    highlight: false,
    features: {
      staff: 'עד 3 עובדים',
      services: 'עד 20 שירותים',
      bookings: 'עד 200 תורים/חודש',
      products: false,
      promos: false,
      analytics: 'בסיסי',
      customWa: false,
      api: false,
    },
  },
  {
    name: 'PRO',
    displayName: 'מקצועי',
    priceMonthly: 149,
    highlight: true,
    badge: 'הפופולרי ביותר',
    features: {
      staff: 'עד 10 עובדים',
      services: 'עד 50 שירותים',
      bookings: 'עד 500 תורים/חודש',
      products: true,
      promos: true,
      analytics: 'מלא',
      customWa: true,
      api: false,
    },
  },
  {
    name: 'ENTERPRISE',
    displayName: 'ארגוני',
    priceMonthly: null,
    highlight: false,
    features: {
      staff: 'ללא הגבלה',
      services: 'ללא הגבלה',
      bookings: 'ללא הגבלה',
      products: true,
      promos: true,
      analytics: 'מלא',
      customWa: true,
      api: true,
    },
  },
];

const FEATURE_ROWS: { key: keyof PlanDef['features']; label: string }[] = [
  { key: 'staff', label: 'עובדים' },
  { key: 'services', label: 'שירותים' },
  { key: 'bookings', label: 'תורים חודשיים' },
  { key: 'products', label: 'חנות מוצרים' },
  { key: 'promos', label: 'קודי הנחה' },
  { key: 'analytics', label: 'ניתוח נתונים' },
  { key: 'customWa', label: 'תבניות WhatsApp מותאמות' },
  { key: 'api', label: 'גישת API' },
];

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
    ) : (
      <Minus className="h-4 w-4 text-muted mx-auto" />
    );
  }
  return <span className="text-sm text-foreground">{value}</span>;
}

export function PlanPage() {
  const { salon, isLoading: salonLoading } = useSalon();

  const { data: salonFull, isLoading: fullLoading } = trpc.salons.getBySlug.useQuery(
    { slug: salon?.slug ?? '' },
    { enabled: !!salon?.slug },
  );

  const currentPlanName = salonFull?.plan?.name ?? null;
  const currentPlan = PLANS.find((p) => p.name === currentPlanName);

  if (salonLoading || fullLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tighter text-foreground">תוכנית</h1>
        <p className="text-sm text-muted mt-0.5">ניהול מנוי ושדרוג התוכנית</p>
      </div>

      {/* Current plan banner */}
      {currentPlan && (
        <div className="relative rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white shadow-card p-6 overflow-hidden">
          <div className="absolute top-0 start-0 w-full h-1 bg-gradient-to-r from-brand-500 to-brand-300" />
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted mb-1">התוכנית הנוכחית שלך</p>
              <h2 className="text-2xl font-bold tracking-tighter text-foreground">
                {currentPlan.displayName}
              </h2>
              {currentPlan.priceMonthly !== null && (
                <p className="text-sm text-muted mt-1">
                  {currentPlan.priceMonthly === 0
                    ? 'חינם'
                    : `₪${currentPlan.priceMonthly} לחודש`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="success" className="text-sm px-3 py-1">
                פעיל
              </Badge>
              {currentPlanName !== 'ENTERPRISE' && (
                <Button className="gap-2">
                  <Zap className="h-4 w-4" />
                  שדרג עכשיו
                </Button>
              )}
            </div>
          </div>

          {/* Quick limits */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { label: 'עובדים', value: currentPlan.features.staff },
              { label: 'שירותים', value: currentPlan.features.services },
              { label: 'תורים/חודש', value: currentPlan.features.bookings },
              {
                label: 'אנליטיקה',
                value: currentPlan.features.analytics,
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-border/50 p-3 text-center shadow-card">
                <p className="text-xs text-muted mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan comparison table */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50">
          <h2 className="text-lg font-bold tracking-tighter text-foreground">השוואת תוכניות</h2>
          <p className="text-sm text-muted mt-0.5">בחר את התוכנית המתאימה לסלון שלך</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-start px-6 py-4 text-sm font-semibold text-muted w-44" />
                {PLANS.map((plan) => (
                  <th key={plan.name} className="px-4 py-4 text-center">
                    <div className="space-y-1">
                      {plan.badge && (
                        <span className="inline-block text-xs bg-brand-600 text-white px-2 py-0.5 rounded-full font-medium">
                          {plan.badge}
                        </span>
                      )}
                      <p
                        className={`text-base font-bold tracking-tighter ${
                          plan.highlight ? 'text-brand-700' : 'text-foreground'
                        }`}
                      >
                        {plan.displayName}
                      </p>
                      <p className="text-sm text-muted">
                        {plan.priceMonthly === null
                          ? 'צור קשר'
                          : plan.priceMonthly === 0
                          ? 'חינם'
                          : `₪${plan.priceMonthly}/חודש`}
                      </p>
                      {plan.name === currentPlanName ? (
                        <Badge variant="secondary" className="text-xs">
                          התוכנית שלך
                        </Badge>
                      ) : plan.name === 'ENTERPRISE' ? (
                        <Button size="sm" variant="outline" className="gap-1 text-xs h-7 mt-1">
                          <Mail className="h-3 w-3" />
                          צור קשר
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant={plan.highlight ? 'default' : 'outline'}
                          className="text-xs h-7 mt-1"
                        >
                          שדרג
                        </Button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map(({ key, label }) => (
                <tr key={key} className="border-b border-border/30 last:border-0 hover:bg-surface-elevated/50 transition-colors">
                  <td className="px-6 py-3.5 text-sm text-muted font-medium">{label}</td>
                  {PLANS.map((plan) => (
                    <td
                      key={plan.name}
                      className={`px-4 py-3.5 text-center ${
                        plan.highlight ? 'bg-brand-50/30' : ''
                      }`}
                    >
                      <FeatureValue value={plan.features[key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-surface-elevated border-t border-border/30">
          <p className="text-xs text-muted text-center">
            לשדרוג או שאלות, צור קשר עם הצוות שלנו בכתובת{' '}
            <span className="text-brand-600 font-medium" dir="ltr">
              hello@appointly.co
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
