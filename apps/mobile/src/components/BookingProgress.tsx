import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/lib/theme';
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
  const totalSteps = STEPS.length;
  const progress = (currentStep + 1) / totalSteps;

  const currentLabel = STEPS[currentStep] ?? '';
  const nextLabel = currentStep < totalSteps - 1 ? STEPS[currentStep + 1] : null;

  return (
    <View style={styles.container}>
      {/* Step info row */}
      <View style={styles.infoRow}>
        <Text style={styles.stepCounter}>
          {currentStep + 1} / {totalSteps}
        </Text>
        <View style={styles.stepNames}>
          <Text style={styles.currentStep}>{currentLabel}</Text>
          {nextLabel ? (
            <Text style={styles.nextStep}> ← {nextLabel}</Text>
          ) : null}
        </View>
      </View>

      {/* Progress bar track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        {/* Step markers */}
        {STEPS.map((_, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          const pos = ((i + 1) / totalSteps) * 100;
          return (
            <View
              key={i}
              style={[
                styles.marker,
                { left: `${pos}%` as unknown as number },
                isDone && styles.markerDone,
                isActive && styles.markerActive,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    gap: spacing[2],
  },

  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepCounter: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  stepNames: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentStep: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.sm,
    color: colors.brand[700],
    textAlign: 'right',
  },
  nextStep: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },

  track: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'visible',
    position: 'relative',
  },
  fill: {
    height: 6,
    backgroundColor: colors.brand[600],
    borderRadius: radius.full,
  },
  marker: {
    position: 'absolute',
    top: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
    marginLeft: -6,
    borderWidth: 2,
    borderColor: colors.white,
  },
  markerDone: {
    backgroundColor: colors.brand[600],
  },
  markerActive: {
    backgroundColor: colors.white,
    borderColor: colors.brand[600],
    borderWidth: 3,
    width: 14,
    height: 14,
    top: -4,
    marginLeft: -7,
    shadowColor: colors.brand[600],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
});
