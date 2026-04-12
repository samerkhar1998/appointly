import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { useBookingStore } from '@/store/booking';
import { BookingProgress } from '@/components/BookingProgress';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatTime } from '@/lib/utils';
import { colors, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0] as string;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Format a date as short Hebrew weekday + day number */
function formatDayLabel(d: Date): { weekday: string; day: string } {
  const weekday = new Intl.DateTimeFormat('he-IL', { weekday: 'short' }).format(d);
  const day = String(d.getDate());
  return { weekday, day };
}

const DAYS_TO_SHOW = 14;

export default function DateTimeScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const booking = useBookingStore((s) => s.booking);
  const setBooking = useBookingStore((s) => s.setBooking);
  const insets = useSafeAreaInsets();
  const dateStripRef = useRef<ScrollView>(null);

  // Compute today fresh on each screen mount — avoids stale date if app stays open overnight.
  const today = new Date();
  const dates = Array.from({ length: DAYS_TO_SHOW }, (_, i) => addDays(today, i));
  const [selectedDate, setSelectedDate] = useState<Date>(today);


  const dateStr = toDateString(selectedDate);

  const { data, isLoading, isError } = trpc.availability.getSlots.useQuery(
    {
      salon_id: booking.salon_id ?? '',
      service_id: booking.service_id ?? '',
      date: dateStr,
      staff_id: booking.staff_id ?? undefined,
    },
    { enabled: !!(booking.salon_id && booking.service_id) },
  );

  function handleSlotSelect(slot: { start: string; staff_id: string }) {
    setBooking({ start_datetime: slot.start, staff_id: slot.staff_id });
    router.push(`/book/${slug}/details`);
  }

  return (
    <View style={styles.flex}>
      <BookingProgress currentStep={2} />

      {/* Date strip */}
      <View style={styles.dateStrip}>
        <ScrollView
          ref={dateStripRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStripContent}
          onContentSizeChange={() => dateStripRef.current?.scrollToEnd({ animated: false })}
        >
          {dates.map((d) => {
            const ds = toDateString(d);
            const isSelected = ds === dateStr;
            const { weekday, day } = formatDayLabel(d);
            return (
              <Pressable
                key={ds}
                onPress={() => setSelectedDate(d)}
                style={[styles.dateChip, isSelected && styles.dateChipActive]}
              >
                <Text style={[styles.dateWeekday, isSelected && styles.dateTextActive]}>
                  {weekday}
                </Text>
                <Text style={[styles.dateDay, isSelected && styles.dateTextActive]}>{day}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('datetime_title')}</Text>

        {isError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{t('datetime_slots_error')}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.slotsGrid}>
            {[...Array(9)].map((_, i) => (
              <Skeleton key={i} height={44} style={styles.slotSkeleton} />
            ))}
          </View>
        ) : data?.slots.length ? (
          <View style={styles.slotsGrid}>
            {data.slots.map((slot) => (
              <Pressable
                key={`${slot.start}:${slot.staff_id}`}
                onPress={() => handleSlotSelect(slot)}
                style={({ pressed }) => [
                  styles.slotChip,
                  pressed && styles.slotChipPressed,
                ]}
              >
                <Text style={styles.slotTime}>
                  {formatTime(slot.start, booking.salon_timezone ?? 'Asia/Jerusalem')}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>{t('datetime_no_slots')}</Text>
        )}

        <Button variant="outline" onPress={() => router.back()}>
          {t('back')}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },

  dateStrip: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateStripContent: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    gap: spacing[2],
    flexDirection: 'row-reverse',
  },
  dateChip: {
    width: 52,
    paddingVertical: spacing[2],
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.surface.floating,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dateChipActive: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
  },
  dateWeekday: {
    fontFamily: 'Heebo_500Medium',
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },
  dateDay: {
    fontFamily: 'Heebo_700Bold',
    fontSize: 17,
    color: colors.foreground,
    textAlign: 'center',
  },
  dateTextActive: { color: colors.white },

  content: { padding: spacing[4], gap: spacing[5] },

  title: {
    fontFamily: 'Heebo_700Bold',
    fontSize: 20,
    color: colors.foreground,
    textAlign: 'right',
    letterSpacing: -0.5,
  },

  slotsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  slotChip: {
    width: '30%',
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.brand[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotChipPressed: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[400],
  },
  slotTime: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: 14,
    color: colors.brand[700],
  },
  slotSkeleton: {
    width: '30%',
    borderRadius: 12,
  },

  errorBox: {
    backgroundColor: colors.dangerLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    padding: spacing[4],
  },
  errorText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 14,
    color: colors.danger,
    textAlign: 'right',
  },
  empty: {
    fontFamily: 'Heebo_400Regular',
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing[10],
  },
});
