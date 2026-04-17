import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

// Invite landing screen — validates the invite token from the URL and surfaces
// the salon's details. The user taps "Book" to enter the booking flow with the
// invite token, which grants access to private salons.
export default function InviteScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token: string }>();

  const { data, isLoading, isError } = trpc.salons.getByInviteToken.useQuery(
    { token: token ?? '' },
    { enabled: !!token },
  );

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>→</Text>
          <Text style={styles.backLabel}>{t('back')}</Text>
        </Pressable>
        <ActivityIndicator color={colors.brand[600]} size="large" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>→</Text>
          <Text style={styles.backLabel}>{t('back')}</Text>
        </Pressable>
        <Text style={styles.errorIcon}>🔒</Text>
        <Text style={styles.errorTitle}>{t('invite_invalid_title')}</Text>
        <Text style={styles.errorSub}>{t('invite_invalid_sub')}</Text>
        <Button
          variant="outline"
          size="md"
          onPress={() => router.replace('/discover' as never)}
          style={styles.errorBtn}
        >
          {t('booking_private_cta')}
        </Button>
      </View>
    );
  }

  const { salon, token: inviteToken } = data;

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[2] }]}>
      {/* Back button — floating top-left */}
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t('back')}
      >
        <Text style={styles.backArrow}>→</Text>
        <Text style={styles.backLabel}>{t('back')}</Text>
      </Pressable>

      <View style={styles.card}>
        {/* Private badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🔒 {t('invite_private_badge')}</Text>
        </View>

        {/* Cover / logo area */}
        <View style={styles.coverWrap}>
          {salon.cover_url ? (
            <Image source={{ uri: salon.cover_url }} style={styles.cover} />
          ) : (
            <View style={styles.coverFallback}>
              <Text style={styles.coverFallbackText}>{salon.name.charAt(0)}</Text>
            </View>
          )}

          {salon.logo_url && (
            <View style={styles.logoWrap}>
              <Image source={{ uri: salon.logo_url }} style={styles.logo} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name}>{salon.name}</Text>
          {salon.city ? <Text style={styles.city}>📍 {salon.city}</Text> : null}
          {salon.description ? (
            <Text style={styles.description}>{salon.description}</Text>
          ) : null}

          <View style={styles.invitedRow}>
            <Text style={styles.invitedText}>{t('invite_invited')}</Text>
          </View>
        </View>

        {/* CTAs — view business profile or go straight to booking */}
        <View style={styles.ctaRow}>
          <Button
            onPress={() => router.push(`/salon/${salon.slug}?invite=${inviteToken}` as never)}
            size="lg"
            variant="outline"
            style={styles.ctaSecondary}
          >
            {t('invite_view_business')}
          </Button>
          <Button
            onPress={() => router.push(`/book/${salon.slug}?invite=${inviteToken}` as never)}
            size="lg"
            style={styles.ctaPrimary}
          >
            {t('invite_cta')}
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },

  backBtn: {
    position: 'absolute',
    top: spacing[4],
    start: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    zIndex: 10,
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    backgroundColor: colors.white,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  backBtnPressed: { opacity: 0.6 },
  backArrow: {
    fontSize: fontSize.base,
    color: colors.brand[600],
  },
  backLabel: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.sm,
    color: colors.brand[600],
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[3],
  },
  errorIcon: { fontSize: 44, marginBottom: spacing[2] },
  errorTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.xl,
    color: colors.foreground,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  errorSub: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBtn: { marginTop: spacing[3] },

  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.elevated,
  },

  badge: {
    position: 'absolute',
    top: spacing[3],
    end: spacing[3],
    zIndex: 10,
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.brand[200],
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  badgeText: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.xs,
    color: colors.brand[700],
  },

  coverWrap: { position: 'relative', height: 140 },
  cover: { width: '100%', height: 140 },
  coverFallback: {
    width: '100%',
    height: 140,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverFallbackText: {
    fontFamily: 'Heebo_700Bold',
    fontSize: 56,
    color: colors.brand[300],
  },

  logoWrap: {
    position: 'absolute',
    bottom: -20,
    start: spacing[5],
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.white,
    overflow: 'hidden',
    ...shadows.card,
  },
  logo: { width: 40, height: 40, borderRadius: radius.md },

  info: {
    padding: spacing[5],
    paddingTop: spacing[8],
    gap: spacing[1.5],
  },
  name: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['2xl'],
    color: colors.foreground,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  city: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'right',
  },
  description: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'right',
    lineHeight: 20,
    marginTop: spacing[1],
  },

  invitedRow: {
    marginTop: spacing[3],
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.brand[100],
    borderRadius: radius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    alignSelf: 'flex-end',
  },
  invitedText: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.xs,
    color: colors.brand[700],
  },

  ctaRow: {
    margin: spacing[5],
    marginTop: spacing[2],
    gap: spacing[3],
  },
  ctaPrimary: { flex: 1 },
  ctaSecondary: { flex: 1 },
});
