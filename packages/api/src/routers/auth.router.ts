import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import * as jose from 'jose';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc.js';
import { loginSchema } from '@appointly/shared';

const JWT_SECRET = new TextEncoder().encode(
  process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production',
);

export const authRouter = createTRPCRouter({
  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    // TODO: implement bcrypt compare
    const user = await ctx.db.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    // TODO: await bcrypt.compare(input.password, user.password_hash)
    // Stubbed for now
    const isValid = input.password === 'password123'; // REMOVE before production
    if (!isValid) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    const member = await ctx.db.salonMember.findFirst({
      where: { user_id: user.id, is_active: true },
      orderBy: { created_at: 'asc' },
    });

    const token = await new jose.SignJWT({
      sub: user.id,
      email: user.email,
      role: user.global_role,
      salon_id: member?.salon_id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Set httpOnly cookie
    ctx.res.setHeader(
      'Set-Cookie',
      `appointly_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
    );

    return { user: { id: user.id, email: user.email, name: user.name, role: user.global_role } };
  }),

  logout: protectedProcedure.mutation(({ ctx }) => {
    ctx.res.setHeader(
      'Set-Cookie',
      'appointly_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0',
    );
    return { success: true };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        global_role: true,
        created_at: true,
        salon_members: {
          where: { is_active: true },
          include: { salon: { select: { id: true, name: true, slug: true, timezone: true } } },
        },
      },
    });
    return user;
  }),

  changePassword: protectedProcedure
    .input(
      z.object({
        current_password: z.string().min(1),
        new_password: z.string().min(8),
      }),
    )
    .mutation(async () => {
      // TODO: implement bcrypt verify + hash + update
      throw new TRPCError({ code: 'NOT_IMPLEMENTED', message: 'TODO' });
    }),
});
