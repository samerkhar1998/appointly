import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/auth';
import { Icon } from '@/components/ui/Icon';
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';

type Step = 'phone' | 'otp' | 'name';

// A single large OTP digit box
function OtpInput({
  value,
  focused,
}: {
  value: string;
  focused: boolean;
}) {
  return (
    <View
      style={[
        styles.otpBox,
        focused ? styles.otpBoxFocused : null,
        value ? styles.otpBoxFilled : null,
      ]}
    >
      <Text style={styles.otpDigit}>{value || ''}</Text>
      {focused && !value && <View style={styles.cursor} />}
    </View>
  );
}

export default function CustomerLoginScreen() {
  const insets = useSafeAreaInsets();
  const loginAsCustomer = useAuthStore((s) => s.loginAsCustomer);

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [error, setError] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);

  const otpRef = useRef<TextInput>(null);
  const resendTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendOtp = trpc.verification.sendOTP.useMutation();
  const verifyOtp = trpc.verification.verifyOTP.useMutation();

  function startResendCountdown() {
    setResendSeconds(60);
    resendTimer.current = setInterval(() => {
      setResendSeconds((s) => {
        if (s <= 1) {
          if (resendTimer.current) clearInterval(resendTimer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function handleSendOtp() {
    setError('');
    const trimmed = phone.trim();
    if (trimmed.length < 7) {
      setError('נא להזין מספר טלפון תקין');
      return;
    }
    try {
      // sendOTP requires salon_id — for customer login we use a dummy/global call
      // In practice this is phone verification independent of salon
      await sendOtp.mutateAsync({ salon_id: 'global', phone: trimmed });
      setStep('otp');
      startResendCountdown();
      setTimeout(() => otpRef.current?.focus(), 300);
    } catch {
      setError('לא ניתן לשלוח קוד. נסה שוב.');
    }
  }

  async function handleVerifyOtp(code: string) {
    if (code.length !== 6) return;
    setError('');
    try {
      const result = await verifyOtp.mutateAsync({ phone: phone.trim(), code });
      setVerificationToken(result.verification_token);
      setStep('name');
    } catch {
      setError('קוד שגוי. אנא נסה שוב.');
    }
  }

  function handleOtpChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 6);
    setOtp(digits);
    if (digits.length === 6) {
      void handleVerifyOtp(digits);
    }
  }

  async function handleFinish() {
    const trimmedName = name.trim() || 'לקוח';
    await loginAsCustomer(phone.trim(), trimmedName);
    router.replace('/(tabs)' as never);
  }

  async function handleResend() {
    if (resendSeconds > 0) return;
    setOtp('');
    setError('');
    await handleSendOtp();
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing[6], paddingBottom: insets.bottom + spacing[8] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Icon name="chevron-forward" size={20} color={colors.brand[600]} />
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Icon
              name={step === 'phone' ? 'phone-portrait-outline' : step === 'otp' ? 'lock-closed-outline' : 'sparkles-outline'}
              size={32}
              color={colors.brand[600]}
            />
          </View>
          <Text style={styles.title}>
            {step === 'phone'
              ? 'כניסה כלקוח'
              : step === 'otp'
              ? 'אימות טלפון'
              : 'מה שמך?'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'phone'
              ? 'הזן מספר טלפון לקבלת קוד אימות'
              : step === 'otp'
              ? `שלחנו קוד 6 ספרות ל-${phone}`
              : 'השם שיופיע בתורים שלך'}
          </Text>
        </View>

        {/* Step: Phone */}
        {step === 'phone' && (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>מספר טלפון</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={(t) => { setPhone(t); setError(''); }}
                placeholder="+972501234567"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                textAlign="right"
                autoFocus
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
              onPress={handleSendOtp}
              disabled={sendOtp.isPending}
            >
              <Text style={styles.primaryBtnText}>
                {sendOtp.isPending ? 'שולח...' : 'שלח קוד אימות ←'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Step: OTP */}
        {step === 'otp' && (
          <View style={styles.form}>
            {/* Hidden input to capture keyboard */}
            <TextInput
              ref={otpRef}
              value={otp}
              onChangeText={handleOtpChange}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.hiddenInput}
              caretHidden
            />

            {/* Visual OTP boxes */}
            <Pressable
              style={styles.otpRow}
              onPress={() => otpRef.current?.focus()}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <OtpInput
                  key={i}
                  value={otp[i] ?? ''}
                  focused={otp.length === i}
                />
              ))}
            </Pressable>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {verifyOtp.isPending && (
              <Text style={styles.verifyingText}>מאמת...</Text>
            )}

            <Pressable
              onPress={handleResend}
              disabled={resendSeconds > 0}
              style={styles.resendBtn}
            >
              <Text style={[styles.resendText, resendSeconds > 0 && styles.resendDisabled]}>
                {resendSeconds > 0
                  ? `שלח שוב בעוד ${resendSeconds} שניות`
                  : 'שלח קוד חדש'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Step: Name */}
        {step === 'name' && (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>שם מלא</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="ישראל ישראלי"
                placeholderTextColor={colors.muted}
                textAlign="right"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleFinish}
              />
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
              onPress={handleFinish}
            >
              <Text style={styles.primaryBtnText}>כניסה ←</Text>
            </Pressable>

            <Pressable onPress={handleFinish} style={styles.skipNameBtn}>
              <Text style={styles.skipNameText}>דלג (המשך ללא שם)</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    gap: spacing[6],
  },

  backBtn: { alignSelf: 'flex-end' },
  backText: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.sm,
    color: colors.brand[600], // kept for reference
  },

  header: { alignItems: 'center', gap: spacing[3] },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.brand[50],
    borderWidth: 1.5,
    borderColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 0 }, // replaced by Icon component
  title: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['2xl'],
    color: colors.foreground,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  form: { gap: spacing[4] },

  inputGroup: { gap: spacing[1.5] },
  inputLabel: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.sm,
    color: colors.foreground,
    textAlign: 'right',
  },
  textInput: {
    height: 52,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.base,
    color: colors.foreground,
  },

  errorText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.danger,
    textAlign: 'center',
  },

  primaryBtn: {
    height: 52,
    borderRadius: radius.xl,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.elevated,
    shadowColor: colors.brand[600],
  },
  primaryBtnPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  primaryBtnText: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.lg,
    color: colors.white,
  },

  // OTP
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  otpRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: spacing[2],
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFocused: {
    borderColor: colors.brand[600],
    backgroundColor: colors.brand[50],
  },
  otpBoxFilled: {
    borderColor: colors.brand[400],
    backgroundColor: colors.white,
    ...shadows.card,
  },
  otpDigit: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['2xl'],
    color: colors.foreground,
    textAlign: 'center',
  },
  cursor: {
    width: 2,
    height: 24,
    backgroundColor: colors.brand[600],
    borderRadius: 1,
  },

  verifyingText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
  },

  resendBtn: { alignItems: 'center', paddingVertical: spacing[1] },
  resendText: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.sm,
    color: colors.brand[600],
  },
  resendDisabled: { color: colors.mutedForeground },

  skipNameBtn: { alignItems: 'center', paddingVertical: spacing[1] },
  skipNameText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
});
