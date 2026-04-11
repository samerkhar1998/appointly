import { z } from 'zod';

export const sendOTPSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be in E.164 format (e.g. +972501234567)'),
  salon_id: z.string().cuid(),
});

export const verifyOTPSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be in E.164 format'),
  code: z.string().length(6).regex(/^\d+$/, 'Code must be 6 digits'),
});

export type SendOTPInput = z.infer<typeof sendOTPSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
