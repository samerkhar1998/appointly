import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { getAvailabilitySchema } from '@appointly/shared';

export interface TimeSlot {
  start: string; // ISO UTC
  end: string;   // ISO UTC
  staff_id: string;
}

/** Parse "HH:mm" + a Date (in salon timezone) into a UTC Date */
function parseLocalTime(timeStr: string, date: Date, tzOffsetMinutes: number): Date {
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = parseInt(mStr ?? '0', 10);
  const localMs =
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), h, m) -
    tzOffsetMinutes * 60_000;
  return new Date(localMs);
}

/** Get timezone offset in minutes for a given IANA timezone at a specific date */
function getTzOffsetMinutes(timezone: string, date: Date): number {
  // Use Intl to determine the UTC offset
  const utcDate = new Date(date.toISOString().split('T')[0] + 'T12:00:00Z');
  const localStr = utcDate.toLocaleString('en-US', { timeZone: timezone, hour12: false });
  // Parse localStr back to a Date and compute diff
  const localDate = new Date(localStr + ' UTC');
  return Math.round((utcDate.getTime() - localDate.getTime()) / 60_000);
}

function doOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export const availabilityRouter = createTRPCRouter({
  getSlots: publicProcedure.input(getAvailabilitySchema).query(async ({ input, ctx }) => {
    const { salon_id, service_id, date } = input;
    const requestedStaffId = input.staff_id;

    // ── 1. Load service ─────────────────────────────────────────────────────
    const service = await ctx.db.service.findFirst({
      where: { id: service_id, salon_id, is_active: true },
    });
    if (!service) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Service not found' });
    }

    // ── 2. Load salon + hours ───────────────────────────────────────────────
    const salon = await ctx.db.salon.findUniqueOrThrow({
      where: { id: salon_id },
      include: {
        settings: true,
        hours: true,
      },
    });

    const requestedDate = new Date(date + 'T12:00:00Z');
    const dayOfWeek = new Date(date + 'T00:00:00Z').getUTCDay();

    const salonHoursForDay = salon.hours.find((h) => h.day_of_week === dayOfWeek);
    if (!salonHoursForDay || salonHoursForDay.is_closed) {
      return { slots: [] };
    }

    const tzOffset = getTzOffsetMinutes(salon.timezone, requestedDate);

    const salonOpen = parseLocalTime(salonHoursForDay.open_time, requestedDate, tzOffset);
    const salonClose = parseLocalTime(salonHoursForDay.close_time, requestedDate, tzOffset);

    // ── 3. Load staff ───────────────────────────────────────────────────────
    let staffList: Array<{
      id: string;
      schedules: Array<{ day_of_week: number; start_time: string; end_time: string; is_working: boolean }>;
    }>;

    if (requestedStaffId) {
      const staff = await ctx.db.staff.findFirst({
        where: {
          id: requestedStaffId,
          is_bookable: true,
          salon_member: { salon_id, is_active: true },
        },
        include: { schedules: true },
      });
      if (!staff) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Staff member not found' });
      }
      staffList = [staff];
    } else {
      staffList = await ctx.db.staff.findMany({
        where: {
          is_bookable: true,
          salon_member: { salon_id, is_active: true },
        },
        include: { schedules: true },
      });
    }

    const slotIntervalMins = salon.settings?.booking_slot_interval_mins ?? 15;
    const bufferMins = salon.settings?.buffer_after_mins ?? 0;
    const durationMins = service.duration_mins;
    const totalMins = durationMins + bufferMins;

    // Day boundary for DB queries (UTC)
    const dayStart = new Date(date + 'T00:00:00Z');
    const dayEnd = new Date(date + 'T23:59:59Z');

    const allSlots: TimeSlot[] = [];

    for (const staff of staffList) {
      // ── 4a. Check staff schedule ─────────────────────────────────────────
      const staffSchedule = staff.schedules.find((s) => s.day_of_week === dayOfWeek);
      if (!staffSchedule || !staffSchedule.is_working) continue;

      const staffStart = parseLocalTime(staffSchedule.start_time, requestedDate, tzOffset);
      const staffEnd = parseLocalTime(staffSchedule.end_time, requestedDate, tzOffset);

      // Working window = intersection of salon hours and staff schedule
      const windowStart = staffStart > salonOpen ? staffStart : salonOpen;
      const windowEnd = staffEnd < salonClose ? staffEnd : salonClose;

      if (windowEnd <= windowStart) continue;

      // ── 4b. Load existing appointments ───────────────────────────────────
      const appointments = await ctx.db.appointment.findMany({
        where: {
          staff_id: staff.id,
          status: { in: ['PENDING', 'CONFIRMED'] },
          start_datetime: { gte: dayStart },
          end_datetime: { lte: dayEnd },
        },
        select: { start_datetime: true, end_datetime: true },
      });

      // ── 4c. Load blocked times ────────────────────────────────────────────
      const blockedTimes = await ctx.db.staffBlockedTime.findMany({
        where: {
          staff_id: staff.id,
          start_datetime: { lt: dayEnd },
          end_datetime: { gt: dayStart },
        },
        select: { start_datetime: true, end_datetime: true },
      });

      const busyPeriods: Array<{ start: Date; end: Date }> = [
        ...appointments.map((a) => ({ start: a.start_datetime, end: a.end_datetime })),
        ...blockedTimes.map((b) => ({ start: b.start_datetime, end: b.end_datetime })),
      ];

      // ── 4d. Generate candidate slots ─────────────────────────────────────
      let cursor = windowStart.getTime();
      const windowEndMs = windowEnd.getTime();
      const slotIntervalMs = slotIntervalMins * 60_000;
      const totalMs = totalMins * 60_000;

      while (cursor + totalMs <= windowEndMs) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(cursor + totalMs);

        const hasConflict = busyPeriods.some((b) => doOverlap(slotStart, slotEnd, b.start, b.end));

        if (!hasConflict) {
          allSlots.push({
            start: slotStart.toISOString(),
            end: new Date(cursor + durationMins * 60_000).toISOString(), // exclude buffer from displayed end
            staff_id: staff.id,
          });
        }

        cursor += slotIntervalMs;
      }
    }

    // ── 5. Deduplicate (by start+staff), sort ────────────────────────────
    const seen = new Set<string>();
    const uniqueSlots = allSlots.filter((s) => {
      const key = `${s.start}:${s.staff_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    uniqueSlots.sort((a, b) => {
      const timeDiff = new Date(a.start).getTime() - new Date(b.start).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.staff_id.localeCompare(b.staff_id);
    });

    return { slots: uniqueSlots };
  }),
});
