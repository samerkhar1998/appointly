import { z } from 'zod';

export const createSalonSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().max(500).optional(),
  phone: z.string().optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  timezone: z.string().default('Asia/Jerusalem'),
});

export const updateSalonSchema = createSalonSchema
  .partial()
  .omit({ slug: true })
  .extend({
    logo_url: z.string().url().optional().nullable(),
    cover_url: z.string().url().optional().nullable(),
  });

export const salonHoursSchema = z.object({
  hours: z.array(
    z.object({
      day_of_week: z.number().int().min(0).max(6),
      open_time: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm format'),
      close_time: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm format'),
      is_closed: z.boolean(),
    }),
  ),
});

export const salonSettingsSchema = z.object({
  confirmation_mode: z.enum(['MANUAL', 'AUTO']),
  cancellation_method: z.enum(['MAGIC_LINK', 'PHONE_OTP']),
  cancellation_window_hours: z.number().int().min(0).max(168),
  wa_phone_number: z.string().optional(),
  wa_confirmation_template: z.string().max(1000).optional(),
  wa_reminder_template: z.string().max(1000).optional(),
  wa_post_visit_template: z.string().max(1000).optional(),
  booking_slot_interval_mins: z.number().int().refine((v) => [10, 15, 20, 30].includes(v), {
    message: 'Slot interval must be 10, 15, 20, or 30 minutes',
  }),
  buffer_after_mins: z.number().int().min(0).max(120),
});

export type CreateSalonInput = z.infer<typeof createSalonSchema>;
export type SalonSettingsInput = z.infer<typeof salonSettingsSchema>;
