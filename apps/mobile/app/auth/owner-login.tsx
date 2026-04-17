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

export default function OwnerLoginScreen() {
  const insets = useSafeAreaInsets();
  const loginAsOwner = useAuthStore((s) => s.loginAsOwner);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const loginMutation = trpc.auth.login.useMutation();

  async function handleLogin() {
    setError('');
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('נא למלא אימייל וסיסמה');
      return;
    }
    try {
      const result = await loginMutation.mutateAsync({
        email: trimmedEmail,
        password,
      });
      const user: AuthUser = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        phone: null,
        role: 'SALON_OWNER',
      };
      // Store the JWT so mobile can send it via Authorization header
      // (React Native has no cookie jar — cookies set by the server are not persisted)
      await loginAsOwner(user, result.token);
      // Navigate to owner calendar tab directly so the dashboard is immediately visible
      router.replace('/(tabs)/owner-calendar' as never);
    } catch {
      setError('אימייל או סיסמה שגויים');
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
            <Icon name="business-outline" size={32} color={colors.brand[600]} />
          </View>
          <Text style={styles.title}>כניסה לבעלי עסקים</Text>
          <Text style={styles.subtitle}>
            נהל את העסק שלך — תורים, צוות, לקוחות ועוד
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>אימייל</Text>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              placeholder="your@salon.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="right"
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>סיסמה</Text>
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
                onSubmitEditing={handleLogin}
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
            onPress={handleLogin}
            disabled={loginMutation.isPending}
          >
            <Text style={styles.primaryBtnText}>
              {loginMutation.isPending ? 'מתחבר...' : 'כניסה ←'}
            </Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>או</Text>
            <View style={styles.divider} />
          </View>

          {/* Register link */}
          <Pressable
            style={({ pressed }) => [styles.outlineBtn, pressed && styles.outlineBtnPressed]}
            onPress={() => router.push('/auth/owner-register' as never)}
          >
            <Text style={styles.outlineBtnText}>צור חשבון עסקי חדש</Text>
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

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },

  outlineBtn: {
    height: 52,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnPressed: { backgroundColor: colors.brand[50] },
  outlineBtnText: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.base,
    color: colors.brand[600],
  },
});
