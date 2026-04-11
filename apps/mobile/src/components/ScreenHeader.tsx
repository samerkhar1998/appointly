import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, shadows, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

interface Props {
  title: string;
  // When false the back button is not rendered (root-level screens).
  showBack?: boolean;
}

// Generic sticky header for non-booking screens (Discover, My Salons, Invite).
// Renders the screen title on the right (RTL) and an optional back button on the left.
export function ScreenHeader({ title, showBack = true }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing[3] }]}>
      {/* Back button — left side */}
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          hitSlop={12}
        >
          <Text style={styles.backArrow}>→</Text>
          <Text style={styles.backLabel}>{t('back')}</Text>
        </Pressable>
      ) : (
        // Invisible placeholder so the title stays centred
        <View style={styles.placeholder} />
      )}

      {/* Title — right side (RTL) */}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing[3],
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.card,
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[1],
    paddingEnd: spacing[2],
  },
  backBtnPressed: { opacity: 0.5 },

  backArrow: {
    fontSize: fontSize.lg,
    color: colors.brand[600],
    lineHeight: fontSize.lg + 2,
  },
  backLabel: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.sm,
    color: colors.brand[600],
  },

  placeholder: { width: 60 },

  title: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.lg,
    color: colors.foreground,
    textAlign: 'right',
    letterSpacing: -0.3,
    flex: 1,
  },
});
