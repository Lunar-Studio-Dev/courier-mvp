import { z } from "zod";

export const requestOtpInputSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
});
export type RequestOtpInput = z.infer<typeof requestOtpInputSchema>;

export const verifyOtpInputSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(6),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpInputSchema>;

export const requestOtpOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const customerAuthOutputSchema = z.object({
  customerId: z.string(),
  user: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
    email: z.string(),
    role: z.enum(["admin", "customer"]),
    profileImageUrl: z.string().nullable(),
    createdAt: z.coerce.date().nullable(),
  }),
});
export type CustomerAuthOutput = z.infer<typeof customerAuthOutputSchema>;

export const customerProfileOutputSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  idProofType: z.string(),
  idProofNumber: z.string(),
  isActive: z.boolean().nullable(),
  createdAt: z.date().nullable(),
});
