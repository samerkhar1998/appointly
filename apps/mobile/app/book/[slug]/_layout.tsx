import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { useBookingStore } from '@/store/booking';
import { BookingHeader } from '@/components/BookingHeader';
import { colors, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

export default function BookingLayout() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const setBooking = useBookingStore((s) => s.setBooking);
  const resetBooking = useBookingStore((s) => s.resetBooking);

  const { data: salon, isLoading, isError } = trpc.salons.getBySlug.useQuery(
    { slug: slug ?? '' },
    { enabled: !!slug },
  );

  useEffect(() => {
    if (salon) {
      resetBooking({
        salon_id: salon.id,
        salon_name: salon.name,
        salon_timezone: salon.timezone,
        salon_slug: slug ?? '',
      });
      // Carry logo_url into booking context if needed for header
      setBooking({ salon_id: salon.id, salon_name: salon.name, salon_timezone: salon.timezone, salon_slug: slug ?? '' });
    }
  }, [salon, slug, resetBooking, setBooking]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand[600]} size="large" />
      </View>
    );
  }

  if (isError || !salon) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('error_generic')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <BookingHeader salonName={salon.name} logoUrl={salon.logo_url} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_left' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="staff" />
        <Stack.Screen name="datetime" />
        <Stack.Screen name="details" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="confirmation" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing[6],
  },
  errorText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
  },
});
