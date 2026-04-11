export { PrismaClient } from './generated/client/index.js';
export type {
  Plan,
  User,
  Salon,
  SalonSettings,
  SalonHours,
  SalonMember,
  Staff,
  StaffSchedule,
  StaffBlockedTime,
  Category,
  Service,
  PhoneVerification,
  SalonClient,
  Appointment,
  Product,
  Order,
  OrderItem,
  PromoCode,
  PromoUsage,
  Review,
  GlobalRole,
  SalonRole,
  ConfirmationMode,
  CancellationMethod,
  AppointmentStatus,
  CancelledBy,
  Fulfillment,
  OrderStatus,
  PromoType,
  PromoAppliesTo,
  Prisma,
} from './generated/client/index.js';

import { PrismaClient } from './generated/client/index.js';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

// Singleton pattern — prevents multiple instances in development hot-reload
export const db =
  globalThis.__prisma ??
  (() => {
    const client = createPrismaClient();
    if (process.env['NODE_ENV'] !== 'production') {
      globalThis.__prisma = client;
    }
    return client;
  })();
