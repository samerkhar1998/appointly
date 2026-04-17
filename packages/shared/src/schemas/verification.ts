import { z } from 'zod';

export const sendOTPSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be in E.164 format (e.g. +972501234567)'),
  // salon_id is optional — omit or pass undefined for customer-only login flows
  salon_id: z.string().cuid().optional(),
});

export const verifyOTPSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be in E.164 format'),
  code: z.string().length(6).regex(/^\d+$/, 'Code must be 6 digits'),
});

// Schema for issuing a pre-verified booking token to a customer whose phone is
// already on file in CustomerProfile (i.e. they have previously completed OTP).
// Used by the mobile booking flow to skip the OTP step for logged-in customers.
export const issueTokenForKnownCustomerSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be in E.164 format'),
});

// Schema for persisting the customer's name after their first OTP login.
// The verification_token proves the caller just completed a valid OTP challenge.
export const setCustomerNameSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be in E.164 format'),
  // Single-use token issued by verifyOTP — authorises this write.
  verification_token: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100),
});

export type SendOTPInput = z.infer<typeof sendOTPSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type SetCustomerNameInput = z.infer<typeof setCustomerNameSchema>;
export type IssueTokenForKnownCustomerInput = z.infer<typeof issueTokenForKnownCustomerSchema>;
