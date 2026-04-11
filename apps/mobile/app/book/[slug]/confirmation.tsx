import { useEffect, useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { useBookingStore } from '@/store/booking';
import type { BookingState } from '@/store/booking';
import { Button } from '@/components/ui/Button';
import { formatDate, formatTime } from '@/lib/utils';
import { colors, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

export default function ConfirmationScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const booking = useBookingStore((s) => s.booking);
  const setBooking = useBookingStore((s) => s.setBooking);
  const insets = useSafeAreaInsets();
  const didCreate = useRef(false);

  const createAppt = trpc.appointments.create.useMutation({
    onSuccess: (data) => {
      setBooking({ appointment_id: data.appointment_id, cancel_token: data.cancel_token });
    },
  });

  useEffect(() => {
    if (didCreate.current) return;
    didCreate.current = true;

    const b = booking as BookingState;
    if (!b.verification_token || !b.service_id || !b.salon_id || !b.start_datetime) return;

    createAppt.mutate({
      salon_id: b.salon_id,
      service_id: b.service_id,
      staff_id: b.staff_id ?? undefined,
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
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand[600]} size="large" />
        <Text style={styles.loadingText}>{t('confirmation_loading')}</Text>
      </View>
    );
  }

  if (createAppt.isError) {
    return (
      <View style={[styles.center, { padding: spacing[6] }]}>
        <Text style={styles.errorEmoji}>❌</Text>
        <Text style={styles.errorTitle}>{t('confirmation_error')}</Text>
        <Text style={styles.errorBody}>{createAppt.error.message}</Text>
        <Button onPress={() => router.replace(`/book/${slug}`)} style={styles.retryBtn}>
          {t('retry')}
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing[8], paddingBottom: insets.bottom + spacing[8] },
      ]}
    >
      {/* Success illustration */}
      <View style={styles.successIcon}>
        <Text style={styles.successEmoji}>✅</Text>
      </View>

      <Text style={styles.title}>{t('confirmation_title')}</Text>
      <Text style={styles.subtitle}>{t('confirmation_subtitle')}</Text>

      {/* Booking details card */}
      <View style={styles.card}>
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
      </View>

      <Button
        onPress={() => router.replace(`/book/${slug}`)}
        variant="outline"
        size="lg"
        style={styles.newBtn}
      >
        {t('confirmation_book_another')}
      </Button>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.floating,
  },
  label: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 13,
    color: colors.muted,
  },
  value: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: 14,
    color: colors.foreground,
    textAlign: 'right',
    flex: 1,
    paddingEnd: spacing[3],
  },
});

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
  loadingText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 14,
    color: colors.muted,
  },
  errorEmoji: { fontSize: 48 },
  errorTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: 20,
    color: colors.foreground,
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  retryBtn: { width: '80%' },

  content: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    gap: spacing[5],
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successLight,
    borderWidth: 2,
    borderColor: colors.successBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successEmoji: { fontSize: 36 },

  title: {
    fontFamily: 'Heebo_700Bold',
    fontSize: 26,
    color: colors.foreground,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },

  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[5],
  },

  newBtn: { width: '100%' },
});
