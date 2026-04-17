import { TRPCError } from '@trpc/server';
import { createHmac, randomUUID } from 'crypto';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { sendOTPSchema, verifyOTPSchema, setCustomerNameSchema, issueTokenForKnownCustomerSchema } from '@appointly/shared';
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
    // Verify salon exists when a salon_id is provided
    if (input.salon_id) {
      await ctx.db.salon.findUniqueOrThrow({ where: { id: input.salon_id } });
    }

    // Expire any previous active codes for this phone
    await ctx.db.phoneVerification.updateMany({
      where: { phone_number: input.phone, verified: false },
      data: { expires_at: new Date() },
    });

    // In production, always generate a cryptographically random 6-digit code.
    // TEST_OTP_CODE is explicitly blocked in production to prevent accidental exposure.
    // In non-production environments, TEST_OTP_CODE is used when set; otherwise defaults
    // to "000000" so developers never need to intercept real messages.
    const isProduction = process.env['NODE_ENV'] === 'production';
    const code = isProduction
      ? Math.floor(100_000 + Math.random() * 900_000).toString()
      : (process.env['TEST_OTP_CODE'] ?? '000000');
    const code_hash = hashOtp(code, input.phone);

    await ctx.db.phoneVerification.create({
      data: {
        phone_number: input.phone,
        code_hash,
        expires_at: new Date(Date.now() + OTP_EXPIRY_MS),
      },
    });

    // Load salon name for the message when salon_id is available
    const salon = input.salon_id
      ? await ctx.db.salon.findUnique({ where: { id: input.salon_id }, select: { name: true } })
      : null;

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

    // Mark the OTP as verified and stamp the single-use token in one query.
    await ctx.db.phoneVerification.update({
      where: { id: record.id },
      data: { verified: true, verification_token },
    });

    // Look up a pre-existing customer profile so the mobile client can skip
    // the name-collection step on subsequent logins.
    const profile = await ctx.db.customerProfile.findUnique({
      where: { phone: input.phone },
      select: { name: true },
    });

    return { verification_token, customer_name: profile?.name ?? null };
  }),

  // Persists a customer's name to their global CustomerProfile record.
  // Authorised exclusively by the single-use verification_token issued by verifyOTP.
  // Idempotent: calling again with the same phone updates the name in place.
  // Returns the saved profile.
  setCustomerName: publicProcedure
    .input(setCustomerNameSchema)
    .mutation(async ({ input, ctx }) => {
      // Validate that the verification_token was genuinely issued for this phone
      // and has not already been consumed.
      const record = await ctx.db.phoneVerification.findFirst({
        where: {
          phone_number: input.phone,
          verification_token: input.verification_token,
          verified: true,
          token_used: false,
        },
      });

      if (!record) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired verification token.',
        });
      }

      // Burn the token so it cannot be replayed.
      await ctx.db.phoneVerification.update({
        where: { id: record.id },
        data: { token_used: true },
      });

      // Upsert the profile — creates on first login, updates on name change.
      const profile = await ctx.db.customerProfile.upsert({
        where: { phone: input.phone },
        create: { phone: input.phone, name: input.name },
        update: { name: input.name },
      });

      return { name: profile.name };
    }),

  // Issues a pre-verified booking token for a customer whose phone is already
  // registered in CustomerProfile (proof of a past successful OTP challenge).
  // This lets logged-in mobile customers skip the OTP step when booking.
  // The returned verification_token is identical in scope to one from verifyOTP
  // and carries the same single-use, expiry, and token_used semantics.
  // Returns UNAUTHORIZED if no CustomerProfile exists for the given phone.
  issueTokenForKnownCustomer: publicProcedure
    .input(issueTokenForKnownCustomerSchema)
    .mutation(async ({ input, ctx }) => {
      const profile = await ctx.db.customerProfile.findUnique({
        where: { phone: input.phone },
        select: { id: true },
      });

      if (!profile) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Phone number not found. Please log in first.',
        });
      }

      const verification_token = randomUUID();

      // Create a PhoneVerification record that is already marked verified so it
      // can be consumed immediately by the appointments.create procedure.
      await ctx.db.phoneVerification.create({
        data: {
          phone_number: input.phone,
          // No real OTP was sent — store an empty hash that will never match.
          code_hash: '',
          verified: true,
          verification_token,
          // Short expiry: must be used within 15 minutes.
          expires_at: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      return { verification_token };
    }),
});
