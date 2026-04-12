import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams, useSegments } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { useBookingStore } from '@/store/booking';
import { BookingHeader } from '@/components/BookingHeader';
import { Button } from '@/components/ui/Button';
import { colors, fontSize, radius, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

// Renders a full-screen gate when a private salon is accessed without a valid token.
function PrivateGate({ salonName }: { salonName: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.gateIcon}>🔒</Text>
      <Text style={styles.gateTitle}>{salonName}</Text>
      <Text style={styles.gateSub}>{t('booking_private_sub')}</Text>
      <Button
        variant="outline"
        size="md"
        onPress={() => router.replace('/discover' as never)}
        style={styles.gateBtn}
      >
        {t('booking_private_cta')}
      </Button>
    </View>
  );
}

export default function BookingLayout() {
  const { slug, invite, client } = useLocalSearchParams<{
    slug: string;
    invite?: string;
    client?: string;
  }>();
  const setBooking = useBookingStore((s) => s.setBooking);
  const resetBooking = useBookingStore((s) => s.resetBooking);

  const segments = useSegments();
  const isConfirmation = segments[segments.length - 1] === 'confirmation';

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
      setBooking({
        salon_id: salon.id,
        salon_name: salon.name,
        salon_timezone: salon.timezone,
        salon_slug: slug ?? '',
      });
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

  // Gate private salons: block unless the user has a client token or an invite token.
  const isPrivate = !(salon as unknown as { is_public?: boolean }).is_public;
  if (isPrivate && !client && !invite) {
    return <PrivateGate salonName={salon.name} />;
  }

  return (
    <View style={styles.flex}>
      <BookingHeader salonName={salon.name} logoUrl={salon.logo_url} showBack={!isConfirmation} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_left' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="staff" />
        <Stack.Screen name="datetime" />
        <Stack.Screen name="details" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="confirmation" options={{ gestureEnabled: false }} />
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
  gateIcon: { fontSize: 44, marginBottom: spacing[2] },
  gateTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.xl,
    color: colors.foreground,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: spacing[1],
  },
  gateSub: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[2],
  },
  gateBtn: { marginTop: spacing[3] },
});
