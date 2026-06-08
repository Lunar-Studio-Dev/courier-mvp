import { z } from "zod";

export const createPricingRuleInputSchema = z.object({
  originState: z.string().min(1).max(100),
  originCity: z.string().max(100).optional(),
  destinationState: z.string().min(1).max(100),
  destinationCity: z.string().max(100).optional(),
  productTypeId: z.string().uuid(),
  serviceTypeId: z.string().uuid(),
  modeTypeId: z.string().uuid(),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
  minimumCharge: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});
export type CreatePricingRuleInput = z.infer<typeof createPricingRuleInputSchema>;

export const updatePricingRuleInputSchema = z.object({
  id: z.string().uuid(),
  originState: z.string().min(1).max(100).optional(),
  originCity: z.string().max(100).optional(),
  destinationState: z.string().min(1).max(100).optional(),
  destinationCity: z.string().max(100).optional(),
  productTypeId: z.string().uuid().optional(),
  serviceTypeId: z.string().uuid().optional(),
  modeTypeId: z.string().uuid().optional(),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  minimumCharge: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  isActive: z.boolean().optional(),
});
export type UpdatePricingRuleInput = z.infer<typeof updatePricingRuleInputSchema>;

export const listPricingRulesInputSchema = z.object({
  originState: z.string().optional(),
  destinationState: z.string().optional(),
  productTypeId: z.string().uuid().optional(),
  serviceTypeId: z.string().uuid().optional(),
  modeTypeId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type ListPricingRulesInput = z.infer<typeof listPricingRulesInputSchema>;

export const getByIdInputSchema = z.object({
  id: z.string().uuid(),
});

export const deleteInputSchema = z.object({
  id: z.string().uuid(),
});

export const calculatePriceInputSchema = z.object({
  originState: z.string().min(1),
  originCity: z.string().optional(),
  destinationState: z.string().min(1),
  destinationCity: z.string().optional(),
  productTypeId: z.string().uuid(),
  serviceTypeId: z.string().uuid(),
  modeTypeId: z.string().uuid(),
  weight: z.string().regex(/^\d+(\.\d{1,3})?$/),
});
export type CalculatePriceInput = z.infer<typeof calculatePriceInputSchema>;

export const pricingRuleOutputSchema = z.object({
  id: z.string(),
  originState: z.string(),
  originCity: z.string().nullable(),
  destinationState: z.string(),
  destinationCity: z.string().nullable(),
  productTypeId: z.string(),
  serviceTypeId: z.string(),
  modeTypeId: z.string(),
  unitPrice: z.string(),
  minimumCharge: z.string().nullable(),
  isActive: z.boolean().nullable(),
  productTypeName: z.string(),
  serviceTypeName: z.string(),
  modeTypeName: z.string(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});
export type PricingRuleOutput = z.infer<typeof pricingRuleOutputSchema>;

export const listPricingRulesOutputSchema = z.object({
  data: z.array(pricingRuleOutputSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type ListPricingRulesOutput = z.infer<typeof listPricingRulesOutputSchema>;

export const calculatePriceOutputSchema = z.object({
  ruleId: z.string(),
  unitPrice: z.string(),
  weight: z.string(),
  basePrice: z.string(),
  minimumCharge: z.string(),
});
export type CalculatePriceOutput = z.infer<typeof calculatePriceOutputSchema>;
