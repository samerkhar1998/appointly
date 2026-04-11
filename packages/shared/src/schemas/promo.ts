import { z } from 'zod';

export const createPromoCodeSchema = z
  .object({
    code: z
      .string()
      .min(2)
      .max(50)
      .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase letters, numbers, hyphens, or underscores'),
    type: z.enum(['PERCENTAGE', 'FIXED', 'FREE_SERVICE', 'FREE_PRODUCT']),
    value: z.number().min(0).optional(),
    free_service_id: z.string().cuid().optional(),
    free_product_id: z.string().cuid().optional(),
    applies_to: z.enum(['BOOKINGS', 'PRODUCTS', 'BOTH']).default('BOTH'),
    min_spend: z.number().min(0).optional(),
    valid_from: z.string().datetime({ offset: true }).optional(),
    valid_until: z.string().datetime({ offset: true }).optional(),
    max_uses_total: z.number().int().positive().optional(),
    max_uses_per_client: z.number().int().positive().optional(),
    first_time_only: z.boolean().default(false),
    salon_client_id: z.string().cuid().optional(),
    is_active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'PERCENTAGE' && (data.value === undefined || data.value > 100)) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'Percentage must be between 0 and 100',
      });
    }
    if (data.type === 'FREE_SERVICE' && !data.free_service_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['free_service_id'],
        message: 'free_service_id is required for FREE_SERVICE promos',
      });
    }
    if (data.type === 'FREE_PRODUCT' && !data.free_product_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['free_product_id'],
        message: 'free_product_id is required for FREE_PRODUCT promos',
      });
    }
  });

export const validatePromoSchema = z.object({
  code: z.string().min(1),
  salon_id: z.string().cuid(),
  salon_client_id: z.string().cuid().optional(),
  order_total: z.number().min(0).optional(),
  appointment_id: z.string().cuid().optional(),
});

export type CreatePromoCodeInput = z.infer<typeof createPromoCodeSchema>;
