import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, salonOwnerProcedure } from '../trpc';
import { createStaffSchema, updateStaffSchema, staffScheduleSchema, addBlockedTimeSchema } from '@appointly/shared';

export const staffRouter = createTRPCRouter({
  // Public — used by booking flow
  list: publicProcedure
    .input(z.object({ salon_id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.staff.findMany({
        where: {
          salon_member: { salon_id: input.salon_id, is_active: true },
          is_bookable: true,
        },
        include: {
          salon_member: { include: { user: { select: { id: true, name: true } } } },
          schedules: true,
        },
      });
    }),

  // Dashboard — all staff including non-bookable
  listAll: salonOwnerProcedure
    .input(z.object({ salon_id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.staff.findMany({
        where: { salon_member: { salon_id: input.salon_id } },
        include: {
          salon_member: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          schedules: { orderBy: { day_of_week: 'asc' } },
        },
        orderBy: { display_name: 'asc' },
      });
    }),

  // Dashboard — create staff + user + salon member in one transaction
  createSimple: salonOwnerProcedure
    .input(
      z.object({
        salon_id: z.string().cuid(),
        display_name: z.string().min(1).max(100),
        email: z.string().email(),
        bio: z.string().max(500).optional(),
        avatar_url: z.string().url().optional(),
        is_bookable: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        // Create or reuse a user account
        const user = await tx.user.upsert({
          where: { email: input.email },
          update: {},
          create: {
            email: input.email,
            name: input.display_name,
            password_hash: 'pending-invite',
            // Staff users have CUSTOMER global role; their SalonMember record scopes salon access
            global_role: 'CUSTOMER',
          },
        });

        // Check if already a salon member
        const existingMember = await tx.salonMember.findUnique({
          where: { user_id_salon_id: { user_id: user.id, salon_id: input.salon_id } },
        });

        const memberId = existingMember
          ? existingMember.id
          : (
              await tx.salonMember.create({
                data: { user_id: user.id, salon_id: input.salon_id, role: 'STAFF' },
              })
            ).id;

        // Prevent duplicate staff records
        const existingStaff = await tx.staff.findUnique({
          where: { salon_member_id: memberId },
        });
        if (existingStaff) {
          throw new TRPCError({ code: 'CONFLICT', message: 'איש צוות זה כבר קיים' });
        }

        return tx.staff.create({
          data: {
            salon_member_id: memberId,
            display_name: input.display_name,
            bio: input.bio,
            avatar_url: input.avatar_url,
            is_bookable: input.is_bookable,
          },
        });
      });
    }),

  create: salonOwnerProcedure
    .input(z.object({ salon_id: z.string().cuid(), data: createStaffSchema }))
    .mutation(async ({ input, ctx }) => {
      const member = await ctx.db.salonMember.findUniqueOrThrow({
        where: { user_id_salon_id: { user_id: input.data.user_id, salon_id: input.salon_id } },
      });
      return ctx.db.staff.create({
        data: {
          salon_member_id: member.id,
          display_name: input.data.display_name,
          bio: input.data.bio,
          avatar_url: input.data.avatar_url,
          is_bookable: input.data.is_bookable ?? true,
        },
      });
    }),

  update: salonOwnerProcedure
    .input(z.object({ staff_id: z.string().cuid(), data: updateStaffSchema }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.staff.update({
        where: { id: input.staff_id },
        data: input.data,
      });
    }),

  deactivate: salonOwnerProcedure
    .input(z.object({ staff_id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const staff = await ctx.db.staff.findUniqueOrThrow({
        where: { id: input.staff_id },
        select: { salon_member_id: true },
      });
      await ctx.db.salonMember.update({
        where: { id: staff.salon_member_id },
        data: { is_active: false },
      });
      return { success: true };
    }),

  setSchedule: salonOwnerProcedure
    .input(staffScheduleSchema)
    .mutation(async ({ input, ctx }) => {
      for (const day of input.schedule) {
        await ctx.db.staffSchedule.upsert({
          where: {
            staff_id_day_of_week: { staff_id: input.staff_id, day_of_week: day.day_of_week },
          },
          update: day,
          create: { staff_id: input.staff_id, ...day },
        });
      }
      return { success: true };
    }),

  addBlockedTime: salonOwnerProcedure
    .input(addBlockedTimeSchema)
    .mutation(async ({ input, ctx }) => {
      const start = new Date(input.start_datetime);
      const end = new Date(input.end_datetime);
      if (end <= start) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'end_datetime must be after start_datetime' });
      }
      return ctx.db.staffBlockedTime.create({
        data: { staff_id: input.staff_id, start_datetime: start, end_datetime: end, reason: input.reason },
      });
    }),
});
