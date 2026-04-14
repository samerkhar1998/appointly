import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBookingStore } from '@/store/booking';
import { BookingProgress } from '@/components/BookingProgress';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate, formatTime, normalisePhone } from '@/lib/utils';
import { colors, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

const schema = z.object({
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
  phone: z.string().min(9, 'מספר טלפון לא תקין'),
  email: z.string().email('אימייל לא תקין').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function DetailsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const booking = useBookingStore((s) => s.booking);
  const setBooking = useBookingStore((s) => s.setBooking);
  const insets = useSafeAreaInsets();

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: booking.customer_name ?? '',
      phone: booking.customer_phone ?? '',
      email: booking.customer_email ?? '',
    },
  });

  function onSubmit(data: FormData) {
    setBooking({
      customer_name: data.name,
      customer_phone: normalisePhone(data.phone),
      customer_email: data.email ?? '',
    });
    router.push(`/book/${slug}/otp` as never);
  }

  const tz = booking.salon_timezone ?? 'Asia/Jerusalem';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BookingProgress currentStep={3} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('details_title')}</Text>
        <Text style={styles.subtitle}>{t('details_subtitle')}</Text>

        {/* Booking summary */}
        {booking.service_name && booking.start_datetime && (
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>{t('details_summary')}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>שירות</Text>
              <Text style={styles.summaryValue}>{booking.service_name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>תאריך</Text>
              <Text style={styles.summaryValue}>{formatDate(booking.start_datetime, tz)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>שעה</Text>
              <Text style={styles.summaryValue}>{formatTime(booking.start_datetime, tz)}</Text>
            </View>
            {booking.staff_name && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>איש צוות</Text>
                <Text style={styles.summaryValue}>{booking.staff_name}</Text>
              </View>
            )}
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('details_name_label')}
                placeholder={t('details_name_placeholder')}
                value={value}
                onChangeText={onChange}
                autoComplete="name"
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('details_phone_label')}
                placeholder={t('details_phone_placeholder')}
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
                autoComplete="tel"
                error={errors.phone?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('details_email_label')}
                placeholder={t('details_email_placeholder')}
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email?.message}
              />
            )}
          />
        </View>

        <View style={styles.actions}>
          <Button onPress={handleSubmit(onSubmit)} size="lg">
            {t('details_cta')}
          </Button>
          <Button variant="outline" onPress={() => router.back()}>
            {t('back')}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing[4], gap: spacing[5] },

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

  summary: {
    backgroundColor: colors.brand[50],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.brand[100],
    padding: spacing[4],
    gap: spacing[2],
  },
  summaryLabel: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryKey: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 13,
    color: colors.muted,
  },
  summaryValue: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: 13,
    color: colors.foreground,
  },

  form: { gap: spacing[4] },
  actions: { gap: spacing[3] },
});
