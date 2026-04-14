import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';
import { formatDate, formatTime } from '@/lib/utils';

const PHONE_KEY = '@appointly/customer_phone';

type Appointment = {
  id: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  customer_name: string;
  salon: { id: string; slug: string; name: string; city: string | null; logo_url: string | null };
  service: { id: string; name: string; duration_mins: number; price: unknown };
  staff_name: string | null;
};

// Card showing a single upcoming appointment
function AppointmentCard({ appt }: { appt: Appointment }) {
  const tz = 'Asia/Jerusalem';
  const isPast = new Date(appt.start_datetime) < new Date();

  return (
    <Pressable
      style={({ pressed }) => [styles.apptCard, pressed && styles.apptCardPressed]}
      onPress={() => router.push(`/book/${appt.salon.slug}` as never)}
    >
      {/* Salon logo */}
      <View style={styles.apptLogo}>
        {appt.salon.logo_url ? (
          <Image source={{ uri: appt.salon.logo_url }} style={styles.apptLogoImg} />
        ) : (
          <Text style={styles.apptLogoFallback}>{appt.salon.name.charAt(0)}</Text>
        )}
      </View>

      {/* Details */}
      <View style={styles.apptInfo}>
        <View style={styles.apptRow}>
          <Text style={styles.apptSalonName} numberOfLines={1}>{appt.salon.name}</Text>
          <View style={[styles.statusBadge, isPast && styles.statusBadgePast]}>
            <Text style={[styles.statusText, isPast && styles.statusTextPast]}>
              {isPast ? t('status_completed') : t('status_confirmed')}
            </Text>
          </View>
        </View>
        <Text style={styles.apptService} numberOfLines={1}>{appt.service.name}</Text>
        <View style={styles.apptMeta}>
          <Text style={styles.apptMetaText}>
            🗓 {formatDate(appt.start_datetime, tz)} • {formatTime(appt.start_datetime, tz)}
          </Text>
          {appt.staff_name ? (
            <Text style={styles.apptMetaText}>👤 {appt.staff_name}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

// Skeleton card while loading
function ApptSkeleton() {
  return (
    <View style={styles.skeleton}>
      <View style={styles.skeletonLogo} />
      <View style={styles.skeletonLines}>
        <View style={[styles.skeletonLine, { width: '60%' }]} />
        <View style={[styles.skeletonLine, { width: '40%', marginTop: 6 }]} />
        <View style={[styles.skeletonLine, { width: '70%', marginTop: 4 }]} />
      </View>
    </View>
  );
}

// Prompt when no phone is saved yet
function PhonePrompt({
  onSave,
}: {
  onSave: (phone: string) => void;
}) {
  const [phone, setPhone] = useState('');

  function handleSave() {
    const normalised = phone.trim();
    if (normalised.length < 7) return;
    onSave(normalised);
  }

  return (
    <View style={styles.phonePrompt}>
      <Text style={styles.phonePromptIcon}>📱</Text>
      <Text style={styles.phonePromptText}>{t('home_phone_prompt')}</Text>
      <View style={styles.phoneRow}>
        <View style={styles.phoneInput}>
          <Input
            label=""
            placeholder="+972501234567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
        </View>
        <Button
          onPress={handleSave}
          disabled={phone.trim().length < 7}
          size="md"
          style={styles.saveBtn}
        >
          {t('home_save_phone')}
        </Button>
      </View>
    </View>
  );
}

// Empty state when no appointments found
function EmptyState() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIllustration}>
        <Text style={styles.emptyEmoji}>✂️</Text>
      </View>
      <Text style={styles.emptyTitle}>{t('home_no_appointments_title')}</Text>
      <Text style={styles.emptySubtitle}>{t('home_no_appointments_sub')}</Text>
      <Button
        onPress={() => router.push('/(tabs)/discover' as never)}
        size="lg"
        style={styles.emptyBtn}
      >
        {t('home_go_discover')}
      </Button>
    </View>
  );
}

export default function HomeTab() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState<string | null>(null);
  const [phoneLoaded, setPhoneLoaded] = useState(false);

  // Load saved phone from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(PHONE_KEY)
      .then((val) => {
        setPhone(val);
        setPhoneLoaded(true);
      })
      .catch(() => setPhoneLoaded(true));
  }, []);

  const handleSavePhone = useCallback((newPhone: string) => {
    setPhone(newPhone);
    void AsyncStorage.setItem(PHONE_KEY, newPhone);
  }, []);

  const { data, isLoading } = trpc.appointments.getByPhone.useQuery(
    { phone: phone ?? '' },
    { enabled: phoneLoaded && !!phone },
  );

  const now = new Date();
  const appointments = (data ?? []) as Appointment[];
  const upcoming = appointments.filter((a: Appointment) => new Date(a.start_datetime) >= now);
  const past = appointments.filter((a: Appointment) => new Date(a.start_datetime) < now);

  // Not loaded yet — show nothing to avoid flash
  if (!phoneLoaded) {
    return <View style={styles.root} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing[6], paddingBottom: insets.bottom + spacing[10] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand header */}
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>✂</Text>
          </View>
          <Text style={styles.brandName}>{t('app_name')}</Text>
        </View>

        {/* If no phone saved yet — show prompt */}
        {!phone ? (
          <PhonePrompt onSave={handleSavePhone} />
        ) : isLoading ? (
          <View style={styles.skeletonList}>
            {Array.from({ length: 3 }).map((_, i) => <ApptSkeleton key={i} />)}
          </View>
        ) : upcoming.length === 0 && past.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.sections}>
            {upcoming.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('home_upcoming_title')}</Text>
                {upcoming.map((appt) => (
                  <AppointmentCard key={appt.id} appt={appt} />
                ))}
              </View>
            )}

            {past.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('my_appointments_past')}</Text>
                {past.slice(0, 3).map((appt) => (
                  <AppointmentCard key={appt.id} appt={appt} />
                ))}
              </View>
            )}

            {/* Discover CTA always present at bottom */}
            <Pressable
              style={({ pressed }) => [styles.discoverCta, pressed && styles.discoverCtaPressed]}
              onPress={() => router.push('/(tabs)/discover' as never)}
            >
              <Text style={styles.discoverEmoji}>🔍</Text>
              <View style={styles.discoverText}>
                <Text style={styles.discoverTitle}>{t('home_discover_cta')}</Text>
                <Text style={styles.discoverSub}>{t('discover_subtitle')}</Text>
              </View>
              <Text style={styles.discoverArrow}>←</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  container: {
    flexGrow: 1,
    paddingHorizontal: spacing[5],
    gap: spacing[6],
  },

  // Brand
  brand: { alignItems: 'center', gap: spacing[2] },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.elevated,
    shadowColor: colors.brand[600],
  },
  brandIconText: { fontSize: 28, color: colors.white },
  brandName: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['3xl'],
    color: colors.foreground,
    letterSpacing: -0.5,
  },

  // Skeleton
  skeletonList: { gap: spacing[3] },
  skeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[3],
  },
  skeletonLogo: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.border,
  },
  skeletonLines: { flex: 1, gap: spacing[1] },
  skeletonLine: {
    height: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
    alignSelf: 'flex-end',
  },

  // Sections
  sections: { gap: spacing[5] },
  section: { gap: spacing[3] },
  sectionTitle: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Appointment card
  apptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[3],
    ...shadows.card,
  },
  apptCardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  apptLogo: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  apptLogoImg: { width: 48, height: 48, borderRadius: radius.lg },
  apptLogoFallback: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.xl,
    color: colors.brand[600],
  },
  apptInfo: { flex: 1, gap: spacing[1] },
  apptRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  apptSalonName: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.base,
    color: colors.foreground,
    textAlign: 'right',
    flex: 1,
    marginStart: spacing[2],
  },
  statusBadge: {
    backgroundColor: colors.successLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  statusBadgePast: {
    backgroundColor: colors.surface.floating,
    borderColor: colors.border,
  },
  statusText: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.xs,
    color: colors.success,
  },
  statusTextPast: { color: colors.muted },
  apptService: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'right',
  },
  apptMeta: { gap: 2 },
  apptMetaText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    textAlign: 'right',
  },

  // Phone prompt
  phonePrompt: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[4],
    ...shadows.card,
  },
  phonePromptIcon: { fontSize: 36 },
  phonePromptText: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.base,
    color: colors.foreground,
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
    width: '100%',
  },
  phoneInput: { flex: 1 },
  saveBtn: { marginBottom: 2 },

  // Empty state
  empty: {
    alignItems: 'center',
    gap: spacing[4],
    paddingVertical: spacing[8],
  },
  emptyIllustration: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand[50],
    borderWidth: 2,
    borderColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['2xl'],
    color: colors.foreground,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: { width: '100%' },

  // Discover CTA card
  discoverCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand[600],
    borderRadius: radius['2xl'],
    padding: spacing[5],
    gap: spacing[4],
    ...shadows.elevated,
    shadowColor: colors.brand[600],
  },
  discoverCtaPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  discoverEmoji: { fontSize: 28 },
  discoverText: { flex: 1, gap: spacing[0.5] },
  discoverTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.lg,
    color: colors.white,
    textAlign: 'right',
    letterSpacing: -0.3,
  },
  discoverSub: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.brand[200],
    textAlign: 'right',
  },
  discoverArrow: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.lg,
    color: colors.brand[200],
  },
});
