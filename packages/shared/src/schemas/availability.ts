import { z } from 'zod';

export const getAvailabilitySchema = z.object({
  salon_id: z.string().cuid(),
  service_id: z.string().cuid(),
  staff_id: z.string().cuid().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
});

export type GetAvailabilityInput = z.infer<typeof getAvailabilitySchema>;
