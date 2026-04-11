import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { useBookingStore } from '@/store/booking';
import { BookingProgress } from '@/components/BookingProgress';
import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

export default function OtpScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const booking = useBookingStore((s) => s.booking);
  const setBooking = useBookingStore((s) => s.setBooking);
  const insets = useSafeAreaInsets();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [error, setError] = useState('');
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const sendOtp = trpc.verification.sendOTP.useMutation();
  const verifyOtp = trpc.verification.verifyOTP.useMutation({
    onSuccess: (data) => {
      setBooking({ verification_token: data.verification_token });
      router.push(`/book/${slug}/confirmation`);
    },
    onError: (err) => {
      setError(err.message);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    },
  });

  // Send OTP on mount
  useEffect(() => {
    if (booking.customer_phone && booking.salon_id) {
      sendOtp.mutate({ phone: booking.customer_phone, salon_id: booking.salon_id });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 filled
    if (next.every(Boolean) && booking.customer_phone) {
      verifyOtp.mutate({ phone: booking.customer_phone, code: next.join('') });
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleResend() {
    if (resendCooldown > 0 || !booking.customer_phone || !booking.salon_id) return;
    setResendCooldown(60);
    setDigits(['', '', '', '', '', '']);
    setError('');
    sendOtp.mutate({ phone: booking.customer_phone, salon_id: booking.salon_id });
  }

  const isVerifying = verifyOtp.isPending;

  return (
    <View style={[styles.flex, { paddingBottom: insets.bottom }]}>
      <BookingProgress currentStep={4} />
      <View style={styles.content}>
        <Text style={styles.title}>{t('otp_title')}</Text>
        <Text style={styles.subtitle}>
          {t('otp_subtitle')} {booking.customer_phone}
        </Text>

        {/* OTP digit inputs — LTR regardless of app RTL */}
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
              editable={!isVerifying}
              style={[
                styles.digit,
                digit ? styles.digitFilled : null,
                error ? styles.digitError : null,
              ]}
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isVerifying && (
          <View style={styles.verifying}>
            <ActivityIndicator color={colors.brand[600]} />
            <Text style={styles.verifyingText}>{t('otp_verifying')}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleResend}
          disabled={resendCooldown > 0 || sendOtp.isPending}
          style={styles.resendBtn}
        >
          <Text style={[styles.resendText, resendCooldown > 0 && styles.resendDisabled]}>
            {resendCooldown > 0
              ? `${t('otp_resend_in')} ${resendCooldown}${t('otp_seconds_suffix')}`
              : t('otp_resend')}
          </Text>
        </TouchableOpacity>

        <View style={styles.backWrap}>
          <Button variant="outline" onPress={() => router.back()}>
            {t('back')}
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    padding: spacing[6],
    gap: spacing[6],
    alignItems: 'center',
  },

  title: {
    fontFamily: 'Heebo_700Bold',
    fontSize: 24,
    color: colors.foreground,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginTop: spacing[4],
  },
  subtitle: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },

  digitRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  digit: {
    width: 48,
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    fontSize: 22,
    fontFamily: 'Heebo_700Bold',
    color: colors.foreground,
    textAlign: 'center',
  },
  digitFilled: {
    borderColor: colors.brand[400],
    backgroundColor: colors.brand[50],
    color: colors.brand[700],
  },
  digitError: { borderColor: colors.danger },

  error: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
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

  resendBtn: { paddingVertical: spacing[2] },
  resendText: {
    fontFamily: 'Heebo_500Medium',
    fontSize: 13,
    color: colors.brand[600],
    textAlign: 'center',
  },
  resendDisabled: { color: colors.mutedForeground },

  backWrap: { width: '100%', marginTop: 'auto' },
});
