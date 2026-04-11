import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import * as jose from 'jose';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc.js';
import { loginSchema, registerSchema } from '@appointly/shared';
import { hashPassword, verifyPassword } from '../lib/password.js';

const JWT_SECRET = new TextEncoder().encode(
  process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production',
);

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Signs a JWT and returns the signed token string.
// payload: user identity fields to embed in the token
async function signToken(payload: {
  sub: string;
  email: string;
  role: string;
  salon_id?: string;
}): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

// Builds a Set-Cookie header string for the auth token.
// token: the signed JWT
function buildSetCookie(token: string): string {
  return `appointly_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
}

// Converts a salon name into a URL-safe slug.
// name: the raw salon name string
// Returns a lowercase, dash-separated slug.
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

export const authRouter = createTRPCRouter({
  // Authenticates a salon owner with email + password.
  // Sets an httpOnly JWT cookie on success.
  // Returns the authenticated user's basic info.
  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const user = await ctx.db.user.findUnique({ where: { email: input.email } });

    if (!user || !user.password_hash) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(input.password, user.password_hash);
    if (!isValid) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    if (!user.is_active) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Account is disabled' });
    }

    const member = await ctx.db.salonMember.findFirst({
      where: { user_id: user.id, is_active: true },
      orderBy: { created_at: 'asc' },
    });

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.global_role,
      salon_id: member?.salon_id,
    });

    ctx.res.setHeader('Set-Cookie', buildSetCookie(token));

    return { user: { id: user.id, email: user.email, name: user.name, role: user.global_role } };
  }),

  // Registers a new salon owner and creates their salon.
  // Creates: User, FREE-plan Salon, SalonMember (OWNER), SalonSettings (defaults).
  // Sets an httpOnly JWT cookie on success and returns the user's basic info.
  register: publicProcedure.input(registerSchema).mutation(async ({ input, ctx }) => {
    const existingUser = await ctx.db.user.findUnique({ where: { email: input.email } });
    if (existingUser) {
      throw new TRPCError({ code: 'CONFLICT', message: 'An account with this email already exists' });
    }

    const password_hash = await hashPassword(input.password);

    // Generate a unique slug from the salon name
    const baseSlug = slugify(input.salon_name);
    let slug = baseSlug;
    let suffix = 1;
    while (await ctx.db.salon.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    const freePlan = await ctx.db.plan.findFirst({ where: { name: 'FREE' } });
    if (!freePlan) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Platform not configured' });
    }

    // Atomically create user, salon, membership, and settings
    const { user, salon, member } = await ctx.db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          name: input.name,
          phone: input.phone,
          password_hash,
          global_role: 'SALON_OWNER',
        },
      });

      const salon = await tx.salon.create({
        data: {
          name: input.salon_name,
          slug,
          timezone: 'Asia/Jerusalem',
          plan_id: freePlan.id,
          settings: { create: {} },
        },
      });

      const member = await tx.salonMember.create({
        data: {
          user_id: user.id,
          salon_id: salon.id,
          role: 'OWNER',
          is_active: true,
        },
      });

      return { user, salon, member };
    });

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.global_role,
      salon_id: member.salon_id,
    });

    ctx.res.setHeader('Set-Cookie', buildSetCookie(token));

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.global_role },
      salon: { id: salon.id, name: salon.name, slug: salon.slug },
    };
  }),

  // Clears the auth cookie, logging the user out.
  logout: protectedProcedure.mutation(({ ctx }) => {
    ctx.res.setHeader(
      'Set-Cookie',
      'appointly_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0',
    );
    return { success: true };
  }),

  // Returns the currently authenticated user's profile and salon memberships.
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

  // Changes the authenticated user's password.
  // Verifies the current password before updating.
  changePassword: protectedProcedure
    .input(
      z.object({
        current_password: z.string().min(1),
        new_password: z.string().min(8),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.user.id },
        select: { id: true, password_hash: true },
      });

      if (!user.password_hash) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This account uses social login — no password to change',
        });
      }

      const isCurrentValid = await verifyPassword(input.current_password, user.password_hash);
      if (!isCurrentValid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Current password is incorrect' });
      }

      const new_hash = await hashPassword(input.new_password);
      await ctx.db.user.update({
        where: { id: user.id },
        data: { password_hash: new_hash },
      });

      return { success: true };
    }),
});
