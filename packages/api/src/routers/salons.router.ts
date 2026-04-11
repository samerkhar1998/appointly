import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  createTRPCRouter,
  publicProcedure,
  salonOwnerProcedure,
} from '../trpc.js';
import {
  createSalonSchema,
  updateSalonSchema,
  salonHoursSchema,
  salonSettingsSchema,
} from '@appointly/shared';

export const salonsRouter = createTRPCRouter({
  create: salonOwnerProcedure.input(createSalonSchema).mutation(async ({ input, ctx }) => {
    const existing = await ctx.db.salon.findUnique({ where: { slug: input.slug } });
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT', message: 'A salon with this slug already exists' });
    }

    const freePlan = await ctx.db.plan.findFirstOrThrow({ where: { name: 'FREE' } });

    const salon = await ctx.db.salon.create({
      data: {
        ...input,
        plan_id: freePlan.id,
        settings: { create: {} },
      },
    });

    // Add owner as member
    await ctx.db.salonMember.create({
      data: {
        user_id: ctx.user.id,
        salon_id: salon.id,
        role: 'OWNER',
      },
    });

    return salon;
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const salon = await ctx.db.salon.findUnique({
        where: { slug: input.slug, is_active: true },
        include: {
          settings: true,
          hours: { orderBy: { day_of_week: 'asc' } },
          plan: true,
        },
      });
      if (!salon) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Salon not found' });
      }
      return salon;
    }),

  update: salonOwnerProcedure
    .input(z.object({ salon_id: z.string().cuid(), data: updateSalonSchema }))
    .mutation(async ({ input, ctx }) => {
      await assertSalonMember(ctx, input.salon_id);
      return ctx.db.salon.update({
        where: { id: input.salon_id },
        data: input.data,
      });
    }),

  updateHours: salonOwnerProcedure
    .input(z.object({ salon_id: z.string().cuid(), hours: salonHoursSchema.shape.hours }))
    .mutation(async ({ input, ctx }) => {
      await assertSalonMember(ctx, input.salon_id);
      await ctx.db.salonHours.deleteMany({ where: { salon_id: input.salon_id } });
      await ctx.db.salonHours.createMany({
        data: input.hours.map((h) => ({ salon_id: input.salon_id, ...h })),
      });
      return { success: true };
    }),

  getSettings: salonOwnerProcedure
    .input(z.object({ salon_id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      await assertSalonMember(ctx, input.salon_id);
      return ctx.db.salonSettings.findUniqueOrThrow({ where: { salon_id: input.salon_id } });
    }),

  updateSettings: salonOwnerProcedure
    .input(z.object({ salon_id: z.string().cuid(), data: salonSettingsSchema.partial() }))
    .mutation(async ({ input, ctx }) => {
      await assertSalonMember(ctx, input.salon_id);
      return ctx.db.salonSettings.update({
        where: { salon_id: input.salon_id },
        data: input.data,
      });
    }),
});

async function assertSalonMember(
  ctx: { db: typeof import('@appointly/db').db; user: { id: string } },
  salon_id: string,
) {
  const member = await ctx.db.salonMember.findUnique({
    where: { user_id_salon_id: { user_id: ctx.user.id, salon_id } },
  });
  if (!member || !member.is_active) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a member of this salon' });
  }
}
