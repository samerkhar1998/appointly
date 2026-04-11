import { createTRPCRouter } from './trpc.js';
import { authRouter } from './routers/auth.router.js';
import { salonsRouter } from './routers/salons.router.js';
import { staffRouter } from './routers/staff.router.js';
import { servicesRouter } from './routers/services.router.js';
import { verificationRouter } from './routers/verification.router.js';
import { availabilityRouter } from './routers/availability.router.js';
import { appointmentsRouter } from './routers/appointments.router.js';
import { salonClientsRouter } from './routers/salonClients.router.js';
import { ordersRouter } from './routers/orders.router.js';
import { productsRouter } from './routers/products.router.js';
import { promoCodesRouter } from './routers/promoCodes.router.js';
import { analyticsRouter } from './routers/analytics.router.js';

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
