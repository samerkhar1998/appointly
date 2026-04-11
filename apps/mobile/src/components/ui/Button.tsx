import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/lib/theme';

type Variant = 'primary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  onPress: () => void;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'destructive' ? colors.white : colors.brand[600]}
          size="small"
        />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },

  // Sizes
  size_sm: { height: 36, paddingHorizontal: spacing[3] },
  size_md: { height: 44, paddingHorizontal: spacing[5] },
  size_lg: { height: 52, paddingHorizontal: spacing[6] },

  // Variants
  variant_primary: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  variant_destructive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },

  // Labels
  label: {
    fontFamily: 'Heebo_600SemiBold',
    textAlign: 'center',
  },
  label_primary: { color: colors.white },
  label_outline: { color: colors.foreground },
  label_ghost: { color: colors.muted },
  label_destructive: { color: colors.white },

  labelSize_sm: { fontSize: 13 },
  labelSize_md: { fontSize: 15 },
  labelSize_lg: { fontSize: 16 },

  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
});
