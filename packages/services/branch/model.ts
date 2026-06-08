import { z } from "zod";

export const branchTypeEnum = z.enum([
  "Head Office",
  "Regional Office",
  "Franchise",
  "Collection Center",
  "Hub",
]);

export const createBranchInputSchema = z.object({
  code: z.string().min(1).max(20).transform((v) => v.toUpperCase()),
  name: z.string().min(1).max(100),
  type: branchTypeEnum,
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  address: z.string().max(500).optional(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Pincode must be 6 digits")
    .optional(),
  latitude: z.string().max(20).optional(),
  longitude: z.string().max(20).optional(),
  contactPhone: z.string().max(15).optional(),
  contactEmail: z.string().email().max(255).optional(),
});
export type CreateBranchInput = z.infer<typeof createBranchInputSchema>;

export const updateBranchInputSchema = z.object({
  id: z.string().uuid(),
  code: z
    .string()
    .min(1)
    .max(20)
    .transform((v) => v.toUpperCase())
    .optional(),
  name: z.string().min(1).max(100).optional(),
  type: branchTypeEnum.optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  address: z.string().max(500).optional(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Pincode must be 6 digits")
    .optional(),
  latitude: z.string().max(20).optional(),
  longitude: z.string().max(20).optional(),
  contactPhone: z.string().max(15).optional(),
  contactEmail: z.string().email().max(255).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateBranchInput = z.infer<typeof updateBranchInputSchema>;

export const listBranchesInputSchema = z.object({
  search: z.string().optional(),
  type: branchTypeEnum.optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type ListBranchesInput = z.infer<typeof listBranchesInputSchema>;

export const getByIdInputSchema = z.object({
  id: z.string().uuid(),
});

export const deleteInputSchema = z.object({
  id: z.string().uuid(),
});

export const branchOutputSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  type: z.string(),
  city: z.string(),
  state: z.string(),
  address: z.string().nullable(),
  pincode: z.string().nullable(),
  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
  contactPhone: z.string().nullable(),
  contactEmail: z.string().nullable(),
  isActive: z.boolean().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});
export type BranchOutput = z.infer<typeof branchOutputSchema>;

export const listBranchesOutputSchema = z.object({
  data: z.array(branchOutputSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type ListBranchesOutput = z.infer<typeof listBranchesOutputSchema>;
