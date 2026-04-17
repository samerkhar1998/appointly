import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';

type ChoiceCardProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  primary?: boolean;
};

function ChoiceCard({ icon, title, subtitle, onPress, primary }: ChoiceCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        primary ? styles.cardPrimary : styles.cardOutline,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.cardIconWrap, primary ? styles.cardIconWrapPrimary : styles.cardIconWrapOutline]}>
        <Icon
          name={icon}
          size={24}
          color={primary ? colors.white : colors.brand[600]}
        />
      </View>
      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, primary && styles.cardTitlePrimary]}>{title}</Text>
        <Text style={[styles.cardSubtitle, primary && styles.cardSubtitlePrimary]}>{subtitle}</Text>
      </View>
      <Icon
        name="chevron-back"
        size={18}
        color={primary ? colors.brand[200] : colors.mutedForeground}
      />
    </Pressable>
  );
}

export default function AuthWelcomeScreen() {
  const insets = useSafeAreaInsets();
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest);

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Brand */}
      <View style={styles.brand}>
        <View style={styles.brandIcon}>
          <Icon name="cut" size={32} color={colors.white} />
        </View>
        <Text style={styles.brandName}>Appointly</Text>
        <Text style={styles.brandTagline}>המערכת החכמה לניהול תורים</Text>
      </View>

      {/* Divider */}
      <View style={styles.dividerWrap}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>בחר כיצד להמשיך</Text>
        <View style={styles.divider} />
      </View>

      {/* Choice cards */}
      <View style={styles.cards}>
        <ChoiceCard
          icon="cut-outline"
          title="אני לקוח"
          subtitle="קבע תורים, צפה בהיסטוריה, גלה עסקים"
          onPress={() => router.push('/auth/customer-login' as never)}
          primary
        />
        <ChoiceCard
          icon="business-outline"
          title="אני בעל עסק"
          subtitle="נהל תורים, צוות, שירותים ולקוחות"
          onPress={() => router.push('/auth/owner-login' as never)}
        />
      </View>

      {/* Guest link */}
      <Pressable
        style={styles.guestWrap}
        onPress={async () => {
          await loginAsGuest();
          router.replace('/(tabs)/discover' as never);
        }}
        hitSlop={10}
      >
        <Text style={styles.guestText}>
          המשך כאורח —{' '}
          <Text style={styles.guestUnderline}>גלה עסקים ללא חשבון</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing[6],
    justifyContent: 'center',
    gap: spacing[8],
  },

  // Brand
  brand: {
    alignItems: 'center',
    gap: spacing[3],
  },
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
  brandName: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['3xl'],
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
  },

  // Divider
  dividerWrap: {
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

  // Cards
  cards: { gap: spacing[3] },

  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: radius['2xl'],
    padding: spacing[4],
    gap: spacing[4],
  },
  cardPrimary: {
    backgroundColor: colors.brand[600],
    ...shadows.elevated,
    shadowColor: colors.brand[600],
  },
  cardOutline: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },

  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconWrapPrimary: { backgroundColor: colors.brand[500] },
  cardIconWrapOutline: { backgroundColor: colors.brand[50] },

  cardText: { flex: 1, gap: spacing[0.5] },
  cardTitle: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.lg,
    color: colors.foreground,
    textAlign: 'right',
  },
  cardTitlePrimary: { color: colors.white },
  cardSubtitle: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'right',
    lineHeight: 17,
  },
  cardSubtitlePrimary: { color: colors.brand[200] },

  // Guest
  guestWrap: { alignItems: 'center', paddingVertical: spacing[2] },
  guestText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
  },
  guestUnderline: {
    color: colors.brand[600],
    textDecorationLine: 'underline',
  },
});
