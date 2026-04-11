import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category_id: z.string().cuid().optional(),
  duration_mins: z.number().int().min(5).max(480),
  price: z.number().min(0),
  currency: z.string().length(3).default('ILS'),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export const updateServiceSchema = createServiceSchema.partial();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
