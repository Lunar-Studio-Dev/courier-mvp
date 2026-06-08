import { invoiceService } from "../../services";
import {
  createInvoiceCategoryInputSchema,
  invoiceCategoryOutputSchema,
  listCategoriesOutputSchema,
  deleteCategoryInputSchema,
  createInvoiceTemplateInputSchema,
  updateInvoiceTemplateInputSchema,
  invoiceTemplateOutputSchema,
  listTemplatesInputSchema,
  getByIdInputSchema,
  deleteInputSchema,
  setDefaultInputSchema,
  generateInvoiceDataInputSchema,
  invoiceDataOutputSchema,
  exportShipmentsInputSchema,
  exportCsvOutputSchema,
  exportExcelOutputSchema,
} from "@repo/services/invoice/model";
import { adminProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { z } from "zod";

const TAGS = ["Invoices"];
const getPath = generatePath("/invoices");

export const invoiceRouter = router({
  // --- Categories ---
  listCategories: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/categories"), tags: TAGS } })
    .input(z.object({}))
    .output(listCategoriesOutputSchema)
    .query(() => invoiceService.listCategories()),

  createCategory: adminProcedure
    .meta({ openapi: { method: "POST", path: getPath("/categories"), tags: TAGS } })
    .input(createInvoiceCategoryInputSchema)
    .output(invoiceCategoryOutputSchema)
    .mutation(({ input }) => invoiceService.createCategory(input)),

  deleteCategory: adminProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/categories/:id"), tags: TAGS } })
    .input(deleteCategoryInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(({ input }) => invoiceService.deleteCategory(input.id)),

  // --- Templates ---
  listTemplates: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/templates"), tags: TAGS } })
    .input(listTemplatesInputSchema)
    .output(z.array(invoiceTemplateOutputSchema))
    .query(({ input }) => invoiceService.listTemplates(input.categoryId)),

  getTemplateById: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/templates/:id"), tags: TAGS } })
    .input(getByIdInputSchema)
    .output(invoiceTemplateOutputSchema)
    .query(({ input }) => invoiceService.getTemplateById(input.id)),

  createTemplate: adminProcedure
    .meta({ openapi: { method: "POST", path: getPath("/templates"), tags: TAGS } })
    .input(createInvoiceTemplateInputSchema)
    .output(invoiceTemplateOutputSchema)
    .mutation(({ input }) => invoiceService.createTemplate(input)),

  updateTemplate: adminProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/templates/:id"), tags: TAGS } })
    .input(updateInvoiceTemplateInputSchema)
    .output(invoiceTemplateOutputSchema)
    .mutation(({ input }) => invoiceService.updateTemplate(input)),

  deleteTemplate: adminProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/templates/:id"), tags: TAGS } })
    .input(deleteInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(({ input }) => invoiceService.deleteTemplate(input.id)),

  setDefault: adminProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/templates/:id/default"), tags: TAGS } })
    .input(setDefaultInputSchema)
    .output(invoiceTemplateOutputSchema)
    .mutation(({ input }) => invoiceService.setDefault(input.id)),

  // --- Generation & Export ---
  generateInvoiceData: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/generate/:shipmentId"), tags: TAGS } })
    .input(generateInvoiceDataInputSchema)
    .output(invoiceDataOutputSchema)
    .query(({ input }) =>
      invoiceService.generateInvoiceData(input.shipmentId, input.templateId),
    ),

  exportCsv: adminProcedure
    .meta({ openapi: { method: "POST", path: getPath("/export/csv"), tags: TAGS } })
    .input(exportShipmentsInputSchema)
    .output(exportCsvOutputSchema)
    .mutation(({ input }) => invoiceService.exportShipmentsCsv(input)),

  exportExcel: adminProcedure
    .meta({ openapi: { method: "POST", path: getPath("/export/excel"), tags: TAGS } })
    .input(exportShipmentsInputSchema)
    .output(exportExcelOutputSchema)
    .mutation(({ input }) => invoiceService.exportShipmentsExcel(input)),
});
