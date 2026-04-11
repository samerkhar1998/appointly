'use client';

import { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, Calendar, Users, XCircle, CheckCircle2, Award } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSalon } from '@/lib/use-salon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatPrice } from '@/lib/utils';

type Period = 'this_month' | 'last_month' | '3_months' | '6_months' | '12_months';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'this_month', label: 'החודש' },
  { value: 'last_month', label: 'חודש שעבר' },
  { value: '3_months', label: '3 חודשים' },
  { value: '6_months', label: '6 חודשים' },
  { value: '12_months', label: 'שנה' },
];

function getPeriodRange(period: Period): { from: Date; to: Date } {
  const now = new Date();
  switch (period) {
    case 'this_month':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };
    case 'last_month':
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
      };
    case '3_months':
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };
    case '6_months':
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 5, 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };
    case '12_months':
      return {
        from: new Date(now.getFullYear() - 1, now.getMonth() + 1, 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };
  }
}

const STATUS_PIE_COLORS = ['#10B981', '#EF4444', '#F59E0B', '#6B7280'];

const TYPE_LABEL_MAP: Record<string, string> = {
  PERCENTAGE: 'אחוז',
  FIXED: 'קבוע',
  FREE_SERVICE: 'שירות חינם',
  FREE_PRODUCT: 'מוצר חינם',
};

