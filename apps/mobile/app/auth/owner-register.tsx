import { useState } from 'react';
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
import type { AuthUser } from '@/store/auth';

export default function OwnerRegisterScreen() {
  const insets = useSafeAreaInsets();
  const loginAsOwner = useAuthStore((s) => s.loginAsOwner);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [salonName, setSalonName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const registerMutation = trpc.auth.register.useMutation();

  async function handleRegister() {
    setError('');
    if (!name.trim() || !email.trim() || !password || !salonName.trim()) {
      setError('נא למלא את כל השדות הנדרשים');
      return;
    }
    if (password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים');
      return;
    }
    try {
      const result = await registerMutation.mutateAsync({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        salon_name: salonName.trim(),
        password,
      });
      const user: AuthUser = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        phone: phone.trim() || null,
        role: 'SALON_OWNER',
      };
      // Store the JWT so mobile can send it via Authorization header
      await loginAsOwner(user, result.token);
      router.replace('/(tabs)' as never);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('already')) {
        setError('אימייל זה כבר רשום. נסה להתחבר.');
      } else {
        setError('לא ניתן ליצור חשבון. נסה שוב.');
      }
    }
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
            <Icon name="sparkles-outline" size={32} color={colors.brand[600]} />
          </View>
          <Text style={styles.title}>צור חשבון עסקי</Text>
          <Text style={styles.subtitle}>
            מלא את הפרטים וצא לדרך תוך דקה
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.inputLabel}>שם מלא *</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={(t) => { setName(t); setError(''); }}
                placeholder="ישראל ישראלי"
                placeholderTextColor={colors.muted}
                textAlign="right"
                autoFocus
              />
            </View>
            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.inputLabel}>שם העסק *</Text>
              <TextInput
                style={styles.textInput}
                value={salonName}
                onChangeText={(t) => { setSalonName(t); setError(''); }}
                placeholder="סלון הדר"
                placeholderTextColor={colors.muted}
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>אימייל *</Text>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              placeholder="you@salon.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>טלפון (אופציונלי)</Text>
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="+972501234567"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>סיסמה (8 תווים לפחות) *</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.textInput, styles.passwordInput]}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPassword}
                textAlign="right"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <Pressable
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
              >
                <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
            onPress={handleRegister}
            disabled={registerMutation.isPending}
          >
            <Text style={styles.primaryBtnText}>
              {registerMutation.isPending ? 'יוצר חשבון...' : 'צור חשבון ←'}
            </Text>
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>
              כבר יש לך חשבון?{' '}
              <Text style={styles.loginLinkUnderline}>כניסה</Text>
            </Text>
          </Pressable>
        </View>
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
    color: colors.brand[600],
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
  iconEmoji: {},
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

  row: { flexDirection: 'row', gap: spacing[3] },
  inputHalf: { flex: 1 },

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

  passwordWrap: { position: 'relative' },
  passwordInput: { paddingEnd: spacing[12] },
  eyeBtn: {
    position: 'absolute',
    end: spacing[4],
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeText: {},

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

  loginLink: { alignItems: 'center', paddingVertical: spacing[1] },
  loginLinkText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  loginLinkUnderline: {
    color: colors.brand[600],
    textDecorationLine: 'underline',
  },
});
