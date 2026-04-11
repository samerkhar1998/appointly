import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, salonOwnerProcedure } from '../trpc.js';

const createOrderSchema = z.object({
  salon_id: z.string().cuid(),
  salon_client_id: z.string().cuid(),
  appointment_id: z.string().cuid().optional(),
  fulfillment_type: z.enum(['PICKUP', 'DELIVERY', 'BOTH']).default('PICKUP'),
  delivery_address: z.string().optional(),
  items: z.array(
    z.object({
      product_id: z.string().cuid(),
      quantity: z.number().int().positive(),
    }),
  ).min(1),
  promo_code: z.string().optional(),
});

export const ordersRouter = createTRPCRouter({
  create: publicProcedure.input(createOrderSchema).mutation(async ({ input, ctx }) => {
    // Load products to compute totals
    const products = await ctx.db.product.findMany({
      where: {
        id: { in: input.items.map((i) => i.product_id) },
        salon_id: input.salon_id,
        is_active: true,
      },
    });

    if (products.length !== input.items.length) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'One or more products not found' });
    }

    const subtotal = input.items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.product_id);
      return sum + Number(product?.price ?? 0) * item.quantity;
    }, 0);

    // TODO: apply promo code
    const discount_amount = 0;
    const grand_total = subtotal;
    const final_total = subtotal - discount_amount;

    const order = await ctx.db.order.create({
      data: {
        salon_id: input.salon_id,
        salon_client_id: input.salon_client_id,
        appointment_id: input.appointment_id,
        status: 'PENDING',
        fulfillment_type: input.fulfillment_type,
        delivery_address: input.delivery_address,
        subtotal: subtotal.toString(),
        service_total: '0',
        grand_total: grand_total.toString(),
        discount_amount: discount_amount.toString(),
        final_total: final_total.toString(),
        items: {
          create: input.items.map((item) => {
            const product = products.find((p) => p.id === item.product_id);
            return {
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: product?.price.toString() ?? '0',
            };
          }),
        },
      },
    });

    return order;
  }),

  list: salonOwnerProcedure
    .input(
      z.object({
        salon_id: z.string().cuid(),
        status: z.enum(['PENDING', 'CONFIRMED', 'READY', 'COMPLETED', 'CANCELLED']).optional(),
        page: z.number().int().positive().default(1),
        per_page: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input, ctx }) => {
      const skip = (input.page - 1) * input.per_page;
      const where = {
        salon_id: input.salon_id,
        ...(input.status ? { status: input.status } : {}),
      };
      const [items, total] = await Promise.all([
        ctx.db.order.findMany({
          where,
          include: {
            salon_client: { select: { id: true, name: true, phone: true } },
            items: { include: { product: { select: { id: true, name: true } } } },
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: input.per_page,
        }),
        ctx.db.order.count({ where }),
      ]);
      return { items, total, page: input.page, per_page: input.per_page };
    }),

  get: salonOwnerProcedure
    .input(z.object({ order_id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.order.findUniqueOrThrow({
        where: { id: input.order_id },
        include: {
          salon_client: true,
          items: { include: { product: true } },
          promo_code: true,
        },
      });
    }),

  updateStatus: salonOwnerProcedure
    .input(
      z.object({
        order_id: z.string().cuid(),
        status: z.enum(['CONFIRMED', 'READY', 'COMPLETED', 'CANCELLED']),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.order.update({
        where: { id: input.order_id },
        data: { status: input.status },
      });
    }),
});
