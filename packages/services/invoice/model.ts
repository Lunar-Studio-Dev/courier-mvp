import { z } from "zod";
import { addressSchema } from "../shipment/model";

// --- Invoice Categories ---

export const createInvoiceCategoryInputSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
});
export type CreateInvoiceCategoryInput = z.infer<typeof createInvoiceCategoryInputSchema>;

export const invoiceCategoryOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date().nullable(),
});
export type InvoiceCategoryOutput = z.infer<typeof invoiceCategoryOutputSchema>;

export const listCategoriesOutputSchema = z.array(invoiceCategoryOutputSchema);

export const deleteCategoryInputSchema = z.object({ id: z.string().uuid() });

// --- JSONB Sub-Schemas ---

export const colorsSchema = z.object({
  primary: z.string().default("#000000"),
  secondary: z.string().default("#666666"),
  background: z.string().default("#ffffff"),
  text: z.string().default("#000000"),
  border: z.string().default("#e5e7eb"),
});
export type Colors = z.infer<typeof colorsSchema>;

export const typographySchema = z.object({
  headingFont: z.string().default("Helvetica"),
  headingSize: z.number().int().min(8).max(36).default(16),
  baseFont: z.string().default("Helvetica"),
  baseSize: z.number().int().min(6).max(24).default(10),
});
export type Typography = z.infer<typeof typographySchema>;

export const visibleFieldsSchema = z.object({
  trackingNumber: z.boolean().default(true),
  senderName: z.boolean().default(true),
  senderAddress: z.boolean().default(true),
  senderPhone: z.boolean().default(true),
  receiverName: z.boolean().default(true),
  receiverAddress: z.boolean().default(true),
  receiverPhone: z.boolean().default(true),
  productType: z.boolean().default(true),
  serviceType: z.boolean().default(true),
  modeType: z.boolean().default(true),
  weight: z.boolean().default(true),
  declaredValue: z.boolean().default(true),
  basePrice: z.boolean().default(true),
  gstBreakdown: z.boolean().default(true),
  totalAmount: z.boolean().default(true),
  bookedDate: z.boolean().default(true),
});
export type VisibleFields = z.infer<typeof visibleFieldsSchema>;

export const headerConfigSchema = z.object({
  companyName: z.string().default("TPC India"),
  address: z.string().default(""),
  logoUrl: z.string().optional(),
});
export type HeaderConfig = z.infer<typeof headerConfigSchema>;

export const footerConfigSchema = z.object({
  termsText: z.string().default(""),
  disclaimerText: z.string().default(""),
});
export type FooterConfig = z.infer<typeof footerConfigSchema>;

export const layoutSchema = z.object({
  orientation: z.enum(["portrait", "landscape"]).default("portrait"),
  padding: z.number().int().min(0).max(50).default(20),
});
export type Layout = z.infer<typeof layoutSchema>;

// --- Invoice Templates ---

export const createInvoiceTemplateInputSchema = z.object({
  name: z.string().min(1).max(100),
  categoryId: z.string().uuid(),
  width: z.number().int().min(50).max(500),
  height: z.number().int().min(50).max(500),
  showQR: z.boolean().default(true),
  qrPosition: z.enum(["top-left", "top-right", "bottom-left", "bottom-right"]).default("bottom-right"),
  layout: layoutSchema,
  colors: colorsSchema,
  typography: typographySchema,
  visibleFields: visibleFieldsSchema,
  headerConfig: headerConfigSchema.optional(),
  footerConfig: footerConfigSchema.optional(),
  isDefault: z.boolean().default(false),
});
export type CreateInvoiceTemplateInput = z.infer<typeof createInvoiceTemplateInputSchema>;

export const updateInvoiceTemplateInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  categoryId: z.string().uuid().optional(),
  width: z.number().int().min(50).max(500).optional(),
  height: z.number().int().min(50).max(500).optional(),
  showQR: z.boolean().optional(),
  qrPosition: z.enum(["top-left", "top-right", "bottom-left", "bottom-right"]).optional(),
  layout: layoutSchema.optional(),
  colors: colorsSchema.optional(),
  typography: typographySchema.optional(),
  visibleFields: visibleFieldsSchema.optional(),
  headerConfig: headerConfigSchema.optional(),
  footerConfig: footerConfigSchema.optional(),
  isDefault: z.boolean().optional(),
});
export type UpdateInvoiceTemplateInput = z.infer<typeof updateInvoiceTemplateInputSchema>;

export const invoiceTemplateOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  width: z.number(),
  height: z.number(),
  showQR: z.boolean().nullable(),
  qrPosition: z.string().nullable(),
  layout: layoutSchema,
  colors: colorsSchema,
  typography: typographySchema,
  visibleFields: visibleFieldsSchema,
  headerConfig: headerConfigSchema.nullable(),
  footerConfig: footerConfigSchema.nullable(),
  isDefault: z.boolean().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});
export type InvoiceTemplateOutput = z.infer<typeof invoiceTemplateOutputSchema>;

export const listTemplatesInputSchema = z.object({
  categoryId: z.string().uuid().optional(),
});

export const getByIdInputSchema = z.object({ id: z.string().uuid() });
export const deleteInputSchema = z.object({ id: z.string().uuid() });
export const setDefaultInputSchema = z.object({ id: z.string().uuid() });

// --- Invoice Data Generation ---

export const generateInvoiceDataInputSchema = z.object({
  shipmentId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
});
export type GenerateInvoiceDataInput = z.infer<typeof generateInvoiceDataInputSchema>;

export const invoiceShipmentSchema = z.object({
  trackingNumber: z.string(),
  status: z.string(),
  bookedAt: z.date().nullable(),
  senderAddress: addressSchema,
  receiverAddress: addressSchema,
  productTypeName: z.string(),
  serviceTypeName: z.string(),
  modeTypeName: z.string(),
  weight: z.string(),
  declaredValue: z.string(),
  basePrice: z.string(),
  gstEnabled: z.boolean().nullable(),
  gstType: z.string().nullable(),
  gstRate: z.string().nullable(),
  gstAmount: z.string().nullable(),
  totalAmount: z.string(),
  branchName: z.string(),
});

export const invoiceDataOutputSchema = z.object({
  template: invoiceTemplateOutputSchema,
  shipment: invoiceShipmentSchema,
  qrContent: z.string(),
});
export type InvoiceDataOutput = z.infer<typeof invoiceDataOutputSchema>;

// --- Export ---

export const exportShipmentsInputSchema = z.object({
  shipmentIds: z.array(z.string().uuid()).min(1).max(500),
});
export type ExportShipmentsInput = z.infer<typeof exportShipmentsInputSchema>;

export const exportCsvOutputSchema = z.object({
  csv: z.string(),
  filename: z.string(),
});

export const exportExcelOutputSchema = z.object({
  base64: z.string(),
  filename: z.string(),
});
