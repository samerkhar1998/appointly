import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { useBookingStore } from '@/store/booking';
import type { BookingState } from '@/store/booking';
import { Button } from '@/components/ui/Button';
import { formatDate, formatTime } from '@/lib/utils';
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowValue}>{value}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
  );
}

export default function ConfirmationScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const booking = useBookingStore((s) => s.booking);
  const setBooking = useBookingStore((s) => s.setBooking);
  const insets = useSafeAreaInsets();
  const didCreate = useRef(false);

  const createAppt = trpc.appointments.create.useMutation({
    onSuccess: (data: { appointment_id: string; cancel_token: string }) => {
      setBooking({ appointment_id: data.appointment_id, cancel_token: data.cancel_token });
    },
    onError: (err) => {
      // CONFLICT means a concurrent request booked the same slot first.
      // Navigate back to datetime selection so the user can pick a free slot.
      if (err.data?.code === 'CONFLICT') {
        router.replace(`/book/${slug}/datetime` as never);
      }
    },
  });

  useEffect(() => {
    if (didCreate.current) return;
    didCreate.current = true;

    const b = booking as BookingState;
    if (!b.verification_token || !b.service_id || !b.salon_id || !b.start_datetime) return;

    createAppt.mutate({
      service_id: b.service_id,
      staff_id: b.staff_id ?? null,
      start_datetime: b.start_datetime,
      customer_name: b.customer_name,
      customer_phone: b.customer_phone,
      customer_email: b.customer_email || undefined,
      verification_token: b.verification_token,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tz = booking.salon_timezone ?? 'Asia/Jerusalem';

  if (createAppt.isPending) {
    return (
      <View style={styles.loadingCenter}>
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.brand[600]} size="large" />
          <Text style={styles.loadingText}>{t('confirmation_loading')}</Text>
        </View>
      </View>
    );
  }

  if (createAppt.isError) {
    const isSlotTaken = createAppt.error.data?.code === 'CONFLICT';
    return (
      <View style={[styles.loadingCenter, { padding: spacing[6] }]}>
        <View style={styles.errorCard}>
          <Text style={styles.errorEmoji}>{isSlotTaken ? '🗓️' : '❌'}</Text>
          <Text style={styles.errorTitle}>
            {isSlotTaken ? t('slot_taken_title') : t('confirmation_error')}
          </Text>
          <Text style={styles.errorBody}>
            {isSlotTaken ? t('slot_taken_body') : createAppt.error.message}
          </Text>
          <Button
            onPress={() =>
              isSlotTaken
                ? router.replace(`/book/${slug}/datetime` as never)
                : router.replace(`/book/${slug}` as never)
            }
            style={styles.retryBtn}
          >
            {isSlotTaken ? t('slot_taken_cta') : t('retry')}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing[8], paddingBottom: insets.bottom + spacing[8] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Success hero */}
      <View style={styles.successHero}>
        <View style={styles.successRing}>
          <View style={styles.successInner}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
        </View>
        <Text style={styles.title}>{t('confirmation_title')}</Text>
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleIcon}>💬</Text>
          <Text style={styles.subtitle}>{t('confirmation_subtitle')}</Text>
        </View>
      </View>

      {/* Booking details card */}
      <View style={styles.detailsCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>פרטי התור</Text>
        </View>
        <View style={styles.cardBody}>
          <DetailRow label={t('confirmation_service')} value={booking.service_name ?? ''} />
          {booking.start_datetime && (
            <>
              <DetailRow
                label={t('confirmation_date')}
                value={formatDate(booking.start_datetime, tz)}
              />
              <DetailRow
                label={t('confirmation_time')}
                value={formatTime(booking.start_datetime, tz)}
              />
            </>
          )}
          {booking.staff_name && (
            <DetailRow label={t('confirmation_staff')} value={booking.staff_name} />
          )}
          {booking.salon_name && (
            <DetailRow label="סלון" value={booking.salon_name} />
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          onPress={() => router.replace(`/book/${slug}`)}
          variant="outline"
          size="lg"
        >
          {t('confirmation_book_another')}
        </Button>

        <Pressable
          onPress={() => router.replace('/(tabs)' as never)}
          style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.ghostText}>{t('confirmation_go_home')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  loadingCard: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[8],
    alignItems: 'center',
    gap: spacing[4],
    width: '100%',
    ...shadows.card,
  },
  loadingText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.base,
    color: colors.muted,
    textAlign: 'center',
  },

  errorCard: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    padding: spacing[8],
    alignItems: 'center',
    gap: spacing[3],
    width: '100%',
  },
  errorEmoji: { fontSize: 48 },
  errorTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.xl,
    color: colors.foreground,
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: { width: '80%', marginTop: spacing[2] },

  content: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[5],
    gap: spacing[6],
  },

  successHero: {
    alignItems: 'center',
    gap: spacing[3],
  },
  successRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.successLight,
    borderWidth: 3,
    borderColor: colors.successBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.elevated,
    shadowColor: colors.success,
  },
  successInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheck: {
    fontSize: 36,
    color: colors.white,
    fontFamily: 'Heebo_700Bold',
  },
  title: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['3xl'],
    color: colors.foreground,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  subtitleIcon: { fontSize: 18 },
  subtitle: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
  },

  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardHeader: {
    backgroundColor: colors.brand[600],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  cardHeaderText: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.white,
    textAlign: 'right',
    letterSpacing: 0.3,
  },
  cardBody: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.floating,
  },
  rowLabel: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  rowValue: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.foreground,
    textAlign: 'right',
    flex: 1,
    paddingEnd: spacing[3],
  },

  actions: {
    gap: spacing[3],
  },
  ghostBtn: {
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  ghostText: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.sm,
    color: colors.muted,
  },
});
