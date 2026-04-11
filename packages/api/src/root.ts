import { createTRPCRouter } from './trpc';
import { authRouter } from './routers/auth.router';
import { salonsRouter } from './routers/salons.router';
import { staffRouter } from './routers/staff.router';
import { servicesRouter } from './routers/services.router';
import { verificationRouter } from './routers/verification.router';
import { availabilityRouter } from './routers/availability.router';
import { appointmentsRouter } from './routers/appointments.router';
import { salonClientsRouter } from './routers/salonClients.router';
import { ordersRouter } from './routers/orders.router';
import { productsRouter } from './routers/products.router';
import { promoCodesRouter } from './routers/promoCodes.router';
import { analyticsRouter } from './routers/analytics.router';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  salons: salonsRouter,
  staff: staffRouter,
  services: servicesRouter,
  verification: verificationRouter,
  availability: availabilityRouter,
  appointments: appointmentsRouter,
  salonClients: salonClientsRouter,
  orders: ordersRouter,
  products: productsRouter,
  promoCodes: promoCodesRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
