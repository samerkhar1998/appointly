import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/auth';
import { Icon } from '@/components/ui/Icon';
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';
import { formatPrice } from '@/lib/utils';

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_mins: number;
  price: string | number;
  is_active: boolean;
  category: { name: string } | null;
};

function ServiceCard({ service }: { service: Service }) {
  return (
    <View style={[styles.serviceRow, !service.is_active && styles.serviceRowInactive]}>
      {/* Price badge */}
      <View style={[styles.priceBadge, !service.is_active && styles.priceBadgeInactive]}>
        <Text style={[styles.priceText, !service.is_active && styles.priceTextInactive]}>
          {formatPrice(service.price)}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.serviceInfo}>
        <View style={styles.serviceTop}>
          <Text style={[styles.serviceName, !service.is_active && styles.serviceNameInactive]} numberOfLines={1}>
            {service.name}
          </Text>
          {!service.is_active && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>לא פעיל</Text>
            </View>
          )}
        </View>
        {service.description ? (
          <Text style={styles.serviceDesc} numberOfLines={1}>{service.description}</Text>
        ) : null}
        <View style={styles.durationRow}>
          <Icon name="time-outline" size={11} color={colors.mutedForeground} />
          <Text style={styles.durationText}>{service.duration_mins} {t('minutes')}</Text>
          {service.category ? (
            <>
              <View style={styles.dot} />
              <Text style={styles.categoryText}>{service.category.name}</Text>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function SkeletonRow() {
  return (
    <View style={styles.serviceRow}>
      <View style={[styles.priceBadge, styles.skeleton, { width: 52, height: 48 }]} />
      <View style={styles.serviceInfo}>
        <View style={[styles.skeletonLine, { width: '55%', height: 14 }]} />
        <View style={[styles.skeletonLine, { width: '35%', height: 11, marginTop: 5 }]} />
      </View>
    </View>
  );
}

export default function OwnerServicesScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  // Get the owner's salon first to obtain salon_id
  const { data: salon } = trpc.salons.getMySalon.useQuery(undefined, {
    enabled: !!user && user.role === 'SALON_OWNER',
  });

  const { data, isLoading, isError } = trpc.services.list.useQuery(
    { salon_id: salon?.id ?? '', include_inactive: true },
    { enabled: !!salon?.id },
  );

  const services = (data ?? []) as Service[];

  // Group by category
  const grouped = services.reduce<Record<string, Service[]>>((acc, svc) => {
    const cat = svc.category?.name ?? 'שירותים';
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(svc);
    return acc;
  }, {});

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
          <Text style={styles.headerTitle}>{t('owner_services_title')}</Text>
          {!isLoading && (
            <Text style={styles.headerSub}>{services.length} שירותים</Text>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.listWrap}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
          </View>
        ) : isError ? (
          <View style={styles.empty}>
            <Icon name="close-circle" size={36} color={colors.muted} />
            <Text style={styles.emptyText}>{t('error_generic')}</Text>
          </View>
        ) : services.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="cut-outline" size={36} color={colors.brand[400]} />
            </View>
            <Text style={styles.emptyTitle}>{t('owner_services_empty')}</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([category, categoryServices]) => (
            <View key={category} style={styles.group}>
              <Text style={styles.groupLabel}>{category}</Text>
              <View style={styles.listWrap}>
                {categoryServices.map((svc) => (
                  <ServiceCard key={svc.id} service={svc} />
                ))}
              </View>
            </View>
          ))
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
    paddingTop: spacing[4],
    gap: spacing[5],
  },

  group: { gap: spacing[2] },
  groupLabel: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing[1],
  },
  listWrap: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },

  serviceRow: {
    flexDirection: 'row-reverse',
    alignItems: 'stretch',
    minHeight: 72,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.floating,
  },
  serviceRowInactive: { opacity: 0.55 },

  priceBadge: {
    backgroundColor: colors.brand[600],
    paddingHorizontal: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  priceBadgeInactive: { backgroundColor: colors.surface.floating },
  priceText: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.sm,
    color: colors.white,
    textAlign: 'center',
  },
  priceTextInactive: { color: colors.muted },

  serviceInfo: {
    flex: 1,
    padding: spacing[3],
    gap: spacing[0.5],
  },
  serviceTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[2],
  },
  serviceName: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.base,
    color: colors.foreground,
    textAlign: 'right',
    flex: 1,
  },
  serviceNameInactive: { color: colors.muted },
  inactiveBadge: {
    backgroundColor: colors.surface.floating,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inactiveBadgeText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 10,
    color: colors.muted,
  },
  serviceDesc: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'right',
  },
  durationRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  durationText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 10,
    color: colors.mutedForeground,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.mutedForeground,
  },
  categoryText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 10,
    color: colors.mutedForeground,
  },

  // Skeleton
  skeleton: { backgroundColor: colors.border },
  skeletonLine: {
    borderRadius: radius.sm,
    backgroundColor: colors.border,
    alignSelf: 'flex-end',
  },

  // Empty
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
  emptyText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
  },
});
