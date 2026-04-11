import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDateTime } from '@/lib/utils';
import { colors, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

type CancelState = 'idle' | 'otp_sent' | 'cancelling' | 'success' | 'error';

export default function CancelScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const insets = useSafeAreaInsets();

  const [cancelState, setCancelState] = useState<CancelState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const { data: appt, isLoading, isError } = trpc.appointments.getByToken.useQuery(
    { token: token ?? '' },
    { enabled: !!token },
  );

  const cancelMutation = trpc.appointments.cancelByToken.useMutation({
    onSuccess: () => setCancelState('success'),
    onError: (err) => {
      setErrorMsg(err.message);
      setCancelState('error');
    },
  });

  const requestOtpMutation = trpc.appointments.requestOTP.useMutation({
    onSuccess: () => {
      setCancelState('otp_sent');
      startCooldown();
    },
  });

  const cancelByOtpMutation = trpc.appointments.cancelByOTP.useMutation({
    onSuccess: () => setCancelState('success'),
    onError: (err) => {
      setErrorMsg(err.message);
      setCancelState('error');
    },
  });

  function startCooldown() {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < 5) inputRefs.current[index + 1]?.focus();

    if (next.every(Boolean) && appt) {
      cancelByOtpMutation.mutate({ appointment_id: appt.id, code: next.join('') });
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  const tz = appt?.salon_timezone ?? 'Asia/Jerusalem';

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + spacing[8], paddingBottom: insets.bottom + spacing[8] },
      ]}
    >
      {/* Brand */}
      <View style={styles.brand}>
        <View style={styles.brandIcon}>
          <Text style={styles.brandEmoji}>✂</Text>
        </View>
        <Text style={styles.brandName}>Appointly</Text>
      </View>

      {/* Appointment details (skeleton while loading) */}
      {isLoading && (
        <View style={styles.detailCard}>
          <Skeleton height={14} width="60%" style={styles.skeletonRow} />
          <Skeleton height={12} width="50%" style={styles.skeletonRow} />
          <Skeleton height={12} width="70%" />
        </View>
      )}

      {isError && !appt && (
        <View style={styles.mainCard}>
          <Text style={styles.errorEmoji}>❌</Text>
          <Text style={styles.cardTitle}>{t('cancel_invalid_title')}</Text>
          <Text style={styles.cardSubtitle}>{t('cancel_invalid_subtitle')}</Text>
        </View>
      )}

      {appt && cancelState !== 'success' && (
        <View style={styles.detailCard}>
          <Text style={styles.detailCardLabel}>פרטי התור</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>✂ שירות</Text>
            <Text style={styles.detailValue}>{appt.service_name} · {appt.service_duration} דק׳</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>📅 תאריך</Text>
            <Text style={styles.detailValue}>{formatDateTime(appt.start_datetime, tz)}</Text>
          </View>
          {appt.staff_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>👤 איש צוות</Text>
              <Text style={styles.detailValue}>{appt.staff_name}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>⏰</Text>
            <Text style={styles.detailValueMuted}>
              {t('cancel_window')} {appt.cancellation_window_hours} {t('cancel_window_suffix')}
            </Text>
          </View>
        </View>
      )}

      {/* Main action card */}
      <View style={styles.mainCard}>
        {/* ── idle ── */}
        {cancelState === 'idle' && appt && (
          <View style={styles.cardContent}>
            <Text style={styles.warningEmoji}>⚠️</Text>
            <Text style={styles.cardTitle}>{t('cancel_title')}</Text>
            <Text style={styles.cardSubtitle}>{t('cancel_subtitle')}</Text>
            <Button
              variant="destructive"
              size="lg"
              onPress={() => {
                setCancelState('cancelling');
                cancelMutation.mutate({ token: token ?? '' });
              }}
              loading={cancelMutation.isPending}
              style={styles.actionBtn}
            >
              {t('cancel_cta')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onPress={() => requestOtpMutation.mutate({ appointment_id: appt.id })}
              loading={requestOtpMutation.isPending}
              style={styles.actionBtn}
            >
              {t('cancel_sms')}
            </Button>
          </View>
        )}

        {/* ── OTP entry ── */}
        {cancelState === 'otp_sent' && appt && (
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t('cancel_otp_title')}</Text>
            <Text style={styles.cardSubtitle}>
              {t('cancel_otp_subtitle')} {appt.customer_phone}
            </Text>
            <View style={styles.digitRow}>
              {digits.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  value={digit}
                  onChangeText={(v) => handleDigitChange(i, v)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!cancelByOtpMutation.isPending}
                  style={[styles.digit, digit ? styles.digitFilled : null]}
                />
              ))}
            </View>
            {cancelByOtpMutation.isPending && (
              <View style={styles.verifying}>
                <ActivityIndicator color={colors.brand[600]} />
                <Text style={styles.verifyingText}>{t('cancel_cancelling')}</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => {
                if (resendCooldown > 0) return;
                setResendCooldown(60);
                requestOtpMutation.mutate({ appointment_id: appt.id });
              }}
              disabled={resendCooldown > 0}
            >
              <Text style={[styles.resendText, resendCooldown > 0 && styles.resendDisabled]}>
                {resendCooldown > 0
                  ? `${t('cancel_resend_in')} ${resendCooldown}ש׳`
                  : t('cancel_resend')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── cancelling ── */}
        {cancelState === 'cancelling' && (
          <View style={styles.cardContent}>
            <ActivityIndicator color={colors.brand[600]} size="large" />
            <Text style={styles.cardSubtitle}>{t('cancel_cancelling')}</Text>
          </View>
        )}

        {/* ── success ── */}
        {cancelState === 'success' && (
          <View style={styles.cardContent}>
            <Text style={styles.successEmoji}>✅</Text>
            <Text style={styles.cardTitle}>{t('cancel_success_title')}</Text>
            <Text style={styles.cardSubtitle}>{t('cancel_success_subtitle')}</Text>
          </View>
        )}

        {/* ── error ── */}
        {cancelState === 'error' && (
          <View style={styles.cardContent}>
            <Text style={styles.errorEmoji}>❌</Text>
            <Text style={styles.cardTitle}>{t('cancel_error_title')}</Text>
            <Text style={styles.cardSubtitle}>{errorMsg}</Text>
            <Button variant="outline" onPress={() => setCancelState('idle')} style={styles.actionBtn}>
              {t('retry')}
            </Button>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[5],
    alignItems: 'center',
    gap: spacing[5],
  },

  brand: { alignItems: 'center', gap: spacing[2] },
  brandIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandEmoji: { fontSize: 24, color: colors.white },
  brandName: {
    fontFamily: 'Heebo_700Bold',
    fontSize: 18,
    color: colors.foreground,
  },

  detailCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[2],
  },
  detailCardLabel: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    textAlign: 'right',
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  detailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailKey: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 13,
    color: colors.muted,
  },
  detailValue: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: 13,
    color: colors.foreground,
    textAlign: 'right',
    flex: 1,
    paddingEnd: spacing[3],
  },
  detailValueMuted: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    flex: 1,
    paddingEnd: spacing[3],
  },
  skeletonRow: { marginBottom: spacing[2] },

  mainCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[6],
    alignItems: 'center',
    shadowColor: colors.brand[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  cardContent: {
    width: '100%',
    alignItems: 'center',
    gap: spacing[4],
  },
  cardTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: 22,
    color: colors.foreground,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionBtn: { width: '100%' },

  warningEmoji: { fontSize: 48 },
  successEmoji: { fontSize: 48 },
  errorEmoji: { fontSize: 48 },

  digitRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  digit: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    fontSize: 20,
    fontFamily: 'Heebo_700Bold',
    color: colors.foreground,
    textAlign: 'center',
  },
  digitFilled: {
    borderColor: colors.brand[400],
    backgroundColor: colors.brand[50],
    color: colors.brand[700],
  },

  verifying: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  verifyingText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 14,
    color: colors.muted,
  },
  resendText: {
    fontFamily: 'Heebo_500Medium',
    fontSize: 13,
    color: colors.brand[600],
    textAlign: 'center',
  },
  resendDisabled: { color: colors.mutedForeground },
});
