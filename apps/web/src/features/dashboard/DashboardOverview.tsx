'use client';

import { useMemo } from 'react';
import { Calendar, CheckCircle2, TrendingUp, Users, XCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatPrice, formatTime } from '@/lib/utils';

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  trend,
  loading,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  trend?: { label: string; positive: boolean };
  loading?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden">
      {/* Subtle gradient accent */}
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
          <p className="text-3xl font-bold tracking-tighter text-foreground tabular-nums">{value}</p>
        )}
        {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
            <TrendingUp className={`w-3 h-3 ${!trend.positive ? 'rotate-180' : ''}`} />
            {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AppointmentRow({
  name,
  service,
  time,
  status,
  timezone,
}: {
  name: string;
  service: string;
  time: Date;
  status: string;
  timezone: string;
}) {
  const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' }> = {
    PENDING: { label: 'ממתין', variant: 'warning' },
    CONFIRMED: { label: 'מאושר', variant: 'success' },
    CANCELLED: { label: 'בוטל', variant: 'destructive' },
    COMPLETED: { label: 'הושלם', variant: 'secondary' },
    NO_SHOW: { label: 'לא הגיע', variant: 'secondary' },
  };
  const s = statusMap[status] ?? { label: status, variant: 'secondary' as const };

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
        <p className="text-xs text-muted truncate">{service}</p>
      </div>
      <div className="text-end shrink-0">
        <p className="text-sm font-medium text-foreground tabular-nums">
          {formatTime(time, timezone)}
        </p>
        <Badge variant={s.variant} className="mt-0.5 text-xs">
          {s.label}
        </Badge>
      </div>
    </div>
  );
}

export function DashboardOverview() {
  const today = new Date();
  const fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const { data: me } = trpc.auth.me.useQuery(undefined, { retry: false });
  const salonId = me?.salon_members?.[0]?.salon?.id ?? '';
  const timezone = me?.salon_members?.[0]?.salon?.timezone ?? 'Asia/Jerusalem';

  const analyticsEnabled = !!salonId;

  const { data: analytics, isLoading: analyticsLoading } = trpc.analytics.overview.useQuery(
    { salon_id: salonId, from: fromDate.toISOString(), to: toDate.toISOString() },
    { enabled: analyticsEnabled },
  );

  const { data: todayAppts, isLoading: apptsLoading } = trpc.appointments.list.useQuery(
    {
      salon_id: salonId,
      date_from: new Date(today.setHours(0, 0, 0, 0)).toISOString(),
      date_to: new Date(today.setHours(23, 59, 59, 999)).toISOString(),
      per_page: 10,
    },
    { enabled: analyticsEnabled },
  );

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(fromDate),
    [fromDate],
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tighter text-foreground">סקירה כללית</h1>
        <p className="text-muted text-sm mt-1">{monthLabel}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="תורים החודש"
          value={analytics?.total_appointments ?? 0}
          icon={Calendar}
          loading={analyticsLoading}
        />
        <StatCard
          title="הכנסה החודש"
          value={formatPrice(analytics?.total_revenue ?? 0)}
          sub={`${analytics?.completion_rate?.toFixed(0) ?? 0}% שיעור השלמה`}
          icon={TrendingUp}
          loading={analyticsLoading}
          trend={
            analytics?.completed_appointments
              ? { label: `${analytics.completed_appointments} הושלמו`, positive: true }
              : undefined
          }
        />
        <StatCard
          title="לקוחות חדשים"
          value={analytics?.new_clients ?? 0}
          icon={Users}
          loading={analyticsLoading}
        />
        <StatCard
          title="בוטלו"
          value={analytics?.cancelled_appointments ?? 0}
          icon={XCircle}
          loading={analyticsLoading}
        />
      </div>

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" />
                תורים להיום
              </CardTitle>
              <Badge variant="secondary">
                {new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {apptsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : !todayAppts?.items.length ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-muted mx-auto mb-3 opacity-40" />
                <p className="text-muted text-sm">אין תורים להיום</p>
              </div>
            ) : (
              <div>
                {todayAppts.items.map((appt) => (
                  <AppointmentRow
                    key={appt.id}
                    name={appt.customer_name}
                    service={appt.service.name}
                    time={new Date(appt.start_datetime)}
                    status={appt.status}
                    timezone={timezone}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick stats sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted font-medium">ביצועי החודש</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analyticsLoading ? (
                <>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </>
              ) : (
                <>
                  <MetricRow
                    label="תורים שהושלמו"
                    value={analytics?.completed_appointments ?? 0}
                    color="text-emerald-600"
                  />
                  <MetricRow
                    label="שיעור ביטול"
                    value={`${analytics?.total_appointments ? Math.round(((analytics.cancelled_appointments ?? 0) / analytics.total_appointments) * 100) : 0}%`}
                    color="text-red-500"
                  />
                  <MetricRow
                    label="שיעור השלמה"
                    value={`${analytics?.completion_rate?.toFixed(0) ?? 0}%`}
                    color="text-brand-600"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-sm font-bold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
