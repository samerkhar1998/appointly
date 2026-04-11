import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows, spacing } from '@/lib/theme';

interface Props {
  salonName: string;
  logoUrl?: string | null;
}

export function BookingHeader({ salonName, logoUrl }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing[3] }]}>
      <View style={styles.inner}>
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
    ...shadows.card,
  },
  inner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[3],
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  logoFallback: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    color: colors.white,
    fontSize: 18,
  },
  name: {
    fontFamily: 'Heebo_700Bold',
    fontSize: 16,
    color: colors.foreground,
    textAlign: 'right',
  },
  sub: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
  },
});
