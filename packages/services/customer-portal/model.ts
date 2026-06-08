import { z } from "zod";

export const myShipmentsInputSchema = z.object({
  role: z.enum(["sender", "receiver", "all"]).default("all"),
  status: z
    .enum([
      "BOOKED",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
      "ON_HOLD",
    ])
    .optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type MyShipmentsInput = z.infer<typeof myShipmentsInputSchema>;

export const myShipmentOutputSchema = z.object({
  id: z.string(),
  trackingNumber: z.string(),
  status: z.string(),
  bookedAt: z.date().nullable(),
  senderCity: z.string(),
  senderState: z.string(),
  receiverCity: z.string(),
  receiverState: z.string(),
  totalAmount: z.string(),
  isSender: z.boolean(),
});

export const myShipmentsOutputSchema = z.object({
  data: z.array(myShipmentOutputSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type MyShipmentsOutput = z.infer<typeof myShipmentsOutputSchema>;

export const shipmentDetailInputSchema = z.object({
  id: z.string().uuid(),
});

export const updateProfileInputSchema = z.object({
  email: z.string().email().max(255).optional(),
  address: z.string().min(1).max(500).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

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
  totalShipmentsSent: z.number(),
  totalShipmentsReceived: z.number(),
});
export type CustomerProfileOutput = z.infer<typeof customerProfileOutputSchema>;
