import { z } from 'zod';
import { createTRPCRouter, salonOwnerProcedure } from '../trpc.js';

const periodSchema = z.object({
  salon_id: z.string().cuid(),
  from: z.string().datetime({ offset: true }),
  to: z.string().datetime({ offset: true }),
});

export const analyticsRouter = createTRPCRouter({
  overview: salonOwnerProcedure.input(periodSchema).query(async ({ input, ctx }) => {
    const { salon_id, from, to } = input;
    const dateFrom = new Date(from);
    const dateTo = new Date(to);

    const [totalAppointments, completedAppointments, cancelledAppointments, newClients] =
      await Promise.all([
        ctx.db.appointment.count({
          where: { salon_id, start_datetime: { gte: dateFrom, lte: dateTo } },
        }),
        ctx.db.appointment.count({
          where: { salon_id, status: 'COMPLETED', start_datetime: { gte: dateFrom, lte: dateTo } },
        }),
        ctx.db.appointment.count({
          where: { salon_id, status: 'CANCELLED', start_datetime: { gte: dateFrom, lte: dateTo } },
        }),
        ctx.db.salonClient.count({
          where: { salon_id, created_at: { gte: dateFrom, lte: dateTo } },
        }),
      ]);

    // Revenue from completed appointments
    const completedWithService = await ctx.db.appointment.findMany({
      where: { salon_id, status: 'COMPLETED', start_datetime: { gte: dateFrom, lte: dateTo } },
      include: { service: { select: { price: true } } },
    });
    const totalRevenue = completedWithService.reduce(
      (sum, a) => sum + Number(a.service.price),
      0,
    );

    return {
      total_appointments: totalAppointments,
      completed_appointments: completedAppointments,
      cancelled_appointments: cancelledAppointments,
      completion_rate:
        totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
      new_clients: newClients,
      total_revenue: totalRevenue,
    };
  }),

  retention: salonOwnerProcedure.input(periodSchema).query(async () => {
    // TODO: implement cohort retention analysis
    return { data: [] };
  }),

  topClients: salonOwnerProcedure
    .input(z.object({ salon_id: z.string().cuid(), limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ input, ctx }) => {
      return ctx.db.salonClient.findMany({
        where: { salon_id: input.salon_id, deleted_at: null },
        orderBy: { total_visits: 'desc' },
        take: input.limit,
        select: {
          id: true,
          name: true,
          phone: true,
          total_visits: true,
          last_visit_at: true,
        },
      });
    }),

  promoPerformance: salonOwnerProcedure
    .input(periodSchema)
    .query(async ({ input, ctx }) => {
      return ctx.db.promoCode.findMany({
        where: { salon_id: input.salon_id },
        include: {
          usages: {
            where: { used_at: { gte: new Date(input.from), lte: new Date(input.to) } },
            select: { discount_applied: true },
          },
          _count: { select: { usages: true } },
        },
      });
    }),
});
