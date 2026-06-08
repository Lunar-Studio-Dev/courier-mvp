import { z } from "zod";

export const shipmentStatusEnum = z.enum([
  "BOOKED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "ON_HOLD",
]);
export type ShipmentStatus = z.infer<typeof shipmentStatusEnum>;

export const addressSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
});
export type Address = z.infer<typeof addressSchema>;

export const createShipmentInputSchema = z.object({
  branchId: z.string().uuid(),
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  senderAddress: addressSchema.optional(),
  receiverAddress: addressSchema.optional(),
  originDestinationId: z.string().uuid(),
  deliveryDestinationId: z.string().uuid(),
  productTypeId: z.string().uuid(),
  serviceTypeId: z.string().uuid(),
  modeTypeId: z.string().uuid(),
  weight: z.string().regex(/^\d+(\.\d{1,3})?$/),
  declaredValue: z.string().regex(/^\d+(\.\d{1,2})?$/),
  gstEnabled: z.boolean().default(true),
});
export type CreateShipmentInput = z.infer<typeof createShipmentInputSchema>;

export const updateShipmentStatusInputSchema = z.object({
  id: z.string().uuid(),
  status: shipmentStatusEnum,
  location: z.string().max(200).optional(),
  remarks: z.string().max(500).optional(),
});
export type UpdateShipmentStatusInput = z.infer<typeof updateShipmentStatusInputSchema>;

export const listShipmentsInputSchema = z.object({
  search: z.string().optional(),
  status: shipmentStatusEnum.optional(),
  branchId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type ListShipmentsInput = z.infer<typeof listShipmentsInputSchema>;

export const getByIdInputSchema = z.object({
  id: z.string().uuid(),
});

export const trackShipmentInputSchema = z.object({
  trackingNumber: z.string().min(1),
});

export const shipmentOutputSchema = z.object({
  id: z.string(),
  trackingNumber: z.string(),
  branchId: z.string(),
  senderId: z.string(),
  receiverId: z.string(),
  senderAddress: addressSchema,
  receiverAddress: addressSchema,
  productTypeId: z.string(),
  serviceTypeId: z.string(),
  modeTypeId: z.string(),
  weight: z.string(),
  declaredValue: z.string(),
  basePrice: z.string(),
  gstEnabled: z.boolean().nullable(),
  gstType: z.string().nullable(),
  gstRate: z.string().nullable(),
  gstAmount: z.string().nullable(),
  totalAmount: z.string(),
  status: z.string(),
  invoiceTemplateId: z.string().nullable(),
  bookedAt: z.date().nullable(),
  deliveredAt: z.date().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
  originDestinationId: z.string().nullable(),
  deliveryDestinationId: z.string().nullable(),
  originCity: z.string().nullable(),
  originState: z.string().nullable(),
  originPincode: z.string().nullable(),
  deliveryCity: z.string().nullable(),
  deliveryState: z.string().nullable(),
  deliveryPincode: z.string().nullable(),
  branchName: z.string(),
  productTypeName: z.string(),
  serviceTypeName: z.string(),
  modeTypeName: z.string(),
});
export type ShipmentOutput = z.infer<typeof shipmentOutputSchema>;

export const listShipmentsOutputSchema = z.object({
  data: z.array(shipmentOutputSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type ListShipmentsOutput = z.infer<typeof listShipmentsOutputSchema>;

export const trackingHistoryEntrySchema = z.object({
  status: z.string(),
  location: z.string().nullable(),
  remarks: z.string().nullable(),
  timestamp: z.date().nullable(),
});

export const trackingOutputSchema = z.object({
  trackingNumber: z.string(),
  status: z.string(),
  bookedAt: z.date().nullable(),
  deliveredAt: z.date().nullable(),
  senderCity: z.string(),
  senderState: z.string(),
  receiverCity: z.string(),
  receiverState: z.string(),
  history: z.array(trackingHistoryEntrySchema),
});
export type TrackingOutput = z.infer<typeof trackingOutputSchema>;
