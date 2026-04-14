import { useCallback, useEffect, useState } from 'react';
import {
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
import { Icon } from '@/components/ui/Icon';
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

function statusLabel(status: string): string {
  switch (status) {
    case 'PENDING': return t('status_pending');
    case 'CONFIRMED': return t('status_confirmed');
    case 'COMPLETED': return t('status_completed');
    case 'NO_SHOW': return t('status_no_show');
    default: return status;
  }
}

function statusColors(status: string): { bg: string; border: string; text: string } {
  switch (status) {
    case 'CONFIRMED':
      return { bg: colors.successLight, border: colors.successBorder, text: colors.success };
    case 'COMPLETED':
      return { bg: colors.surface.floating, border: colors.border, text: colors.muted };
    case 'PENDING':
      return { bg: colors.warningLight, border: colors.warningBorder, text: colors.warning };
    default:
      return { bg: colors.surface.floating, border: colors.border, text: colors.muted };
  }
}

function AppointmentRow({ appt }: { appt: Appointment }) {
  const tz = 'Asia/Jerusalem';
  const sc = statusColors(appt.status);

  return (
    <View style={styles.apptCard}>
      <View style={styles.apptLogo}>
        {appt.salon.logo_url ? (
          <Image source={{ uri: appt.salon.logo_url }} style={styles.apptLogoImg} />
        ) : (
          <Text style={styles.apptLogoFallback}>{appt.salon.name.charAt(0)}</Text>
        )}
      </View>

      <View style={styles.apptInfo}>
        <View style={styles.apptTop}>
          <Text style={styles.apptSalon} numberOfLines={1}>{appt.salon.name}</Text>
          <View style={[styles.badge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[styles.badgeText, { color: sc.text }]}>{statusLabel(appt.status)}</Text>
          </View>
        </View>
        <Text style={styles.apptService} numberOfLines={1}>{appt.service.name}</Text>
        <View style={styles.apptMetaRow}>
          <Icon name="calendar-outline" size={12} color={colors.mutedForeground} />
          <Text style={styles.apptDate}>{formatDate(appt.start_datetime, tz)} • {formatTime(appt.start_datetime, tz)}</Text>
        </View>
        {appt.staff_name ? (
          <View style={styles.apptMetaRow}>
            <Icon name="person-outline" size={12} color={colors.mutedForeground} />
            <Text style={styles.apptStaff}>{appt.staff_name}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function SkeletonRow() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonLogo} />
      <View style={styles.skeletonLines}>
        <View style={[styles.skeletonLine, { width: '60%' }]} />
        <View style={[styles.skeletonLine, { width: '40%', marginTop: 6 }]} />
        <View style={[styles.skeletonLine, { width: '55%', marginTop: 4 }]} />
      </View>
    </View>
  );
}

function PhoneEntry({ onSave }: { onSave: (p: string) => void }) {
  const [phone, setPhone] = useState('');

  function handleSave() {
    const v = phone.trim();
    if (v.length < 7) return;
    onSave(v);
  }

  return (
    <View style={styles.phoneCard}>
      <View style={styles.phoneIcon}>
        <Icon name="phone-portrait-outline" size={28} color={colors.brand[600]} />
      </View>
      <Text style={styles.phoneText}>{t('my_appointments_phone_prompt')}</Text>
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

export default function MyAppointmentsTab() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState<string | null>(null);
  const [phoneLoaded, setPhoneLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PHONE_KEY)
      .then((val) => { setPhone(val); setPhoneLoaded(true); })
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
  const past = appointments
    .filter((a: Appointment) => new Date(a.start_datetime) < now)
    .sort((a: Appointment, b: Appointment) =>
      new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime(),
    );

  if (!phoneLoaded) return <View style={styles.root} />;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Fixed header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Text style={styles.screenTitle}>{t('my_appointments_title')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing[10] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!phone ? (
          <PhoneEntry onSave={handleSavePhone} />
        ) : isLoading ? (
          <View style={styles.skeletonList}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
          </View>
        ) : upcoming.length === 0 && past.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Icon name="calendar-outline" size={36} color={colors.brand[400]} />
            </View>
            <Text style={styles.emptyTitle}>{t('my_appointments_empty')}</Text>
            <Text style={styles.emptySub}>{t('my_appointments_empty_sub')}</Text>
            <Button
              variant="outline"
              size="md"
              onPress={() => router.push('/(tabs)/discover' as never)}
              style={styles.emptyBtn}
            >
              {t('my_salons_discover_cta')}
            </Button>
          </View>
        ) : (
          <>
            {upcoming.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('my_appointments_upcoming')}</Text>
                {upcoming.map((appt) => (
                  <AppointmentRow key={appt.id} appt={appt} />
                ))}
              </View>
            )}
            {past.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('my_appointments_past')}</Text>
                {past.map((appt) => (
                  <AppointmentRow key={appt.id} appt={appt} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  screenTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['2xl'],
    color: colors.foreground,
    textAlign: 'right',
    letterSpacing: -0.5,
  },

  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    gap: spacing[5],
  },

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
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[3],
    ...shadows.card,
  },
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
  apptTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  apptSalon: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.base,
    color: colors.foreground,
    textAlign: 'right',
    flex: 1,
    marginStart: spacing[2],
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.xs,
  },
  apptService: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'right',
  },
  apptDate: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    textAlign: 'right',
  },
  apptMetaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[1],
  },
  apptStaff: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    textAlign: 'right',
  },

  // Phone entry card
  phoneCard: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[4],
    ...shadows.card,
  },
  phoneIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneText: {
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

  // Skeleton
  skeletonList: { gap: spacing[3], paddingTop: spacing[2] },
  skeletonCard: {
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

  // Empty state
  empty: {
    alignItems: 'center',
    gap: spacing[4],
    paddingVertical: spacing[10],
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand[50],
    borderWidth: 2,
    borderColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['2xl'],
    color: colors.foreground,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySub: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: { marginTop: spacing[2] },
});
