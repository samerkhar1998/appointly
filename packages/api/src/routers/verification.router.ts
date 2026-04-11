import { TRPCError } from '@trpc/server';
import { createHmac, randomUUID } from 'crypto';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { sendOTPSchema, verifyOTPSchema } from '@appointly/shared';
import { notificationService } from '../lib/notifications';

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

// Hashes an OTP code using HMAC-SHA256 with the phone number as context.
// Prevents plain-text OTP storage while remaining fast for short-lived codes.
// code: the 6-digit OTP
// phone: the recipient's phone number (used as additional context)
// Returns a hex digest string.
function hashOtp(code: string, phone: string): string {
  const secret = process.env['JWT_SECRET'] ?? 'dev-otp-secret';
  return createHmac('sha256', secret).update(`${phone}:${code}`).digest('hex');
}

export const verificationRouter = createTRPCRouter({
  // Sends an OTP to the given phone number for booking verification.
  // Invalidates any previous unexpired codes for the same phone first.
  // In production this triggers a Twilio WhatsApp/SMS message.
  // Returns success with the expiry window in seconds.
  sendOTP: publicProcedure.input(sendOTPSchema).mutation(async ({ input, ctx }) => {
    // Verify salon exists
    await ctx.db.salon.findUniqueOrThrow({ where: { id: input.salon_id } });

    // Expire any previous active codes for this phone
    await ctx.db.phoneVerification.updateMany({
      where: { phone_number: input.phone, verified: false },
      data: { expires_at: new Date() },
    });

    const code = Math.floor(100_000 + Math.random() * 900_000).toString();
    const code_hash = hashOtp(code, input.phone);

    await ctx.db.phoneVerification.create({
      data: {
        phone_number: input.phone,
        code_hash,
        expires_at: new Date(Date.now() + OTP_EXPIRY_MS),
      },
    });

    // Load salon name for the message
    const salon = await ctx.db.salon.findUnique({
      where: { id: input.salon_id },
      select: { name: true },
    });

    await notificationService.sendOtp({
      to: input.phone,
      code,
      salon_name: salon?.name ?? 'Appointly',
    });

    return { success: true, expires_in_seconds: OTP_EXPIRY_MS / 1000 };
  }),

  // Verifies an OTP code submitted by the user.
  // Enforces attempt limits and expiry.
  // On success, marks the record as verified and issues a single-use verification token.
  // Returns the verification_token to be included in the booking request.
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
        message: 'No active OTP found for this phone number. Please request a new code.',
      });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many failed attempts. Please request a new code.',
      });
    }

    const expectedHash = hashOtp(input.code, input.phone);
    const isValid = record.code_hash === expectedHash;

    if (!isValid) {
      await ctx.db.phoneVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid code. Please try again.' });
    }

    const verification_token = randomUUID();

    await ctx.db.phoneVerification.update({
      where: { id: record.id },
      data: { verified: true, verification_token },
    });

    return { verification_token };
  }),
});
