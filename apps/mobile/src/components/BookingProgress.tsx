import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

const STEPS = [
  t('step_service'),
  t('step_staff'),
  t('step_datetime'),
  t('step_details'),
  t('step_otp'),
] as const;

interface Props {
  /** 0-based current step index (confirmation step is not shown) */
  currentStep: number;
}

export function BookingProgress({ currentStep }: Props) {
  return (
    <View style={styles.container}>
      {STEPS.map((label, i) => {
        const isDone = i < currentStep;
        const isActive = i === currentStep;
        return (
          <View key={label} style={styles.step}>
            <View style={[styles.bar, (isDone || isActive) && styles.barActive]} />
            <View style={styles.stepInner}>
              <View
                style={[
                  styles.dot,
                  isDone && styles.dotDone,
                  isActive && styles.dotActive,
                ]}
              >
                <Text style={[styles.dotLabel, (isDone || isActive) && styles.dotLabelActive]}>
                  {isDone ? '✓' : String(i + 1)}
                </Text>
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing[1],
  },
  step: {
    flex: 1,
  },
  bar: {
    height: 2,
    backgroundColor: colors.border,
  },
  barActive: {
    backgroundColor: colors.brand[600],
  },
  stepInner: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing[2],
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface.floating,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: colors.brand[600],
  },
  dotActive: {
    backgroundColor: colors.brand[100],
    borderWidth: 2,
    borderColor: colors.brand[600],
  },
  dotLabel: {
    fontSize: 10,
    fontFamily: 'Heebo_700Bold',
    color: colors.muted,
  },
  dotLabelActive: {
    color: colors.brand[700],
  },
  label: {
    fontSize: 10,
    fontFamily: 'Heebo_500Medium',
    color: colors.muted,
  },
  labelActive: {
    color: colors.brand[700],
  },
});
