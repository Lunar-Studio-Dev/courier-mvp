import { z } from "zod";

export const listDestinationsInputSchema = z.object({
  state: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  isServiceable: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});
export type ListDestinationsInput = z.infer<typeof listDestinationsInputSchema>;

export const updateDestinationInputSchema = z.object({
  id: z.string().uuid(),
  isServiceable: z.boolean(),
});
export type UpdateDestinationInput = z.infer<typeof updateDestinationInputSchema>;

export const bulkUpdateByStateInputSchema = z.object({
  state: z.string().min(1),
  isServiceable: z.boolean(),
});
export type BulkUpdateByStateInput = z.infer<typeof bulkUpdateByStateInputSchema>;

export const getCitiesByStateInputSchema = z.object({
  state: z.string().min(1),
});

export const checkServiceabilityInputSchema = z.object({
  pincode: z.string().length(6),
});

export const destinationOutputSchema = z.object({
  id: z.string(),
  state: z.string(),
  city: z.string(),
  pincode: z.string(),
  isServiceable: z.boolean().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});
export type DestinationOutput = z.infer<typeof destinationOutputSchema>;

export const listDestinationsOutputSchema = z.object({
  data: z.array(destinationOutputSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type ListDestinationsOutput = z.infer<typeof listDestinationsOutputSchema>;

export const statesListOutputSchema = z.array(z.string());
export const citiesListOutputSchema = z.array(z.string());

export const serviceabilityOutputSchema = z.object({
  pincode: z.string(),
  isServiceable: z.boolean(),
  city: z.string().nullable(),
  state: z.string().nullable(),
});

export const bulkUpdateOutputSchema = z.object({
  updated: z.number(),
});
