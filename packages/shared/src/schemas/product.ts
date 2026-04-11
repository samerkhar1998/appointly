import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  category_name: z.string().max(100).optional(),
  price: z.number().min(0),
  currency: z.string().length(3).default('ILS'),
  stock_quantity: z.number().int().min(0).nullable().default(null),
  low_stock_alert_at: z.number().int().min(0).nullable().default(null),
  fulfillment: z.enum(['PICKUP', 'DELIVERY', 'BOTH']).default('PICKUP'),
  is_active: z.boolean().default(true),
  photos: z.array(z.string().url()).default([]),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
