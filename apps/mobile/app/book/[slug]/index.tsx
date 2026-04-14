import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { useBookingStore } from '@/store/booking';
import { BookingProgress } from '@/components/BookingProgress';
import { Card } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { formatPrice } from '@/lib/utils';
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

type ServiceItem = {
  id: string;
  name: string;
  description: string | null;
  duration_mins: number;
  price: unknown;
  category: { name: string } | null;
};

export default function ServicesScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const booking = useBookingStore((s) => s.booking);
  const setBooking = useBookingStore((s) => s.setBooking);
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError } = trpc.services.list.useQuery(
    { salon_id: booking.salon_id ?? '', include_inactive: false },
    { enabled: !!booking.salon_id },
  );

  // Group by category
  const services = (data ?? []) as ServiceItem[];
  const grouped = services.reduce<Record<string, ServiceItem[]>>((acc: Record<string, ServiceItem[]>, svc: ServiceItem) => {
    const cat = svc.category?.name ?? 'שירותים';
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(svc);
    return acc;
  }, {});

  function handleSelect(svc: ServiceItem) {
    setBooking({
      service_id: svc.id,
      service_name: svc.name,
      service_duration: svc.duration_mins,
      service_price: Number(svc.price),
    });
    router.push(`/book/${slug}/staff`);
  }

  return (
    <View style={styles.flex}>
      <BookingProgress currentStep={0} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.title}>{t('services_title')}</Text>
          <Text style={styles.subtitle}>{t('services_subtitle')}</Text>
        </View>

        {isError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{t('services_error')}</Text>
          </View>
        )}

        {isLoading
          ? [...Array(4)].map((_, i) => <SkeletonCard key={i} style={styles.skeleton} />)
          : Object.entries(grouped).map(([category, categoryServices]) => (
              <View key={category} style={styles.group}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryDot} />
                  <Text style={styles.categoryLabel}>{category}</Text>
                </View>
                <View style={styles.serviceList}>
                  {categoryServices.map((svc: ServiceItem) => (
                    <Card
                      key={svc.id}
                      onPress={() => handleSelect(svc)}
                      style={styles.card}
                    >
                      <View style={styles.cardInner}>
                        {/* Price badge */}
                        <View style={styles.priceWrap}>
                          <Text style={styles.price}>{formatPrice(svc.price)}</Text>
                        </View>

                        {/* Service details */}
                        <View style={styles.cardContent}>
                          <Text style={styles.serviceName}>{svc.name}</Text>
                          {svc.description ? (
                            <Text style={styles.serviceDesc} numberOfLines={2}>
                              {svc.description}
                            </Text>
                          ) : null}
                          <View style={styles.durationPill}>
                            <Text style={styles.durationText}>
                              ⏱ {svc.duration_mins} {t('minutes')}
                            </Text>
                          </View>
                        </View>

                        {/* Arrow */}
                        <View style={styles.arrowWrap}>
                          <Text style={styles.arrow}>‹</Text>
                        </View>
                      </View>
                    </Card>
                  ))}
                </View>
              </View>
            ))}

        {!isLoading && !services.length && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✂️</Text>
            <Text style={styles.emptyText}>{t('services_empty')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing[4],
    gap: spacing[5],
  },

  pageHeader: {
    gap: spacing[1],
    paddingBottom: spacing[2],
  },
  title: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['2xl'],
    color: colors.foreground,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'right',
  },

  group: { gap: spacing[2] },

  categoryHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[1],
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand[400],
  },
  categoryLabel: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.xs,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  serviceList: { gap: spacing[2] },

  card: { padding: 0, overflow: 'hidden' },
  cardInner: {
    flexDirection: 'row-reverse',
    alignItems: 'stretch',
    minHeight: 80,
  },

  priceWrap: {
    backgroundColor: colors.brand[600],
    paddingHorizontal: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  price: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.sm,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 18,
  },

  cardContent: {
    flex: 1,
    padding: spacing[4],
    gap: spacing[1],
  },
  serviceName: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.base,
    color: colors.foreground,
    textAlign: 'right',
    letterSpacing: -0.2,
  },
  serviceDesc: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'right',
    lineHeight: 17,
  },
  durationPill: {
    alignSelf: 'flex-end',
    backgroundColor: colors.surface.floating,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    marginTop: spacing[1],
  },
  durationText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.muted,
  },

  arrowWrap: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingEnd: spacing[3],
  },
  arrow: {
    fontSize: 22,
    color: colors.mutedForeground,
    transform: [{ scaleX: -1 }],
  },

  skeleton: { marginBottom: spacing[2] },

  errorBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    padding: spacing[4],
    gap: spacing[3],
  },
  errorIcon: { fontSize: 20 },
  errorText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.danger,
    textAlign: 'right',
    flex: 1,
  },

  empty: {
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[12],
  },
  emptyIcon: { fontSize: 40 },
  emptyText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
  },
});
