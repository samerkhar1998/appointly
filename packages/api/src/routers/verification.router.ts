import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '../trpc.js';
import { sendOTPSchema, verifyOTPSchema } from '@appointly/shared';

// TODO: import crypto for actual OTP hashing

export const verificationRouter = createTRPCRouter({
  sendOTP: publicProcedure.input(sendOTPSchema).mutation(async ({ input, ctx }) => {
    // Verify salon exists
    await ctx.db.salon.findUniqueOrThrow({ where: { id: input.salon_id } });

    // Invalidate previous codes for this phone
    await ctx.db.phoneVerification.updateMany({
      where: { phone_number: input.phone, verified: false },
      data: { expires_at: new Date() }, // expire immediately
    });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // TODO: hash code with bcrypt/crypto before storing
    const code_hash = code; // STUB — replace with crypto.createHash

    await ctx.db.phoneVerification.create({
      data: {
        phone_number: input.phone,
        code_hash,
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // TODO: send via Twilio / WhatsApp
    console.log(`[DEV] OTP for ${input.phone}: ${code}`);

    return { success: true, expires_in_seconds: 600 };
  }),

  verifyOTP: publicProcedure.input(verifyOTPSchema).mutation(async ({ input, ctx }) => {
    const record = await ctx.db.phoneVerification.findFirst({
      where: {
        phone_number: input.phone,
        verified: false,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!record) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No active OTP found for this phone number',
      });
    }

    // Check attempt limit
    if (record.attempts >= 5) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many failed attempts. Please request a new code.',
      });
    }

    // TODO: compare against hashed code
    const isValid = record.code_hash === input.code; // STUB

    if (!isValid) {
      await ctx.db.phoneVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid code' });
    }

    // Generate verification token
    const { randomUUID } = await import('crypto');
    const verification_token = randomUUID();

    await ctx.db.phoneVerification.update({
      where: { id: record.id },
      data: { verified: true, verification_token },
    });

    return { verification_token };
  }),
});
