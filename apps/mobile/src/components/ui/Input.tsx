import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing } from '@/lib/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...rest }: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={colors.mutedForeground}
        textAlign="right"
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing[1] },

  label: {
    fontSize: 13,
    fontFamily: 'Heebo_600SemiBold',
    color: colors.foreground,
    textAlign: 'right',
  },

  input: {
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    fontSize: 15,
    fontFamily: 'Heebo_400Regular',
    color: colors.foreground,
    writingDirection: 'rtl',
  },

  inputError: { borderColor: colors.danger },

  error: {
    fontSize: 12,
    fontFamily: 'Heebo_400Regular',
    color: colors.danger,
    textAlign: 'right',
  },
});
