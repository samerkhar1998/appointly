import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import * as jose from 'jose';
import { createTRPCRouter, publicProcedure, superAdminProcedure } from '../trpc';
import { hashPassword, verifyPassword } from '../lib/password';

const JWT_SECRET = new TextEncoder().encode(
  process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production',
);

const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

async function signAdminToken(payload: { sub: string; email: string }): Promise<string> {
  return new jose.SignJWT({ ...payload, role: 'SUPER_ADMIN' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

function buildAdminSetCookie(token: string): string {
  return `admin_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${ADMIN_COOKIE_MAX_AGE}`;
}

export const adminRouter = createTRPCRouter({
  // ── Invite & Registration ──────────────────────────────────────────────────

  createInvite: superAdminProcedure.mutation(async ({ ctx }) => {
    const invite = await ctx.db.adminInvite.create({
      data: { created_by: ctx.user.id },
    });
    const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
    return {
      token: invite.token,
      url: `${baseUrl}/admin/register?token=${invite.token}`,
    };
  }),

  registerWithInvite: publicProcedure
    .input(
      z.object({
        token: z.string().uuid(),
        name: z.string().min(1).max(100),
        email: z.string().email(),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const invite = await ctx.db.adminInvite.findUnique({ where: { token: input.token } });
      if (!invite) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid invite token' });
      }
      if (invite.used_at) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This invite has already been used' });
      }

      const existing = await ctx.db.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'An account with this email already exists' });
      }

      const password_hash = await hashPassword(input.password);

      await ctx.db.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            email: input.email,
            name: input.name,
            password_hash,
            global_role: 'SUPER_ADMIN',
          },
        });
        await tx.adminInvite.update({
          where: { id: invite.id },
          data: { used_at: new Date() },
        });
      });

      return { success: true };
    }),

  // ── Authentication ─────────────────────────────────────────────────────────

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({ where: { email: input.email } });

      if (!user || !user.password_hash) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
      }

      if (user.global_role !== 'SUPER_ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not an admin account' });
      }

      const isValid = await verifyPassword(input.password, user.password_hash);
      if (!isValid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
      }

      if (!user.is_active) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Account is disabled' });
      }

      const token = await signAdminToken({ sub: user.id, email: user.email });
      ctx.res.setHeader('Set-Cookie', buildAdminSetCookie(token));

      return { user: { id: user.id, email: user.email, name: user.name }, token };
    }),

  // ── Dashboard Stats ────────────────────────────────────────────────────────

  getStats: superAdminProcedure.query(async ({ ctx }) => {
    const [
      totalSalons,
      activeSalons,
      suspendedSalons,
      totalOwners,
      totalCustomers,
      proSalons,
      openBugReports,
    ] = await ctx.db.$transaction([
      ctx.db.salon.count(),
      ctx.db.salon.count({ where: { is_active: true } }),
      ctx.db.salon.count({ where: { is_active: false } }),
      ctx.db.user.count({ where: { global_role: 'SALON_OWNER' } }),
      ctx.db.user.count({ where: { global_role: 'CUSTOMER' } }),
      ctx.db.salon.findMany({
        where: { is_active: true },
        select: { plan: { select: { price_monthly: true } } },
      }),
      ctx.db.bugReport.count({ where: { status: { not: 'RESOLVED' } } }),
    ]);

    const mrr = proSalons.reduce((sum, s) => sum + Number(s.plan.price_monthly), 0);

    return {
      total_salons: totalSalons,
      active_salons: activeSalons,
      suspended_salons: suspendedSalons,
      total_owners: totalOwners,
      total_customers: totalCustomers,
      mrr,
      open_bug_reports: openBugReports,
    };
  }),

  // ── Salons ─────────────────────────────────────────────────────────────────

  getSalons: superAdminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const skip = (input.page - 1) * input.limit;
      const where = input.search
        ? {
            OR: [
              { name: { contains: input.search, mode: 'insensitive' as const } },
              { slug: { contains: input.search, mode: 'insensitive' as const } },
              { city: { contains: input.search, mode: 'insensitive' as const } },
              {
                members: {
                  some: {
                    role: 'OWNER' as const,
                    user: {
                      OR: [
                        { name: { contains: input.search, mode: 'insensitive' as const } },
                        { email: { contains: input.search, mode: 'insensitive' as const } },
                      ],
                    },
                  },
                },
              },
            ],
          }
        : {};

      const [salons, total] = await ctx.db.$transaction([
        ctx.db.salon.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            is_active: true,
            created_at: true,
            plan: { select: { id: true, name: true, display_name: true } },
            members: {
              where: { role: 'OWNER' },
              select: { user: { select: { id: true, name: true, email: true } } },
              take: 1,
            },
          },
        }),
        ctx.db.salon.count({ where }),
      ]);

      const rows = salons.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        city: s.city,
        is_active: s.is_active,
        created_at: s.created_at,
        plan: s.plan,
        owner: s.members[0]?.user ?? null,
      }));

      return { rows, total, page: input.page, limit: input.limit };
    }),

  setSalonActive: superAdminProcedure
    .input(z.object({ salon_id: z.string().cuid(), is_active: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.salon.update({
        where: { id: input.salon_id },
        data: { is_active: input.is_active },
      });
      return { success: true };
    }),

  setSalonPlan: superAdminProcedure
    .input(z.object({ salon_id: z.string().cuid(), plan_id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const plan = await ctx.db.plan.findUnique({ where: { id: input.plan_id } });
      if (!plan) throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan not found' });
      await ctx.db.salon.update({
        where: { id: input.salon_id },
        data: { plan_id: input.plan_id },
      });
      return { success: true };
    }),

  getPlans: superAdminProcedure.query(async ({ ctx }) => {
    return ctx.db.plan.findMany({ where: { is_active: true }, orderBy: { price_monthly: 'asc' } });
  }),

  // ── Users ──────────────────────────────────────────────────────────────────

  getUsers: superAdminProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const users = await ctx.db.user.findMany({
        where: {
          OR: [
            { phone: { contains: input.query } },
            { email: { contains: input.query, mode: 'insensitive' } },
            { name: { contains: input.query, mode: 'insensitive' } },
          ],
        },
        take: 20,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          global_role: true,
          created_at: true,
          is_active: true,
          salon_members: {
            where: { role: 'OWNER', is_active: true },
            select: { salon: { select: { id: true, name: true, slug: true } } },
          },
        },
      });

      return users.map((u) => ({
        ...u,
        owned_salons: u.salon_members.map((m) => m.salon),
      }));
    }),

  getUserAppointments: superAdminProcedure
    .input(z.object({ phone: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      return ctx.db.appointment.findMany({
        where: { customer_phone: input.phone },
        orderBy: { start_datetime: 'desc' },
        select: {
          id: true,
          start_datetime: true,
          end_datetime: true,
          status: true,
          customer_name: true,
          customer_phone: true,
          salon: { select: { id: true, name: true, slug: true } },
          service: { select: { id: true, name: true } },
          staff: { select: { id: true, display_name: true } },
        },
      });
    }),

  // ── Bug Reports ────────────────────────────────────────────────────────────

  getBugReports: superAdminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED']).optional(),
        type: z.enum(['BUG', 'SUGGESTION', 'OTHER']).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const skip = (input.page - 1) * input.limit;
      const where = {
        ...(input.status ? { status: input.status } : {}),
        ...(input.type ? { type: input.type } : {}),
      };

      const [reports, total] = await ctx.db.$transaction([
        ctx.db.bugReport.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            type: true,
            title: true,
            status: true,
            created_at: true,
            page_url: true,
            submitted_by_name: true,
            submitted_by_phone: true,
            submitted_by_user: { select: { id: true, name: true, email: true } },
          },
        }),
        ctx.db.bugReport.count({ where }),
      ]);

      return { rows: reports, total, page: input.page, limit: input.limit };
    }),

  getBugReport: superAdminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const report = await ctx.db.bugReport.findUnique({
        where: { id: input.id },
        include: {
          submitted_by_user: { select: { id: true, name: true, email: true } },
          notes: {
            orderBy: { created_at: 'asc' },
            include: { admin: { select: { id: true, name: true, email: true } } },
          },
        },
      });
      if (!report) throw new TRPCError({ code: 'NOT_FOUND', message: 'Report not found' });
      return report;
    }),

  updateBugReportStatus: superAdminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED']),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.bugReport.update({
        where: { id: input.id },
        data: { status: input.status },
      });
      return { success: true };
    }),

  addBugReportNote: superAdminProcedure
    .input(z.object({ report_id: z.string().cuid(), body: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.bugReportNote.create({
        data: {
          report_id: input.report_id,
          body: input.body,
          admin_id: ctx.user.id,
        },
        include: { admin: { select: { id: true, name: true } } },
      });
    }),

  // ── Submit Bug Report (public) ─────────────────────────────────────────────

  submitBugReport: publicProcedure
    .input(
      z.object({
        type: z.enum(['BUG', 'SUGGESTION', 'OTHER']),
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(5000),
        page_url: z.string().url().optional(),
        device_info: z.string().max(500).optional(),
        user_id: z.string().optional(),
        phone: z.string().optional(),
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.bugReport.create({
        data: {
          type: input.type,
          title: input.title,
          description: input.description,
          page_url: input.page_url,
          device_info: input.device_info,
          submitted_by_user_id: input.user_id ?? null,
          submitted_by_phone: input.phone ?? null,
          submitted_by_name: input.name ?? null,
        },
      });
      return { success: true };
    }),
});
