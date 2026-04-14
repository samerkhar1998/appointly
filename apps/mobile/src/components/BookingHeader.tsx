import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

interface Props {
  salonName: string;
  logoUrl?: string | null;
  // When false the back button is hidden (e.g. first step or confirmation).
  showBack?: boolean;
}

// Sticky header used across every step of the booking flow.
// Renders the salon logo + name on the right and an optional back button on the left.
// The back button calls router.back(), relying on Expo Router's navigation stack.
export function BookingHeader({ salonName, logoUrl, showBack = true }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing[3] }]}>
      {/* Back button — left side. Hidden on first step but kept in layout so
          the salon name doesn't shift. */}
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backBtn,
          pressed && styles.backBtnPressed,
          !showBack && styles.invisible,
        ]}
        disabled={!showBack}
        accessibilityRole="button"
        accessibilityLabel={t('back')}
        hitSlop={12}
      >
        <Icon name="chevron-back" size={20} color={colors.brand[600]} />
        <Text style={styles.backLabel}>{t('back')}</Text>
      </Pressable>

      {/* Salon identity — right side */}
      <View style={styles.identity}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="cover" />
        ) : (
          <View style={styles.logoFallback}>
            <Text style={styles.logoFallbackText}>✂</Text>
          </View>
        )}
        <View>
          <Text style={styles.name}>{salonName}</Text>
          <Text style={styles.sub}>קביעת תור</Text>
        </View>
      </View>
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
  invisible: { opacity: 0 },

  backLabel: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.sm,
    color: colors.brand[600],
  },

  identity: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
    justifyContent: 'flex-start',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
  },
  logoFallback: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: { color: colors.white, fontSize: 18 },
  name: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.base,
    color: colors.foreground,
    textAlign: 'right',
  },
  sub: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'right',
  },
});
