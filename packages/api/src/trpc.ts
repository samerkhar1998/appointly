import { initTRPC, TRPCError } from '@trpc/server';
import type { Prisma } from '@appointly/db';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Strip Prisma-internal details in production
        prismaCode:
          process.env['NODE_ENV'] === 'development' && isPrismaError(error.cause)
            ? error.cause.code
            : undefined,
      },
    };
  },
});

function isPrismaError(err: unknown): err is Prisma.PrismaClientKnownRequestError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as Record<string, unknown>)['code'] === 'string'
  );
}

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // narrowed — non-null
    },
  });
});

export const salonOwnerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (
    ctx.user.global_role !== 'SALON_OWNER' &&
    ctx.user.global_role !== 'PLATFORM_ADMIN'
  ) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only salon owners can perform this action',
    });
  }
  return next({ ctx });
});

export const platformAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.global_role !== 'PLATFORM_ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only platform admins can perform this action',
    });
  }
  return next({ ctx });
});
