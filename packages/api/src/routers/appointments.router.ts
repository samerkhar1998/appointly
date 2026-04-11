import { TRPCError } from '@trpc/server';
import { createHmac } from 'crypto';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, salonOwnerProcedure } from '../trpc';
import { createBookingSchema, cancelByTokenSchema } from '@appointly/shared';
import { notificationService } from '../lib/notifications';
import { scheduleReminders, cancelReminders } from '../lib/queue';

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

// Hashes a cancellation OTP for secure storage.
// Uses HMAC-SHA256 with phone as context to bind code to recipient.
function hashCancelOtp(code: string, phone: string): string {
  const secret = process.env['JWT_SECRET'] ?? 'dev-otp-secret';
  return createHmac('sha256', secret).update(`cancel:${phone}:${code}`).digest('hex');
}

export const appointmentsRouter = createTRPCRouter({
  // Creates a new appointment booking.
  // Validates the OTP verification token, checks for slot conflicts,
  // upserts the salon client, then persists the appointment.
  // If the salon's confirmation mode is AUTO, immediately confirms the appointment.
  // Returns the appointment ID and cancel token.
  create: publicProcedure.input(createBookingSchema).mutation(async ({ input, ctx }) => {
    // 1. Validate verification token
    const verification = await ctx.db.phoneVerification.findFirst({
      where: {
        verification_token: input.verification_token,
        verified: true,
        token_used: false,
      },
    });
    if (!verification) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired verification token',
      });
    }

    // 2. Load service to get duration
    const service = await ctx.db.service.findUniqueOrThrow({
      where: { id: input.service_id, is_active: true },
    });

    // 3. Determine staff — use provided or find first bookable
    let staffId = input.staff_id;
    if (!staffId) {
      const anyStaff = await ctx.db.staff.findFirst({
        where: {
          salon_member: { salon_id: service.salon_id, is_active: true },
          is_bookable: true,
        },
        select: { id: true },
      });
      if (!anyStaff) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No bookable staff available' });
      }
      staffId = anyStaff.id;
    }

    const start = new Date(input.start_datetime);
    const end = new Date(start.getTime() + service.duration_mins * 60_000);

    // 4. Double-check no conflict
    const conflict = await ctx.db.appointment.findFirst({
      where: {
        staff_id: staffId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        start_datetime: { lt: end },
        end_datetime: { gt: start },
      },
    });
    if (conflict) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'This time slot is no longer available',
      });
    }

    // 5. Load salon settings to determine confirmation mode
    const salon = await ctx.db.salon.findUniqueOrThrow({
      where: { id: service.salon_id },
      include: { settings: true },
    });

    const isAutoConfirm = salon.settings?.confirmation_mode === 'AUTO';

    // 6. Upsert salon client
    const salonClient = await ctx.db.salonClient.upsert({
      where: { salon_id_phone: { salon_id: salon.id, phone: input.customer_phone } },
      update: { name: input.customer_name, email: input.customer_email },
      create: {
        salon_id: salon.id,
        name: input.customer_name,
        phone: input.customer_phone,
        email: input.customer_email,
      },
    });

    // 7. Create appointment (and optionally confirm in the same transaction)
    const appointment = await ctx.db.appointment.create({
      data: {
        salon_id: salon.id,
        staff_id: staffId,
        service_id: input.service_id,
        salon_client_id: salonClient.id,
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        customer_email: input.customer_email,
        start_datetime: start,
        end_datetime: end,
        status: isAutoConfirm ? 'CONFIRMED' : 'PENDING',
      },
      include: { staff: true },
    });

    // 8. Mark verification token as used
    await ctx.db.phoneVerification.update({
      where: { id: verification.id },
      data: { token_used: true },
    });

    // 9. Send WhatsApp confirmation + schedule reminder jobs (non-blocking)
    void sendConfirmationNotification({ appointment, service, salon }).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error('[notifications] confirmation failed:', err);
    });

    if (isAutoConfirm) {
      // Schedule reminders only for confirmed appointments
      void scheduleReminders(appointment.id, appointment.start_datetime).catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error('[queue] scheduleReminders failed:', err);
      });
    }

    return { appointment_id: appointment.id, cancel_token: appointment.cancel_token };
  }),

  // Lists appointments for a salon with optional filters.
  // Supports filtering by status, staff, and date range with pagination.
  // Returns paginated appointment items with service and staff details.
  list: salonOwnerProcedure
    .input(
      z.object({
        salon_id: z.string().cuid(),
        status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
        staff_id: z.string().cuid().optional(),
        date_from: z.string().datetime({ offset: true }).optional(),
        date_to: z.string().datetime({ offset: true }).optional(),
        page: z.number().int().positive().default(1),
        per_page: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { salon_id, status, staff_id, date_from, date_to, page, per_page } = input;
      const skip = (page - 1) * per_page;

      const where = {
        salon_id,
        ...(status ? { status } : {}),
        ...(staff_id ? { staff_id } : {}),
        ...(date_from ? { start_datetime: { gte: new Date(date_from) } } : {}),
        ...(date_to ? { end_datetime: { lte: new Date(date_to) } } : {}),
      };

      const [items, total] = await Promise.all([
        ctx.db.appointment.findMany({
          where,
          include: {
            staff: { select: { id: true, display_name: true } },
            service: { select: { id: true, name: true, duration_mins: true, price: true } },
            salon_client: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { start_datetime: 'asc' },
          skip,
          take: per_page,
        }),
        ctx.db.appointment.count({ where }),
      ]);

      return { items, total, page, per_page, total_pages: Math.ceil(total / per_page) };
    }),

  // Confirms a pending appointment by the salon owner.
  // Schedules 24h and 1h reminder jobs after confirming.
  confirm: salonOwnerProcedure
    .input(z.object({ appointment_id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db.appointment.update({
        where: { id: input.appointment_id },
        data: { status: 'CONFIRMED' },
      });

      void scheduleReminders(updated.id, updated.start_datetime).catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error('[queue] scheduleReminders failed:', err);
      });

      return updated;
    }),

  // Declines a pending appointment by the salon owner.
  // Cancels any pending reminder jobs.
  // reason: optional explanation shown to the customer
  decline: salonOwnerProcedure
    .input(z.object({ appointment_id: z.string().cuid(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db.appointment.update({
        where: { id: input.appointment_id },
        data: {
          status: 'CANCELLED',
          cancelled_by: 'OWNER',
          cancellation_reason: input.reason,
        },
      });

      void cancelReminders(updated.id).catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error('[queue] cancelReminders failed:', err);
      });

      return updated;
    }),

  // Returns appointment details by cancel token without consuming it.
  // Used by the cancel page to show what will be cancelled before confirming.
  getByToken: publicProcedure
    .input(z.object({ token: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const appointment = await ctx.db.appointment.findFirst({
        where: { cancel_token: input.token, cancel_token_used: false },
        select: {
          id: true,
          start_datetime: true,
          status: true,
          customer_name: true,
          customer_phone: true,
          salon: { select: { name: true, timezone: true, settings: true } },
          service: { select: { name: true, duration_mins: true } },
          staff: { select: { display_name: true } },
        },
      });

      if (!appointment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cancellation link is invalid or already used',
        });
      }

      return {
        id: appointment.id,
        customer_name: appointment.customer_name,
        customer_phone: appointment.customer_phone,
        start_datetime: appointment.start_datetime.toISOString(),
        status: appointment.status,
        salon_name: appointment.salon.name,
        salon_timezone: appointment.salon.timezone,
        service_name: appointment.service.name,
        service_duration: appointment.service.duration_mins,
        staff_name: appointment.staff?.display_name ?? null,
        cancellation_window_hours: appointment.salon.settings?.cancellation_window_hours ?? 24,
      };
    }),

  // Cancels an appointment using a single-use magic-link token.
  // Enforces the salon's cancellation window policy.
  cancelByToken: publicProcedure
    .input(cancelByTokenSchema)
    .mutation(async ({ input, ctx }) => {
      const appointment = await ctx.db.appointment.findFirst({
        where: { cancel_token: input.token, cancel_token_used: false },
        include: { salon: { include: { settings: true } } },
      });

      if (!appointment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cancellation link is invalid or already used',
        });
      }
      if (appointment.status === 'CANCELLED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Appointment already cancelled' });
      }

      const windowHours = appointment.salon.settings?.cancellation_window_hours ?? 24;
      const hoursUntilAppt =
        (appointment.start_datetime.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilAppt < windowHours) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Cancellations must be made at least ${windowHours} hours in advance`,
        });
      }

      await ctx.db.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'CANCELLED',
          cancelled_by: 'CUSTOMER',
          cancel_token_used: true,
        },
      });

      void cancelReminders(appointment.id).catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error('[queue] cancelReminders failed:', err);
      });

      return { success: true };
    }),

  // Sends a 6-digit OTP to the customer's phone to initiate phone-OTP cancellation.
  // The customer must have an existing appointment with the given ID.
  requestOTP: publicProcedure
    .input(z.object({ appointment_id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const appointment = await ctx.db.appointment.findUnique({
        where: { id: input.appointment_id },
        include: { salon: { select: { name: true, settings: true } } },
      });

      if (!appointment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found' });
      }
      if (appointment.status === 'CANCELLED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Appointment already cancelled' });
      }

      // Invalidate previous cancellation OTPs for this phone
      await ctx.db.phoneVerification.updateMany({
        where: { phone_number: appointment.customer_phone, verified: false },
        data: { expires_at: new Date() },
      });

      const code = Math.floor(100_000 + Math.random() * 900_000).toString();
      const code_hash = hashCancelOtp(code, appointment.customer_phone);

      await ctx.db.phoneVerification.create({
        data: {
          phone_number: appointment.customer_phone,
          code_hash,
          expires_at: new Date(Date.now() + OTP_EXPIRY_MS),
        },
      });

      await notificationService.sendOtp({
        to: appointment.customer_phone,
        code,
        salon_name: appointment.salon.name,
      });

      return { success: true };
    }),

  // Verifies an OTP and cancels the appointment if the code is valid.
  // Enforces the salon's cancellation window policy.
  cancelByOTP: publicProcedure
    .input(z.object({ appointment_id: z.string().cuid(), code: z.string().length(6) }))
    .mutation(async ({ input, ctx }) => {
      const appointment = await ctx.db.appointment.findUnique({
        where: { id: input.appointment_id },
        include: { salon: { include: { settings: true } } },
      });

      if (!appointment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found' });
      }
      if (appointment.status === 'CANCELLED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Appointment already cancelled' });
      }

      // Find the latest active OTP for this phone
      const record = await ctx.db.phoneVerification.findFirst({
        where: {
          phone_number: appointment.customer_phone,
          verified: false,
          expires_at: { gt: new Date() },
        },
        orderBy: { created_at: 'desc' },
      });

      if (!record) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No active OTP found. Please request a new code.',
        });
      }

      if (record.attempts >= MAX_OTP_ATTEMPTS) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many failed attempts. Please request a new code.',
        });
      }

      const expectedHash = hashCancelOtp(input.code, appointment.customer_phone);
      if (record.code_hash !== expectedHash) {
        await ctx.db.phoneVerification.update({
          where: { id: record.id },
          data: { attempts: { increment: 1 } },
        });
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid code. Please try again.' });
      }

      const windowHours = appointment.salon.settings?.cancellation_window_hours ?? 24;
      const hoursUntilAppt =
        (appointment.start_datetime.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilAppt < windowHours) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Cancellations must be made at least ${windowHours} hours in advance`,
        });
      }

      await ctx.db.$transaction([
        ctx.db.appointment.update({
          where: { id: appointment.id },
          data: { status: 'CANCELLED', cancelled_by: 'CUSTOMER' },
        }),
        ctx.db.phoneVerification.update({
          where: { id: record.id },
          data: { verified: true },
        }),
      ]);

      void cancelReminders(appointment.id).catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error('[queue] cancelReminders failed:', err);
      });

      return { success: true };
    }),

  // Returns all appointments for a date range without pagination — used by the calendar view.
  listForCalendar: salonOwnerProcedure
    .input(
      z.object({
        salon_id: z.string().cuid(),
        date_from: z.string().datetime({ offset: true }),
        date_to: z.string().datetime({ offset: true }),
      }),
    )
    .query(async ({ input, ctx }) => {
      return ctx.db.appointment.findMany({
        where: {
          salon_id: input.salon_id,
          start_datetime: { gte: new Date(input.date_from) },
          end_datetime: { lte: new Date(input.date_to) },
          status: { not: 'CANCELLED' },
        },
        include: {
          staff: { select: { id: true, display_name: true } },
          service: { select: { id: true, name: true, duration_mins: true } },
          salon_client: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { start_datetime: 'asc' },
      });
    }),

  // Updates the status of an appointment by the salon owner.
  // Schedules reminder jobs when confirming; cancels them when cancelling.
  updateStatus: salonOwnerProcedure
    .input(
      z.object({
        appointment_id: z.string().cuid(),
        status: z.enum(['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED']),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db.appointment.update({
        where: { id: input.appointment_id },
        data: {
          status: input.status,
          ...(input.status === 'CANCELLED'
            ? { cancelled_by: 'OWNER', cancellation_reason: input.reason }
            : {}),
        },
      });

      if (input.status === 'CONFIRMED') {
        void scheduleReminders(updated.id, updated.start_datetime).catch((err: unknown) => {
          // eslint-disable-next-line no-console
          console.error('[queue] scheduleReminders failed:', err);
        });
      } else if (input.status === 'CANCELLED') {
        void cancelReminders(updated.id).catch((err: unknown) => {
          // eslint-disable-next-line no-console
          console.error('[queue] cancelReminders failed:', err);
        });
      }

      return updated;
    }),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Sends a WhatsApp/SMS confirmation after a booking is created.
// Loads all required data from the appointment object.
// Non-blocking — caller should fire-and-forget with .catch() for logging.
async function sendConfirmationNotification({
  appointment,
  service,
  salon,
}: {
  appointment: {
    id: string;
    cancel_token: string;
    customer_phone: string;
    customer_name: string;
    start_datetime: Date;
    staff: { display_name: string };
  };
  service: { name: string };
  salon: {
    name: string;
    slug: string;
    timezone: string;
    settings: { wa_confirmation_template: string | null } | null;
  };
}): Promise<void> {
  await notificationService.sendConfirmation({
    to: appointment.customer_phone,
    customer_name: appointment.customer_name,
    salon_name: salon.name,
    service_name: service.name,
    staff_name: appointment.staff.display_name,
    start_datetime: appointment.start_datetime.toISOString(),
    timezone: salon.timezone,
    cancel_link: notificationService.buildCancelLink(appointment.cancel_token),
    rebook_link: notificationService.buildRebookLink(salon.slug),
    template: salon.settings?.wa_confirmation_template ?? null,
  });
}