export function AnalyticsPage() {
  const { salon, isLoading: salonLoading } = useSalon();
  const [period, setPeriod] = useState<Period>('this_month');

  const range = useMemo(() => getPeriodRange(period), [period]);

  const enabled = !!salon?.id;

  const { data: overview, isLoading: overviewLoading } = trpc.analytics.overview.useQuery(
    {
      salon_id: salon?.id ?? '',
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    },
    { enabled },
  );

  const { data: topClients, isLoading: topClientsLoading } = trpc.analytics.topClients.useQuery(
    { salon_id: salon?.id ?? '', limit: 10 },
    { enabled },
  );

  const { data: promoPerf, isLoading: promoPerfLoading } = trpc.analytics.promoPerformance.useQuery(
    {
      salon_id: salon?.id ?? '',
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    },
    { enabled },
  );

  const pieData = useMemo(() => {
    if (!overview) return [];
    const other =
      overview.total_appointments -
      overview.completed_appointments -
      overview.cancelled_appointments;
    return [
      { name: 'הושלמו', value: overview.completed_appointments },
      { name: 'בוטלו', value: overview.cancelled_appointments },
      { name: 'אחר', value: Math.max(0, other) },
    ].filter((d) => d.value > 0);
  }, [overview]);

  const promoBarData = useMemo(() => {
    if (!promoPerf) return [];
    return promoPerf
      .map((p) => ({
        name: p.code,
        שימושים: p._count.usages,
        סכום: p.usages.reduce((sum, u) => sum + Number(u.discount_applied ?? 0), 0),
      }))
      .sort((a, b) => b['שימושים'] - a['שימושים'])
      .slice(0, 8);
  }, [promoPerf]);

  const loading = salonLoading || overviewLoading;

  return (
    <div className="space-y-8">
      {/* Header + period selector */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-foreground">ניתוח נתונים</h1>
          <p className="text-sm text-muted mt-0.5">ביצועי הסלון לפי תקופה</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-border rounded-xl p-1 shadow-card">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                period === p.value
                  ? 'bg-brand-600 text-white shadow-card'
                  : 'text-muted hover:text-foreground hover:bg-surface-elevated'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            title: 'תורים סה״כ',
            value: overview?.total_appointments ?? 0,
            icon: Calendar,
            format: (v: number) => String(v),
          },
          {
            title: 'הכנסה',
            value: overview?.total_revenue ?? 0,
            icon: TrendingUp,
            format: formatPrice,
          },
          {
            title: 'לקוחות חדשים',
            value: overview?.new_clients ?? 0,
            icon: Users,
            format: (v: number) => String(v),
          },
          {
            title: 'שיעור השלמה',
            value: overview?.completion_rate ?? 0,
            icon: CheckCircle2,
            format: (v: number) => `${v.toFixed(0)}%`,
          },
        ].map(({ title, value, icon: Icon, format }) => (
          <Card key={title} className="relative overflow-hidden">
            <div className="absolute top-0 start-0 w-full h-0.5 bg-gradient-to-r from-brand-500 to-brand-300 opacity-60" />
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-medium text-muted">{title}</CardTitle>
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-50">
                  <Icon className="w-4 h-4 text-brand-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24 mb-1" />
              ) : (
                <p className="text-3xl font-bold tracking-tighter text-foreground tabular-nums">
                  {format(value)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pie chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <XCircle className="w-4 h-4 text-brand-600" />
              התפלגות תורים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-52 w-full rounded-xl" />
            ) : pieData.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center">
                <Calendar className="w-8 h-8 text-muted opacity-40 mb-2" />
                <p className="text-sm text-muted">אין נתונים לתקופה זו</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={STATUS_PIE_COLORS[i % STATUS_PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, '']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {!loading && pieData.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {pieData.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-xs text-muted">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_PIE_COLORS[i % STATUS_PIE_COLORS.length] }}
                    />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top clients */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="w-4 h-4 text-brand-600" />
              לקוחות מובילים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topClientsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : !topClients?.length ? (
              <div className="py-8 text-center">
                <Users className="w-8 h-8 text-muted opacity-40 mx-auto mb-2" />
                <p className="text-sm text-muted">אין לקוחות עדיין</p>
              </div>
            ) : (
              <div className="space-y-1">
                {topClients.map((client, idx) => {
                  const initials = client.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <div
                      key={client.id}
                      className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0"
                    >
                      <span className="text-xs text-muted w-5 text-center tabular-nums">
                        {idx + 1}
                      </span>
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
                        {client.last_visit_at && (
                          <p className="text-xs text-muted">
                            ביקור אחרון:{' '}
                            {new Intl.DateTimeFormat('he-IL', {
                              day: 'numeric',
                              month: 'short',
                            }).format(new Date(client.last_visit_at))}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="tabular-nums shrink-0">
                        {client.total_visits} ביקורים
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Promo performance */}
      {(promoPerfLoading || (promoPerf && promoPerf.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              ביצועי קודי הנחה
            </CardTitle>
          </CardHeader>
          <CardContent>
            {promoPerfLoading ? (
              <Skeleton className="h-52 w-full rounded-xl" />
            ) : promoBarData.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">אין שימושים בקודי הנחה בתקופה זו</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={promoBarData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                      fontSize: '13px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="שימושים" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {!promoPerfLoading && promoPerf && promoPerf.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-start py-2 text-xs font-semibold text-muted">קוד</th>
                      <th className="text-start py-2 text-xs font-semibold text-muted">סוג</th>
                      <th className="text-end py-2 text-xs font-semibold text-muted">שימושים</th>
                      <th className="text-end py-2 text-xs font-semibold text-muted">
                        הנחה כוללת
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoPerf.map((p) => {
                      const totalDiscount = p.usages.reduce(
                        (sum, u) => sum + Number(u.discount_applied ?? 0),
                        0,
                      );
                      return (
                        <tr key={p.id} className="border-b border-border/30 last:border-0">
                          <td className="py-2.5">
                            <code className="text-xs font-mono font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-lg">
                              {p.code}
                            </code>
                          </td>
                          <td className="py-2.5 text-muted">
                            {TYPE_LABEL_MAP[p.type] ?? p.type}
                          </td>
                          <td className="py-2.5 text-end tabular-nums font-medium">
                            {p._count.usages}
                          </td>
                          <td className="py-2.5 text-end tabular-nums font-medium text-emerald-600">
                            {formatPrice(totalDiscount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
