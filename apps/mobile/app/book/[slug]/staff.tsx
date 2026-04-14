import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { useBookingStore } from '@/store/booking';
import { BookingProgress } from '@/components/BookingProgress';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { initials } from '@/lib/utils';
import { colors, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

export default function StaffScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const booking = useBookingStore((s) => s.booking);
  const setBooking = useBookingStore((s) => s.setBooking);
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError } = trpc.staff.list.useQuery(
    { salon_id: booking.salon_id ?? '' },
    { enabled: !!booking.salon_id },
  );

  // Auto-skip when there's only one bookable staff
  useEffect(() => {
    if (data && data.length === 1 && data[0]) {
      setBooking({ staff_id: data[0].id, staff_name: data[0].display_name });
      router.replace(`/book/${slug}/datetime` as never);
    }
  }, [data, slug, setBooking]);

  function handleSelect(staffId: string | null, staffName: string | null) {
    setBooking({ staff_id: staffId, staff_name: staffName });
    router.push(`/book/${slug}/datetime` as never);
  }

  return (
    <View style={styles.flex}>
      <BookingProgress currentStep={1} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('staff_title')}</Text>
        <Text style={styles.subtitle}>{t('staff_subtitle')}</Text>

        {isError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{t('staff_error')}</Text>
          </View>
        )}

        {isLoading
          ? [...Array(3)].map((_, i) => <SkeletonCard key={i} style={styles.skeleton} />)
          : (
            <View style={styles.list}>
              {/* No preference option */}
              <Card onPress={() => handleSelect(null, null)} style={styles.card}>
                <View style={styles.cardInner}>
                  <View style={styles.shuffleIcon}>
                    <Text style={styles.shuffleEmoji}>🔀</Text>
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.staffName}>{t('staff_no_pref')}</Text>
                    <Text style={styles.staffBio}>{t('staff_no_pref_sub')}</Text>
                  </View>
                  <Text style={styles.chevron}>‹</Text>
                </View>
              </Card>

              {data?.map((staff) => (
                <Card
                  key={staff.id}
                  onPress={() => handleSelect(staff.id, staff.display_name)}
                  style={styles.card}
                >
                  <View style={styles.cardInner}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials(staff.display_name)}</Text>
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.staffName}>{staff.display_name}</Text>
                      {staff.bio ? (
                        <Text style={styles.staffBio} numberOfLines={2}>{staff.bio}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.chevron}>‹</Text>
                  </View>
                </Card>
              ))}
            </View>
          )}

        {!isLoading && !data?.length && (
          <Text style={styles.empty}>{t('staff_empty')}</Text>
        )}

        <Button variant="outline" onPress={() => router.back()}>
          {t('back')}
        </Button>
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

  list: { gap: spacing[2] },
  card: { padding: spacing[4] },
  cardInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[3],
  },
  cardText: { flex: 1, gap: 2 },
  staffName: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: 16,
    color: colors.foreground,
    textAlign: 'right',
  },
  staffBio: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 13,
    color: colors.muted,
    textAlign: 'right',
    lineHeight: 18,
  },
  chevron: {
    fontSize: 20,
    color: colors.mutedForeground,
    transform: [{ scaleX: -1 }],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Heebo_700Bold',
    fontSize: 14,
    color: colors.brand[700],
  },
  shuffleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand[50],
    borderWidth: 2,
    borderColor: colors.brand[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  shuffleEmoji: { fontSize: 18 },

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
