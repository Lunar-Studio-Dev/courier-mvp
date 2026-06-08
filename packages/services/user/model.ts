import { z } from "zod";

export const getAuthenticationMethodOutputSchema = z.object({
  provider: z.enum(["GOOGLE_OAUTH"]),
  displayName: z.string().optional(),
  displayText: z.string().optional(),
  authUrl: z.string(),
});
export type GetAuthenticationMethodOutputSchema = z.infer<
  typeof getAuthenticationMethodOutputSchema
>;

export const signupInputSchema = z.object({
  fullName: z.string().min(1).max(80),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  role: z.enum(["admin", "customer"]).default("customer"),
});
export type SignupInput = z.infer<typeof signupInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

export const userOutputSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  role: z.enum(["admin", "customer"]),
  profileImageUrl: z.string().nullable(),
  createdAt: z.coerce.date().nullable(),
});
export type UserOutput = z.infer<typeof userOutputSchema>;
