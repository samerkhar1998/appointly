import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, salonOwnerProcedure } from '../trpc.js';
import { createBookingSchema, cancelByTokenSchema } from '@appointly/shared';

export const appointmentsRouter = createTRPCRouter({
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

    // 3. Determine staff
    const staffId = input.staff_id ?? (await ctx.db.staff.findFirstOrThrow({
      where: { salon_member: { is_active: true }, is_bookable: true },
      select: { id: true },
    })).id;

    const start = new Date(input.start_datetime);
    const end = new Date(start.getTime() + service.duration_mins * 60_000);

    // 4. Double-check no conflict
    const conflict = await ctx.db.appointment.findFirst({
      where: {
        staff_id: staffId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          { start_datetime: { lt: end }, end_datetime: { gt: start } },
        ],
      },
    });
    if (conflict) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'This time slot is no longer available',
      });
    }

    // 5. Find or create salon client
    const salon = await ctx.db.service.findUniqueOrThrow({
      where: { id: input.service_id },
      select: { salon_id: true },
    });

    const salonClient = await ctx.db.salonClient.upsert({
      where: { salon_id_phone: { salon_id: salon.salon_id, phone: input.customer_phone } },
      update: { name: input.customer_name, email: input.customer_email },
      create: {
        salon_id: salon.salon_id,
        name: input.customer_name,
        phone: input.customer_phone,
        email: input.customer_email,
      },
    });

    // 6. Create appointment
    const appointment = await ctx.db.appointment.create({
      data: {
        salon_id: salon.salon_id,
        staff_id: staffId,
        service_id: input.service_id,
        salon_client_id: salonClient.id,
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        customer_email: input.customer_email,
        start_datetime: start,
        end_datetime: end,
        status: 'PENDING', // will be auto-confirmed by job if settings say AUTO
      },
    });

    // 7. Mark token used
    await ctx.db.phoneVerification.update({
      where: { id: verification.id },
      data: { token_used: true },
    });

    // TODO: trigger WhatsApp confirmation message
    // TODO: if salon.settings.confirmation_mode === AUTO → confirm immediately

    return { appointment_id: appointment.id, cancel_token: appointment.cancel_token };
  }),

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

  confirm: salonOwnerProcedure
    .input(z.object({ appointment_id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.appointment.update({
        where: { id: input.appointment_id },
        data: { status: 'CONFIRMED' },
      });
    }),

  decline: salonOwnerProcedure
    .input(z.object({ appointment_id: z.string().cuid(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.appointment.update({
        where: { id: input.appointment_id },
        data: {
          status: 'CANCELLED',
          cancelled_by: 'OWNER',
          cancellation_reason: input.reason,
        },
      });
    }),

  cancelByToken: publicProcedure
    .input(cancelByTokenSchema)
    .mutation(async ({ input, ctx }) => {
      const appointment = await ctx.db.appointment.findFirst({
        where: { cancel_token: input.token, cancel_token_used: false },
        include: { salon: { include: { settings: true } } },
      });

      if (!appointment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cancellation link is invalid or already used' });
      }
      if (appointment.status === 'CANCELLED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Appointment already cancelled' });
      }

      // Check cancellation window
      const settings = appointment.salon.settings;
      const windowHours = settings?.cancellation_window_hours ?? 24;
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

      return { success: true };
    }),

  requestOTP: publicProcedure
    .input(z.object({ appointment_id: z.string().cuid() }))
    .mutation(async () => {
      // TODO: send OTP via phone for cancellation
      throw new TRPCError({ code: 'NOT_IMPLEMENTED', message: 'TODO' });
    }),

  cancelByOTP: publicProcedure
    .input(z.object({ appointment_id: z.string().cuid(), code: z.string().length(6) }))
    .mutation(async () => {
      // TODO: verify OTP and cancel
      throw new TRPCError({ code: 'NOT_IMPLEMENTED', message: 'TODO' });
    }),

  updateStatus: salonOwnerProcedure
    .input(
      z.object({
        appointment_id: z.string().cuid(),
        status: z.enum(['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED']),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.appointment.update({
        where: { id: input.appointment_id },
        data: {
          status: input.status,
          ...(input.status === 'CANCELLED'
            ? { cancelled_by: 'OWNER', cancellation_reason: input.reason }
            : {}),
        },
      });
    }),
});
