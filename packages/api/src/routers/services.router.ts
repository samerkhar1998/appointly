import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, salonOwnerProcedure } from '../trpc';
import { createServiceSchema, updateServiceSchema } from '@appointly/shared';

export const servicesRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ salon_id: z.string().cuid(), include_inactive: z.boolean().default(false) }))
    .query(async ({ input, ctx }) => {
      return ctx.db.service.findMany({
        where: {
          salon_id: input.salon_id,
          ...(input.include_inactive ? {} : { is_active: true }),
        },
        include: { category: true },
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      });
    }),

  create: salonOwnerProcedure
    .input(z.object({ salon_id: z.string().cuid(), data: createServiceSchema }))
    .mutation(async ({ input, ctx }) => {
      const duplicate = await ctx.db.service.findFirst({
        where: { salon_id: input.salon_id, name: input.data.name },
        select: { id: true },
      });
      if (duplicate) {
        throw new TRPCError({ code: 'CONFLICT', message: 'שירות עם שם זה כבר קיים' });
      }
      return ctx.db.service.create({
        data: { salon_id: input.salon_id, ...input.data, price: input.data.price.toString() },
      });
    }),

  update: salonOwnerProcedure
    .input(z.object({ service_id: z.string().cuid(), data: updateServiceSchema }))
    .mutation(async ({ input, ctx }) => {
      const { price, ...rest } = input.data;
      // If the name is changing, check for duplicates in the same salon
      if (rest.name !== undefined) {
        const service = await ctx.db.service.findUnique({
          where: { id: input.service_id },
          select: { salon_id: true },
        });
        if (service) {
          const duplicate = await ctx.db.service.findFirst({
            where: { salon_id: service.salon_id, name: rest.name, NOT: { id: input.service_id } },
            select: { id: true },
          });
          if (duplicate) {
            throw new TRPCError({ code: 'CONFLICT', message: 'שירות עם שם זה כבר קיים' });
          }
        }
      }
      return ctx.db.service.update({
        where: { id: input.service_id },
        data: { ...rest, ...(price !== undefined ? { price: price.toString() } : {}) },
      });
    }),

  toggle: salonOwnerProcedure
    .input(z.object({ service_id: z.string().cuid(), is_active: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.service.update({
        where: { id: input.service_id },
        data: { is_active: input.is_active },
      });
    }),

  delete: salonOwnerProcedure
    .input(z.object({ service_id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const apptCount = await ctx.db.appointment.count({
        where: { service_id: input.service_id },
      });
      if (apptCount > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `לא ניתן למחוק שירות שיש לו ${apptCount} תורים. השבת אותו במקום.`,
        });
      }
      return ctx.db.service.delete({ where: { id: input.service_id } });
    }),
});
