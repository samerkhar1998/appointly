import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, salonOwnerProcedure } from '../trpc.js';
import { createStaffSchema, updateStaffSchema, staffScheduleSchema, addBlockedTimeSchema } from '@appointly/shared';

export const staffRouter = createTRPCRouter({
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

  create: salonOwnerProcedure
    .input(z.object({ salon_id: z.string().cuid(), data: createStaffSchema }))
    .mutation(async ({ input, ctx }) => {
      // Ensure member exists in salon
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
      // TODO: verify salon ownership
      return ctx.db.staff.update({
        where: { id: input.staff_id },
        data: input.data,
      });
    }),

  setSchedule: salonOwnerProcedure
    .input(staffScheduleSchema)
    .mutation(async ({ input, ctx }) => {
      // Upsert each day
      for (const day of input.schedule) {
        await ctx.db.staffSchedule.upsert({
          where: {
            staff_id_day_of_week: {
              staff_id: input.staff_id,
              day_of_week: day.day_of_week,
            },
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
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'end_datetime must be after start_datetime',
        });
      }
      return ctx.db.staffBlockedTime.create({
        data: {
          staff_id: input.staff_id,
          start_datetime: start,
          end_datetime: end,
          reason: input.reason,
        },
      });
    }),
});
