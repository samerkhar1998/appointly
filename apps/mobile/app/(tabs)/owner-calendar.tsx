import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/auth';
import { useAppointmentEvents } from '@/lib/use-appointment-events';
import { Icon } from '@/components/ui/Icon';
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';
import { formatTime } from '@/lib/utils';

type CalendarAppointment = {
  id: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  salon_client: { id: string; name: string; phone: string } | null;
  service: { id: string; name: string; duration_mins: number };
  staff: { id: string; display_name: string } | null;
};

// Returns a status colour based on appointment status string.
function statusColor(status: string): string {
  switch (status) {
    case 'CONFIRMED': return colors.success;
    case 'PENDING': return colors.warning;
    case 'COMPLETED': return colors.muted;
    default: return colors.muted;
  }
}

// Returns a localised status label for display in the pill.
function statusLabel(status: string): string {
  switch (status) {
    case 'CONFIRMED': return t('status_confirmed');
    case 'PENDING': return t('status_pending');
    case 'COMPLETED': return t('status_completed');
    default: return status;
  }
}

// Renders a single appointment row with time column and detail card.
function AppointmentRow({ appt }: { appt: CalendarAppointment }) {
  const tz = 'Asia/Jerusalem';
  const sc = statusColor(appt.status);

  return (
    <View style={styles.apptRow}>
      <View style={styles.timeCol}>
        <Text style={styles.timeText}>{formatTime(appt.start_datetime, tz)}</Text>
        <View style={[styles.timeDot, { backgroundColor: sc }]} />
      </View>
      <View style={[styles.apptCard, { borderStartColor: sc }]}>
        <View style={styles.apptTop}>
          <Text style={styles.apptName} numberOfLines={1}>
            {appt.salon_client?.name ?? 'לקוח'}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: sc + '22' }]}>
            <Text style={[styles.statusPillText, { color: sc }]}>{statusLabel(appt.status)}</Text>
          </View>
        </View>
        <Text style={styles.apptService} numberOfLines={1}>{appt.service.name}</Text>
        {appt.staff ? (
          <View style={styles.metaRow}>
            <Icon name="person-outline" size={12} color={colors.mutedForeground} />
            <Text style={styles.metaText}>{appt.staff.display_name}</Text>
          </View>
        ) : null}
        <View style={styles.metaRow}>
          <Icon name="time-outline" size={12} color={colors.mutedForeground} />
          <Text style={styles.metaText}>{appt.service.duration_mins} {t('minutes')}</Text>
        </View>
      </View>
    </View>
  );
}

// Skeleton placeholder row shown while loading.
function SkeletonRow() {
  return (
    <View style={styles.apptRow}>
      <View style={styles.timeCol}>
        <View style={[styles.skeletonLine, { width: 36, height: 14 }]} />
      </View>
      <View style={[styles.apptCard, styles.skeletonCard]}>
        <View style={[styles.skeletonLine, { width: '60%', height: 14 }]} />
        <View style={[styles.skeletonLine, { width: '40%', height: 11, marginTop: 6 }]} />
      </View>
    </View>
  );
}

// Owner Calendar tab — shows today's appointment schedule.
// Fetches the authenticated owner's salon then lists today's appointments.
export default function OwnerCalendarTab() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0] ?? '';
  const dateFrom = `${dateStr}T00:00:00.000Z`;
  const dateTo = `${dateStr}T23:59:59.999Z`;

  const utils = trpc.useUtils();

  const { data: salon } = trpc.salons.getMySalon.useQuery(undefined, {
    enabled: !!user && user.role === 'SALON_OWNER',
  });

  const { data, isLoading, isError } = trpc.appointments.listForCalendar.useQuery(
    { salon_id: salon?.id ?? '', date_from: dateFrom, date_to: dateTo },
    { enabled: !!salon?.id },
  );

  // Refresh today's appointments whenever a new booking or status change arrives.
  useAppointmentEvents(salon?.id ?? '', () => {
    void utils.appointments.listForCalendar.invalidate();
  });

  const appointments = (data ?? []) as CalendarAppointment[];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header — no back button in tab context */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t('owner_calendar_title')}</Text>
          <Text style={styles.headerSub}>{salon?.name ?? ''}</Text>
        </View>
      </View>

      {/* Date strip */}
      <View style={styles.dateStrip}>
        <Icon name="calendar-outline" size={16} color={colors.brand[600]} />
        <Text style={styles.dateText}>
          {today.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</>
        ) : isError ? (
          <View style={styles.empty}>
            <Icon name="close-circle" size={36} color={colors.muted} />
            <Text style={styles.emptyText}>{t('error_generic')}</Text>
          </View>
        ) : appointments.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="calendar-outline" size={36} color={colors.brand[400]} />
            </View>
            <Text style={styles.emptyTitle}>{t('owner_calendar_no_appointments')}</Text>
          </View>
        ) : (
          appointments.map((appt) => <AppointmentRow key={appt.id} appt={appt} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: { gap: 2 },
  headerTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['2xl'],
    color: colors.foreground,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'right',
  },

  dateStrip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.brand[50],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.brand[100],
  },
  dateText: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.brand[700],
  },

  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    gap: spacing[1],
  },

  apptRow: {
    flexDirection: 'row-reverse',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  timeCol: {
    width: 48,
    alignItems: 'flex-end',
    paddingTop: spacing[2],
    gap: spacing[1],
  },
  timeText: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'right',
  },
  timeDot: { width: 8, height: 8, borderRadius: 4, alignSelf: 'flex-end' },
  apptCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderStartWidth: 3,
    borderStartColor: colors.brand[600],
    padding: spacing[3],
    gap: spacing[1],
    ...shadows.card,
  },
  apptTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  apptName: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.base,
    color: colors.foreground,
    textAlign: 'right',
    flex: 1,
  },
  statusPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  statusPillText: { fontFamily: 'Heebo_500Medium', fontSize: 10 },
  apptService: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'right',
  },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing[1] },
  metaText: { fontFamily: 'Heebo_400Regular', fontSize: 10, color: colors.mutedForeground },

  skeletonCard: { borderStartWidth: 3, borderStartColor: colors.border },
  skeletonLine: { borderRadius: radius.sm, backgroundColor: colors.border, alignSelf: 'flex-end' },

  empty: { alignItems: 'center', paddingVertical: spacing[16], gap: spacing[3] },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.base,
    color: colors.muted,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
  },
});
