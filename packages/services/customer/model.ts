import { z } from "zod";

export const idProofTypeEnum = z.enum([
  "PAN",
  "AADHAAR",
  "VOTER_ID",
  "DRIVING_LICENSE",
  "PASSPORT",
]);

export const idProofPatterns: Record<string, RegExp> = {
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  AADHAAR: /^\d{12}$/,
  VOTER_ID: /^[A-Z]{3}[0-9]{7}$/,
  DRIVING_LICENSE: /^[A-Z]{2}[-\s]?\d{2}[-\s]?\d{4}[-\s]?\d{7}$/,
  PASSPORT: /^[A-Z]\d{7}$/,
};

export const createCustomerInputSchema = z.object({
  fullName: z.string().min(1).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
  email: z.string().email().max(255).optional(),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().regex(/^\d{6}$/),
  idProofType: idProofTypeEnum,
  idProofNumber: z.string().min(1).max(50),
  idProofImageUrl: z.string().optional(),
});
export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

export const updateCustomerInputSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number").optional(),
  email: z.string().email().max(255).optional(),
  address: z.string().min(1).max(500).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
  idProofType: idProofTypeEnum.optional(),
  idProofNumber: z.string().min(1).max(50).optional(),
  idProofImageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>;

export const listCustomersInputSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type ListCustomersInput = z.infer<typeof listCustomersInputSchema>;

export const searchCustomersInputSchema = z.object({
  query: z.string().min(1),
});

export const getByIdInputSchema = z.object({
  id: z.string().uuid(),
});

export const deleteInputSchema = z.object({
  id: z.string().uuid(),
});

export const customerOutputSchema = z.object({
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
  idProofImageUrl: z.string().nullable(),
  isActive: z.boolean().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});
export type CustomerOutput = z.infer<typeof customerOutputSchema>;

export const listCustomersOutputSchema = z.object({
  data: z.array(customerOutputSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type ListCustomersOutput = z.infer<typeof listCustomersOutputSchema>;

export const customerSearchResultSchema = z.array(
  z.object({
    id: z.string(),
    fullName: z.string(),
    phone: z.string(),
  }),
);
