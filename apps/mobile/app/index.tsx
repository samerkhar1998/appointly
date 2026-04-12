import {
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
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

// Primary action card — large tappable tile with icon, title, description.
function ActionCard({
  emoji,
  title,
  description,
  onPress,
  variant = 'default',
}: {
  emoji: string;
  title: string;
  description: string;
  onPress: () => void;
  variant?: 'default' | 'brand';
}) {
  const isBrand = variant === 'brand';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        isBrand && styles.actionCardBrand,
        pressed && styles.actionCardPressed,
      ]}
    >
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <View style={styles.actionText}>
        <Text style={[styles.actionTitle, isBrand && styles.actionTitleBrand]}>
          {title}
        </Text>
        <Text style={[styles.actionDesc, isBrand && styles.actionDescBrand]}>
          {description}
        </Text>
      </View>
      <Text style={[styles.actionArrow, isBrand && styles.actionArrowBrand]}>←</Text>
    </Pressable>
  );
}

// Home / landing screen.
// Shows two primary CTAs: Discover and My Salons.
export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing[10], paddingBottom: insets.bottom + spacing[10] },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand mark */}
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>✂</Text>
          </View>
          <Text style={styles.brandName}>{t('app_name')}</Text>
          <Text style={styles.brandTagline}>{t('home_subtitle')}</Text>
        </View>

        {/* Primary actions */}
        <View style={styles.actions}>
          <ActionCard
            emoji="🔍"
            title={t('home_discover_cta')}
            description="מצא עסקים ציבוריים קרובים"
            onPress={() => router.push('/discover' as never)}
            variant="brand"
          />
          <ActionCard
            emoji="🏢"
            title={t('home_my_salons_cta')}
            description="העסקים שכבר ביקרת בהם"
            onPress={() => router.push('/my-salons' as never)}
          />
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },

  container: {
    flexGrow: 1,
    paddingHorizontal: spacing[5],
    gap: spacing[6],
  },

  // Brand
  brand: { alignItems: 'center', gap: spacing[2] },
  brandIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.elevated,
    shadowColor: colors.brand[600],
  },
  brandIconText: { fontSize: 32, color: colors.white },
  brandName: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['3xl'],
    color: colors.foreground,
    letterSpacing: -0.5,
    marginTop: spacing[1],
  },
  brandTagline: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
  },

  // Action cards
  actions: { gap: spacing[3] },

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[5],
    gap: spacing[4],
    ...shadows.card,
  },
  actionCardBrand: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
  },
  actionCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },

  actionEmoji: { fontSize: 28 },
  actionText: { flex: 1, gap: spacing[0.5] },
  actionTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.lg,
    color: colors.foreground,
    textAlign: 'right',
    letterSpacing: -0.3,
  },
  actionTitleBrand: { color: colors.white },
  actionDesc: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'right',
  },
  actionDescBrand: { color: colors.brand[200] },
  actionArrow: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.lg,
    color: colors.mutedForeground,
  },
  actionArrowBrand: { color: colors.brand[200] },

});
