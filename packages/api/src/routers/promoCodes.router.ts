import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, salonOwnerProcedure } from '../trpc.js';
import { createPromoCodeSchema, validatePromoSchema } from '@appointly/shared';

export const promoCodesRouter = createTRPCRouter({
  list: salonOwnerProcedure
    .input(z.object({ salon_id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.promoCode.findMany({
        where: { salon_id: input.salon_id },
        include: {
          free_service: { select: { id: true, name: true } },
          free_product: { select: { id: true, name: true } },
          salon_client: { select: { id: true, name: true } },
        },
        orderBy: { created_at: 'desc' },
      });
    }),

  create: salonOwnerProcedure
    .input(z.object({ salon_id: z.string().cuid(), data: createPromoCodeSchema }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.db.promoCode.findUnique({
        where: { salon_id_code: { salon_id: input.salon_id, code: input.data.code } },
      });
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Promo code already exists' });
      }
      const { value, valid_from, valid_until, ...rest } = input.data;
      return ctx.db.promoCode.create({
        data: {
          salon_id: input.salon_id,
          ...rest,
          value: value?.toString(),
          valid_from: valid_from ? new Date(valid_from) : null,
          valid_until: valid_until ? new Date(valid_until) : null,
        },
      });
    }),

  toggle: salonOwnerProcedure
    .input(z.object({ promo_id: z.string().cuid(), is_active: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.promoCode.update({
        where: { id: input.promo_id },
        data: { is_active: input.is_active },
      });
    }),

  validate: publicProcedure.input(validatePromoSchema).query(async ({ input, ctx }) => {
    const promo = await ctx.db.promoCode.findUnique({
      where: { salon_id_code: { salon_id: input.salon_id, code: input.code } },
    });

    if (!promo || !promo.is_active) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid or inactive promo code' });
    }

    const now = new Date();
    if (promo.valid_from && promo.valid_from > now) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Promo code is not yet valid' });
    }
    if (promo.valid_until && promo.valid_until < now) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Promo code has expired' });
    }
    if (promo.max_uses_total !== null && promo.times_used >= promo.max_uses_total) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Promo code usage limit reached' });
    }
    if (promo.min_spend !== null && input.order_total !== undefined && input.order_total < Number(promo.min_spend)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Minimum spend of ${promo.min_spend} required`,
      });
    }

    return { valid: true, promo };
  }),
});
