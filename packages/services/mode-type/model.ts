import { z } from "zod";

export const createModeTypeInputSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
});
export type CreateModeTypeInput = z.infer<typeof createModeTypeInputSchema>;

export const updateModeTypeInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateModeTypeInput = z.infer<typeof updateModeTypeInputSchema>;

export const listModeTypesInputSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type ListModeTypesInput = z.infer<typeof listModeTypesInputSchema>;

export const getByIdInputSchema = z.object({
  id: z.string().uuid(),
});

export const deleteInputSchema = z.object({
  id: z.string().uuid(),
});

export const modeTypeOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});
export type ModeTypeOutput = z.infer<typeof modeTypeOutputSchema>;

export const listModeTypesOutputSchema = z.object({
  data: z.array(modeTypeOutputSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type ListModeTypesOutput = z.infer<typeof listModeTypesOutputSchema>;
