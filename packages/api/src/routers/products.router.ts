import { z } from 'zod';
import { createTRPCRouter, publicProcedure, salonOwnerProcedure } from '../trpc';
import { createProductSchema, updateProductSchema } from '@appointly/shared';

export const productsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ salon_id: z.string().cuid(), include_inactive: z.boolean().default(false) }))
    .query(async ({ input, ctx }) => {
      return ctx.db.product.findMany({
        where: {
          salon_id: input.salon_id,
          ...(input.include_inactive ? {} : { is_active: true }),
        },
        orderBy: [{ category_name: 'asc' }, { name: 'asc' }],
      });
    }),

  create: salonOwnerProcedure
    .input(z.object({ salon_id: z.string().cuid(), data: createProductSchema }))
    .mutation(async ({ input, ctx }) => {
      const { price, ...rest } = input.data;
      return ctx.db.product.create({
        data: { salon_id: input.salon_id, ...rest, price: price.toString() },
      });
    }),

  update: salonOwnerProcedure
    .input(z.object({ product_id: z.string().cuid(), data: updateProductSchema }))
    .mutation(async ({ input, ctx }) => {
      const { price, ...rest } = input.data;
      return ctx.db.product.update({
        where: { id: input.product_id },
        data: { ...rest, ...(price !== undefined ? { price: price.toString() } : {}) },
      });
    }),

  toggle: salonOwnerProcedure
    .input(z.object({ product_id: z.string().cuid(), is_active: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.product.update({
        where: { id: input.product_id },
        data: { is_active: input.is_active },
      });
    }),
});
