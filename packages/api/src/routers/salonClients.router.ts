import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, salonOwnerProcedure } from '../trpc';

export const salonClientsRouter = createTRPCRouter({
  getByToken: publicProcedure
    .input(z.object({ client_token: z.string() }))
    .query(async ({ input, ctx }) => {
      const client = await ctx.db.salonClient.findUnique({
        where: { client_token: input.client_token, deleted_at: null },
        include: {
          appointments: {
            where: { status: { in: ['PENDING', 'CONFIRMED'] } },
            orderBy: { start_datetime: 'asc' },
            take: 5,
            include: { service: true, staff: true },
          },
        },
      });
      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
      }
      return client;
    }),

  list: salonOwnerProcedure
    .input(
      z.object({
        salon_id: z.string().cuid(),
        search: z.string().optional(),
        is_blocked: z.boolean().optional(),
        page: z.number().int().positive().default(1),
        per_page: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { salon_id, search, is_blocked, page, per_page } = input;
      const skip = (page - 1) * per_page;

      const where = {
        salon_id,
        deleted_at: null,
        ...(is_blocked !== undefined ? { is_blocked } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        ctx.db.salonClient.findMany({
          where,
          orderBy: { last_visit_at: 'desc' },
          skip,
          take: per_page,
        }),
        ctx.db.salonClient.count({ where }),
      ]);

      return { items, total, page, per_page };
    }),

  get: salonOwnerProcedure
    .input(z.object({ client_id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.salonClient.findUniqueOrThrow({
        where: { id: input.client_id, deleted_at: null },
        include: {
          appointments: {
            orderBy: { start_datetime: 'desc' },
            include: { service: true, staff: true },
          },
          reviews: true,
        },
      });
    }),

  addNote: salonOwnerProcedure
    .input(z.object({ client_id: z.string().cuid(), notes: z.string().max(2000) }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.salonClient.update({
        where: { id: input.client_id },
        data: { notes: input.notes },
      });
    }),

  block: salonOwnerProcedure
    .input(z.object({ client_id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.salonClient.update({
        where: { id: input.client_id },
        data: { is_blocked: true },
      });
    }),

  unblock: salonOwnerProcedure
    .input(z.object({ client_id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.salonClient.update({
        where: { id: input.client_id },
        data: { is_blocked: false },
      });
    }),
});
