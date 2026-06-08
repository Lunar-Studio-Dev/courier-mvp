import { z } from "zod";

export const createProductTypeInputSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
});
export type CreateProductTypeInput = z.infer<typeof createProductTypeInputSchema>;

export const updateProductTypeInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateProductTypeInput = z.infer<typeof updateProductTypeInputSchema>;

export const listProductTypesInputSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type ListProductTypesInput = z.infer<typeof listProductTypesInputSchema>;

export const getByIdInputSchema = z.object({
  id: z.string().uuid(),
});

export const deleteInputSchema = z.object({
  id: z.string().uuid(),
});

export const productTypeOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});
export type ProductTypeOutput = z.infer<typeof productTypeOutputSchema>;

export const listProductTypesOutputSchema = z.object({
  data: z.array(productTypeOutputSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type ListProductTypesOutput = z.infer<typeof listProductTypesOutputSchema>;
