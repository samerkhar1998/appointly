import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/auth';
import { Icon } from '@/components/ui/Icon';
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';
import type { IconName } from '@/components/ui/Icon';

type StatCardProps = {
  icon: IconName;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
};

function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <View style={[styles.statCard, accent && styles.statCardAccent]}>
      <View style={[styles.statIconWrap, accent && styles.statIconWrapAccent]}>
        <Icon name={icon} size={22} color={accent ? colors.white : colors.brand[600]} />
      </View>
      <View style={styles.statText}>
        <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
        <Text style={[styles.statLabel, accent && styles.statLabelAccent]}>{label}</Text>
        {sub ? <Text style={[styles.statSub, accent && styles.statSubAccent]}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function SkeletonStat() {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, styles.skeleton]} />
      <View style={styles.statText}>
        <View style={[styles.skeletonLine, { width: '50%', height: 22 }]} />
        <View style={[styles.skeletonLine, { width: '70%', height: 12, marginTop: 4 }]} />
      </View>
    </View>
  );
}

export default function OwnerAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const now = new Date();
  const monthLabel = now.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  // Build a full-month period
  const fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Get the owner's salon
  const { data: salon } = trpc.salons.getMySalon.useQuery(undefined, {
    enabled: !!user && user.role === 'SALON_OWNER',
  });

  const { data, isLoading, isError } = trpc.analytics.overview.useQuery(
    {
      salon_id: salon?.id ?? '',
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    },
    { enabled: !!salon?.id },
  );

  function formatRevenue(val: number): string {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(val);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]}
          hitSlop={12}
        >
          <Icon name="chevron-forward" size={22} color={colors.brand[600]} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t('owner_analytics_title')}</Text>
          <Text style={styles.headerSub}>{monthLabel}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : isError || !data ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="bar-chart-outline" size={36} color={colors.brand[400]} />
            </View>
            <Text style={styles.emptyTitle}>{t('owner_analytics_no_data')}</Text>
          </View>
        ) : (
          <>
            {/* Revenue — accent card */}
            <StatCard
              icon="wallet-outline"
              label={t('owner_analytics_revenue')}
              value={formatRevenue(data.total_revenue)}
              sub={monthLabel}
              accent
            />

            {/* Grid of smaller stats */}
            <View style={styles.grid}>
              <View style={styles.gridCell}>
                <StatCard
                  icon="calendar-outline"
                  label={t('owner_analytics_appointments')}
                  value={String(data.total_appointments)}
                />
              </View>
              <View style={styles.gridCell}>
                <StatCard
                  icon="people-outline"
                  label="לקוחות חדשים"
                  value={String(data.new_clients)}
                />
              </View>
            </View>

            {/* Completion rate */}
            <StatCard
              icon="trending-up"
              label="אחוז השלמה"
              value={`${Math.round(data.completion_rate)}%`}
              sub={`${data.completed_appointments} תורים הושלמו מתוך ${data.total_appointments}`}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing[3],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
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

  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    gap: spacing[4],
  },

  statCard: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[5],
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
    ...shadows.card,
  },
  statCardAccent: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[700],
    ...shadows.elevated,
    shadowColor: colors.brand[600],
  },
  statIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.xl,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconWrapAccent: {
    backgroundColor: colors.brand[500],
  },
  statText: { flex: 1, gap: spacing[0.5] },
  statValue: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['2xl'],
    color: colors.foreground,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  statValueAccent: { color: colors.white },
  statLabel: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'right',
  },
  statLabelAccent: { color: colors.brand[200] },
  statSub: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    textAlign: 'right',
  },
  statSubAccent: { color: colors.brand[300] },

  grid: {
    flexDirection: 'row-reverse',
    gap: spacing[3],
  },
  gridCell: { flex: 1 },

  skeleton: { backgroundColor: colors.border },
  skeletonLine: {
    borderRadius: radius.sm,
    backgroundColor: colors.border,
    alignSelf: 'flex-end',
  },

  empty: {
    alignItems: 'center',
    paddingVertical: spacing[16],
    gap: spacing[3],
  },
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
});
