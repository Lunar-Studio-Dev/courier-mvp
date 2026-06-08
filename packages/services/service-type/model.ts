import { z } from "zod";

export const createServiceTypeInputSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
});
export type CreateServiceTypeInput = z.infer<typeof createServiceTypeInputSchema>;

export const updateServiceTypeInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateServiceTypeInput = z.infer<typeof updateServiceTypeInputSchema>;

export const listServiceTypesInputSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type ListServiceTypesInput = z.infer<typeof listServiceTypesInputSchema>;

export const getByIdInputSchema = z.object({
  id: z.string().uuid(),
});

export const deleteInputSchema = z.object({
  id: z.string().uuid(),
});

export const serviceTypeOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});
export type ServiceTypeOutput = z.infer<typeof serviceTypeOutputSchema>;

export const listServiceTypesOutputSchema = z.object({
  data: z.array(serviceTypeOutputSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type ListServiceTypesOutput = z.infer<typeof listServiceTypesOutputSchema>;
