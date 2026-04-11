import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { useBookingStore } from '@/store/booking';
import { BookingProgress } from '@/components/BookingProgress';
import { Card } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { formatPrice } from '@/lib/utils';
import { colors, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

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
  const grouped = (data ?? []).reduce<Record<string, typeof data>>((acc, svc) => {
    const cat = svc.category?.name ?? 'שירותים';
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(svc);
    return acc;
  }, {});

  function handleSelect(svc: NonNullable<typeof data>[0]) {
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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('services_title')}</Text>
        <Text style={styles.subtitle}>{t('services_subtitle')}</Text>

        {isError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{t('services_error')}</Text>
          </View>
        )}

        {isLoading
          ? [...Array(4)].map((_, i) => <SkeletonCard key={i} style={styles.skeleton} />)
          : Object.entries(grouped).map(([category, services]) => (
              <View key={category} style={styles.group}>
                <Text style={styles.categoryLabel}>{category}</Text>
                {services?.map((svc) => (
                  <Card key={svc.id} onPress={() => handleSelect(svc)} style={styles.card}>
                    <View style={styles.cardInner}>
                      <View style={styles.cardText}>
                        <Text style={styles.serviceName}>{svc.name}</Text>
                        {svc.description ? (
                          <Text style={styles.serviceDesc} numberOfLines={2}>
                            {svc.description}
                          </Text>
                        ) : null}
                        <View style={styles.meta}>
                          <Text style={styles.metaText}>
                            {svc.duration_mins} {t('minutes')}
                          </Text>
                          <Text style={styles.price}>{formatPrice(svc.price)}</Text>
                        </View>
                      </View>
                      <Text style={styles.chevron}>‹</Text>
                    </View>
                  </Card>
                ))}
              </View>
            ))}

        {!isLoading && !data?.length && (
          <Text style={styles.empty}>{t('services_empty')}</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing[4], gap: spacing[4] },

  title: {
    fontFamily: 'Heebo_700Bold',
    fontSize: 22,
    color: colors.foreground,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 14,
    color: colors.muted,
    textAlign: 'right',
  },

  group: { gap: spacing[2] },
  categoryLabel: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: 11,
    color: colors.muted,
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing[1],
  },

  card: { padding: spacing[4] },
  cardInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[3],
  },
  cardText: { flex: 1, gap: spacing[1] },
  serviceName: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: 16,
    color: colors.foreground,
    textAlign: 'right',
  },
  serviceDesc: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 13,
    color: colors.muted,
    textAlign: 'right',
    lineHeight: 18,
  },
  meta: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing[3], marginTop: spacing[1] },
  metaText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 12,
    color: colors.muted,
  },
  price: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: 13,
    color: colors.brand[600],
    backgroundColor: colors.brand[50],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  chevron: {
    fontSize: 20,
    color: colors.mutedForeground,
    transform: [{ scaleX: -1 }],
  },

  skeleton: { marginBottom: spacing[2] },

  errorBox: {
    backgroundColor: colors.dangerLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    padding: spacing[4],
  },
  errorText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 14,
    color: colors.danger,
    textAlign: 'right',
  },
  empty: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing[12],
  },
});
