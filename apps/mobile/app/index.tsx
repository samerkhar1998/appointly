import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

export default function HomeScreen() {
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();

  function handleContinue() {
    const trimmed = slug.trim().toLowerCase();
    if (!trimmed) {
      setError(t('home_slug_empty'));
      return;
    }
    setError('');
    router.push(`/book/${trimmed}`);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing[12], paddingBottom: insets.bottom + spacing[8] },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand mark */}
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>✂</Text>
          </View>
          <Text style={styles.brandName}>{t('app_name')}</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>{t('home_title')}</Text>
          <Text style={styles.subtitle}>{t('home_subtitle')}</Text>

          <View style={styles.form}>
            <Input
              label={t('home_slug_placeholder')}
              placeholder="demo-salon"
              value={slug}
              onChangeText={(v) => { setSlug(v); setError(''); }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleContinue}
              error={error}
            />

            <Button onPress={handleContinue} size="lg" style={styles.cta}>
              {t('home_cta')}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },

  container: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
  },

  brand: { alignItems: 'center', gap: spacing[3] },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand[600],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  brandIconText: { fontSize: 28, color: colors.white },
  brandName: {
    fontFamily: 'Heebo_700Bold',
    fontSize: 28,
    color: colors.foreground,
    letterSpacing: -0.5,
  },

  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[6],
    gap: spacing[2],
    shadowColor: colors.brand[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },

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
    lineHeight: 22,
    marginBottom: spacing[2],
  },

  form: { gap: spacing[4] },
  cta: { marginTop: spacing[2] },
});
