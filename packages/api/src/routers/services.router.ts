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
      return ctx.db.service.create({
        data: { salon_id: input.salon_id, ...input.data, price: input.data.price.toString() },
      });
    }),

  update: salonOwnerProcedure
    .input(z.object({ service_id: z.string().cuid(), data: updateServiceSchema }))
    .mutation(async ({ input, ctx }) => {
      const { price, ...rest } = input.data;
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
});
