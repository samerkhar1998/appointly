import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

const STEPS = [
  t('step_service'),
  t('step_staff'),
  t('step_datetime'),
  t('step_details'),
  t('step_otp'),
] as const;

interface Props {
  /** 0-based current step index (confirmation is not shown in the bar) */
  currentStep: number;
}

// Renders the booking-flow step progress bar.
// Uses row-reverse so step 0 sits on the right (RTL reading start) and
// step 4 on the left. Each step renders as a column: dot on top, label below.
// Connector lines are interleaved between step columns and aligned to dot centre.
// currentStep: 0-based index of the active step.
export function BookingProgress({ currentStep }: Props) {
  const totalSteps = STEPS.length;

  return (
    <View style={styles.wrapper}>
      {/*
        Track — row-reverse so index 0 appears on the RIGHT.
        Items alternate: [stepCol] [line] [stepCol] [line] … [stepCol]
        alignItems: 'flex-start' lets the line use marginTop to align with the dot centre.
      */}
      <View style={styles.track}>
        {STEPS.map((label, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          const isLast = i === totalSteps - 1;

          return (
            <Fragment key={i}>
              {/* ── Step column: dot + label ── */}
              <View style={styles.stepCol}>
                <View
                  style={[
                    styles.dot,
                    isDone && styles.dotDone,
                    isActive && styles.dotActive,
                  ]}
                >
                  {isDone ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : (
                    <Text style={[styles.dotNumber, isActive && styles.dotNumberActive]}>
                      {i + 1}
                    </Text>
                  )}
                </View>

                {/*
                  Label — always occupies one line of height to keep dots vertically aligned.
                  Only the active step renders visible text.
                */}
                <Text
                  style={[styles.stepLabel, isActive && styles.stepLabelActive]}
                  numberOfLines={1}
                >
                  {isActive ? label : ''}
                </Text>
              </View>

              {/* ── Connector line between this step and the next ── */}
              {!isLast && (
                <View style={styles.lineWrapper}>
                  <View style={styles.lineTrack} />
                  {isDone && <View style={styles.lineFill} />}
                </View>
              )}
            </Fragment>
          );
        })}
      </View>
    </View>
  );
}

const DOT_SIZE = 30;
const LINE_H = 3;
// Push the connector line down so it centres with the dot.
const LINE_MARGIN_TOP = (DOT_SIZE - LINE_H) / 2;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.card,
  },

  // row-reverse → step 0 on right, step 4 on left.
  // alignItems: 'flex-start' → each child starts at the top; we use marginTop on lines.
  track: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
  },

  // Each step is a fixed-width column (dot centred, label below).
  stepCol: {
    alignItems: 'center',
    gap: spacing[1],
    // Fixed width keeps dots evenly spaced regardless of label text length.
    width: DOT_SIZE + spacing[4],
  },

  // ── Dot ────────────────────────────────────────────────────────────
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    // Future step default
    backgroundColor: colors.surface.floating,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dotDone: {
    backgroundColor: colors.brand[100],
    borderColor: colors.brand[300],
  },
  dotActive: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
    ...shadows.elevated,
  },

  checkmark: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.sm,
    color: colors.brand[600],
    lineHeight: fontSize.sm + 2,
  },
  dotNumber: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    lineHeight: fontSize.xs + 2,
  },
  dotNumberActive: {
    color: colors.white,
  },

  // ── Step label ─────────────────────────────────────────────────────
  // Always rendered (keeps height stable); invisible for non-active steps.
  stepLabel: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.xs,
    color: 'transparent',   // invisible but occupies space
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.brand[700],
    fontFamily: 'Heebo_700Bold',
  },

  // ── Connector line ─────────────────────────────────────────────────
  // flex: 1 fills remaining width between step columns.
  // marginTop centres the line with the dot.
  lineWrapper: {
    flex: 1,
    marginTop: LINE_MARGIN_TOP,
    marginHorizontal: spacing[0.5],
    height: LINE_H,
    position: 'relative',
  },
  lineTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: LINE_H,
    backgroundColor: colors.border,
    borderRadius: radius.full,
  },
  lineFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: LINE_H,
    backgroundColor: colors.brand[400],
    borderRadius: radius.full,
  },
});
