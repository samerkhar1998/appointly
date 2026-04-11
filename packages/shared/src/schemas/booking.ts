import { z } from 'zod';

export const createBookingSchema = z.object({
  customer_name: z.string().min(1).max(100),
  customer_phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be in E.164 format'),
  customer_email: z.string().email().optional(),
  service_id: z.string().cuid(),
  staff_id: z.string().cuid().nullable(),
  start_datetime: z.string().datetime({ offset: true }),
  verification_token: z.string().min(1),
  product_items: z
    .array(
      z.object({
        product_id: z.string().cuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .optional(),
  promo_code: z.string().max(50).optional(),
});

export const cancelByTokenSchema = z.object({
  token: z.string().min(1),
});

export const cancelByOTPSchema = z.object({
  appointment_id: z.string().cuid(),
  code: z.string().length(6).regex(/^\d+$/),
});

export const requestCancelOTPSchema = z.object({
  appointment_id: z.string().cuid(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelByTokenInput = z.infer<typeof cancelByTokenSchema>;
