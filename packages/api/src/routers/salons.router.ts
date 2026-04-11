import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  createTRPCRouter,
  publicProcedure,
  salonOwnerProcedure,
} from '../trpc';
import {
  createSalonSchema,
  updateSalonSchema,
  salonHoursSchema,
  salonSettingsSchema,
  salonSearchSchema,
  createInviteSchema,
} from '@appointly/shared';

export const salonsRouter = createTRPCRouter({
  create: salonOwnerProcedure.input(createSalonSchema).mutation(async ({ input, ctx }) => {
    const existing = await ctx.db.salon.findUnique({ where: { slug: input.slug } });
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT', message: 'A salon with this slug already exists' });
    }

    const freePlan = await ctx.db.plan.findFirstOrThrow({ where: { name: 'FREE' } });

    const salon = await ctx.db.salon.create({
      data: {
        ...input,
        plan_id: freePlan.id,
        settings: { create: {} },
      },
    });

    // Add owner as member
    await ctx.db.salonMember.create({
      data: {
        user_id: ctx.user.id,
        salon_id: salon.id,
        role: 'OWNER',
      },
    });

    return salon;
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const salon = await ctx.db.salon.findUnique({
        where: { slug: input.slug, is_active: true },
        include: {
          settings: true,
          hours: { orderBy: { day_of_week: 'asc' } },
          plan: true,
        },
      });
      if (!salon) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Salon not found' });
      }
      return salon;
    }),

  update: salonOwnerProcedure
    .input(z.object({ salon_id: z.string().cuid(), data: updateSalonSchema }))
    .mutation(async ({ input, ctx }) => {
      await assertSalonMember(ctx, input.salon_id);
      return ctx.db.salon.update({
        where: { id: input.salon_id },
        data: input.data,
      });
    }),

  updateHours: salonOwnerProcedure
    .input(z.object({ salon_id: z.string().cuid(), hours: salonHoursSchema.shape.hours }))
    .mutation(async ({ input, ctx }) => {
      await assertSalonMember(ctx, input.salon_id);
      await ctx.db.salonHours.deleteMany({ where: { salon_id: input.salon_id } });
      await ctx.db.salonHours.createMany({
        data: input.hours.map((h) => ({ salon_id: input.salon_id, ...h })),
      });
      return { success: true };
    }),

  getSettings: salonOwnerProcedure
    .input(z.object({ salon_id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      await assertSalonMember(ctx, input.salon_id);
      return ctx.db.salonSettings.findUniqueOrThrow({ where: { salon_id: input.salon_id } });
    }),

  updateSettings: salonOwnerProcedure
    .input(z.object({ salon_id: z.string().cuid(), data: salonSettingsSchema.partial() }))
    .mutation(async ({ input, ctx }) => {
      await assertSalonMember(ctx, input.salon_id);
      return ctx.db.salonSettings.update({
        where: { salon_id: input.salon_id },
        data: input.data,
      });
    }),

  // Searches all active public salons by name or city.
  // query: optional text search against salon name
  // city: optional city filter
  // Returns paginated salon results with logo and city.
  search: publicProcedure.input(salonSearchSchema).query(async ({ input, ctx }) => {
    const { query, city, page, per_page } = input;
    const skip = (page - 1) * per_page;

    const where = {
      is_active: true,
      is_public: true,
      ...(city ? { city: { contains: city, mode: 'insensitive' as const } } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' as const } },
              { city: { contains: query, mode: 'insensitive' as const } },
              { description: { contains: query, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      ctx.db.salon.findMany({
        where,
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          city: true,
          logo_url: true,
          cover_url: true,
        },
        orderBy: { name: 'asc' },
        skip,
        take: per_page,
      }),
      ctx.db.salon.count({ where }),
    ]);

    return { items, total, page, per_page };
  }),

  // Toggles the public/private visibility of a salon.
  // salon_id: the salon to update
  // is_public: true = discoverable in search, false = invite-only
  updateVisibility: salonOwnerProcedure
    .input(z.object({ salon_id: z.string().cuid(), is_public: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await assertSalonMember(ctx, input.salon_id);
      return ctx.db.salon.update({
        where: { id: input.salon_id },
        data: { is_public: input.is_public },
        select: { id: true, is_public: true },
      });
    }),

  // Creates a new invite token for a private salon.
  // salon_id: the salon to create the invite for
  // expires_at: optional expiry datetime ISO string
  // Returns the invite token (used to construct the invite URL).
  createInvite: salonOwnerProcedure
    .input(createInviteSchema)
    .mutation(async ({ input, ctx }) => {
      await assertSalonMember(ctx, input.salon_id);
      const invite = await ctx.db.salonInvite.create({
        data: {
          salon_id: input.salon_id,
          expires_at: input.expires_at ? new Date(input.expires_at) : null,
        },
      });
      return { token: invite.token };
    }),

  // Validates an invite token and returns the salon info for the invite landing page.
  // token: the invite token from the URL
  // Returns salon slug, name, description, city, and logo.
  getByInviteToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input, ctx }) => {
      const invite = await ctx.db.salonInvite.findUnique({
        where: { token: input.token },
        include: {
          salon: {
            select: {
              id: true,
              slug: true,
              name: true,
              description: true,
              city: true,
              logo_url: true,
              cover_url: true,
              is_active: true,
            },
          },
        },
      });

      if (!invite) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invite link not found or expired' });
      }

      if (invite.expires_at && invite.expires_at < new Date()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This invite link has expired' });
      }

      if (!invite.salon.is_active) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Salon not found' });
      }

      return { salon: invite.salon, token: invite.token };
    }),
});

async function assertSalonMember(
  ctx: { db: typeof import('@appointly/db').db; user: { id: string } },
  salon_id: string,
) {
  const member = await ctx.db.salonMember.findUnique({
    where: { user_id_salon_id: { user_id: ctx.user.id, salon_id } },
  });
  if (!member || !member.is_active) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a member of this salon' });
  }
}
