import { z } from 'zod';

export const createStaffSchema = z.object({
  user_id: z.string().cuid(),
  display_name: z.string().min(1).max(100),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional(),
  is_bookable: z.boolean().default(true),
  role: z.enum(['OWNER', 'MANAGER', 'STAFF']).default('STAFF'),
});

export const updateStaffSchema = createStaffSchema.partial().omit({ user_id: true });

export const staffScheduleSchema = z.object({
  staff_id: z.string().cuid(),
  schedule: z.array(
    z.object({
      day_of_week: z.number().int().min(0).max(6),
      start_time: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm format'),
      end_time: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm format'),
      is_working: z.boolean(),
    }),
  ),
});

export const addBlockedTimeSchema = z.object({
  staff_id: z.string().cuid(),
  start_datetime: z.string().datetime({ offset: true }),
  end_datetime: z.string().datetime({ offset: true }),
  reason: z.string().max(200).optional(),
});

export type StaffScheduleInput = z.infer<typeof staffScheduleSchema>;
export type AddBlockedTimeInput = z.infer<typeof addBlockedTimeSchema>;
