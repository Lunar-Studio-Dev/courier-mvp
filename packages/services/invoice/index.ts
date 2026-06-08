import { db } from "@repo/database";
import {
  invoiceCategoriesTable,
  invoiceTemplatesTable,
  shipmentsTable,
  branchesTable,
  productTypesTable,
  serviceTypesTable,
  modeTypesTable,
} from "@repo/database/schema";
import { eq, and, count, ilike, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type {
  CreateInvoiceCategoryInput,
  InvoiceCategoryOutput,
  CreateInvoiceTemplateInput,
  UpdateInvoiceTemplateInput,
  InvoiceTemplateOutput,
  InvoiceDataOutput,
  ExportShipmentsInput,
} from "./model";
import type { Address } from "../shipment/model";

const templateSelectWithJoin = {
  id: invoiceTemplatesTable.id,
  name: invoiceTemplatesTable.name,
  categoryId: invoiceTemplatesTable.categoryId,
  categoryName: invoiceCategoriesTable.name,
  width: invoiceTemplatesTable.width,
  height: invoiceTemplatesTable.height,
  showQR: invoiceTemplatesTable.showQR,
  qrPosition: invoiceTemplatesTable.qrPosition,
  layout: invoiceTemplatesTable.layout,
  colors: invoiceTemplatesTable.colors,
  typography: invoiceTemplatesTable.typography,
  visibleFields: invoiceTemplatesTable.visibleFields,
  headerConfig: invoiceTemplatesTable.headerConfig,
  footerConfig: invoiceTemplatesTable.footerConfig,
  isDefault: invoiceTemplatesTable.isDefault,
  createdAt: invoiceTemplatesTable.createdAt,
  updatedAt: invoiceTemplatesTable.updatedAt,
};

function templateBaseQuery() {
  return db
    .select(templateSelectWithJoin)
    .from(invoiceTemplatesTable)
    .innerJoin(
      invoiceCategoriesTable,
      eq(invoiceTemplatesTable.categoryId, invoiceCategoriesTable.id),
    );
}

class InvoiceService {
  // --- Categories ---

  async listCategories(): Promise<InvoiceCategoryOutput[]> {
    const rows = await db
      .select()
      .from(invoiceCategoriesTable)
      .orderBy(invoiceCategoriesTable.name);
    return rows as InvoiceCategoryOutput[];
  }

  async createCategory(
    input: CreateInvoiceCategoryInput,
  ): Promise<InvoiceCategoryOutput> {
    const [existing] = await db
      .select()
      .from(invoiceCategoriesTable)
      .where(ilike(invoiceCategoriesTable.name, input.name));

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A category with this name already exists",
      });
    }

    const [created] = await db
      .insert(invoiceCategoriesTable)
      .values(input)
      .returning();

    return created as InvoiceCategoryOutput;
  }

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    const [existing] = await db
      .select()
      .from(invoiceCategoriesTable)
      .where(eq(invoiceCategoriesTable.id, id));

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Category not found",
      });
    }

    const [templateCount] = await db
      .select({ count: count() })
      .from(invoiceTemplatesTable)
      .where(eq(invoiceTemplatesTable.categoryId, id));

    if ((templateCount?.count ?? 0) > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Cannot delete: category has ${templateCount?.count} templates`,
      });
    }

    await db
      .delete(invoiceCategoriesTable)
      .where(eq(invoiceCategoriesTable.id, id));

    return { success: true };
  }

  // --- Templates ---

  async listTemplates(categoryId?: string): Promise<InvoiceTemplateOutput[]> {
    const query = templateBaseQuery();
    const rows = categoryId
      ? await query.where(eq(invoiceTemplatesTable.categoryId, categoryId))
      : await query;

    return rows as unknown as InvoiceTemplateOutput[];
  }

  async getTemplateById(id: string): Promise<InvoiceTemplateOutput> {
    const [record] = await templateBaseQuery().where(
      eq(invoiceTemplatesTable.id, id),
    );

    if (!record) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }

    return record as unknown as InvoiceTemplateOutput;
  }

  async createTemplate(
    input: CreateInvoiceTemplateInput,
  ): Promise<InvoiceTemplateOutput> {
    const [category] = await db
      .select()
      .from(invoiceCategoriesTable)
      .where(eq(invoiceCategoriesTable.id, input.categoryId));

    if (!category) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Category not found",
      });
    }

    if (input.isDefault) {
      await db
        .update(invoiceTemplatesTable)
        .set({ isDefault: false })
        .where(eq(invoiceTemplatesTable.isDefault, true));
    }

    const [created] = await db
      .insert(invoiceTemplatesTable)
      .values({
        name: input.name,
        categoryId: input.categoryId,
        width: input.width,
        height: input.height,
        showQR: input.showQR,
        qrPosition: input.qrPosition,
        layout: input.layout,
        colors: input.colors,
        typography: input.typography,
        visibleFields: input.visibleFields,
        headerConfig: input.headerConfig,
        footerConfig: input.footerConfig,
        isDefault: input.isDefault,
      })
      .returning({ id: invoiceTemplatesTable.id });

    return this.getTemplateById(created!.id);
  }

  async updateTemplate(
    input: UpdateInvoiceTemplateInput,
  ): Promise<InvoiceTemplateOutput> {
    const { id, ...data } = input;

    const [existing] = await db
      .select({ id: invoiceTemplatesTable.id })
      .from(invoiceTemplatesTable)
      .where(eq(invoiceTemplatesTable.id, id));

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }

    if (data.categoryId) {
      const [category] = await db
        .select()
        .from(invoiceCategoriesTable)
        .where(eq(invoiceCategoriesTable.id, data.categoryId));

      if (!category) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Category not found",
        });
      }
    }

    if (data.isDefault) {
      await db
        .update(invoiceTemplatesTable)
        .set({ isDefault: false })
        .where(eq(invoiceTemplatesTable.isDefault, true));
    }

    await db
      .update(invoiceTemplatesTable)
      .set(data)
      .where(eq(invoiceTemplatesTable.id, id));

    return this.getTemplateById(id);
  }

  async deleteTemplate(id: string): Promise<{ success: boolean }> {
    const [existing] = await db
      .select({ id: invoiceTemplatesTable.id })
      .from(invoiceTemplatesTable)
      .where(eq(invoiceTemplatesTable.id, id));

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }

    await db
      .delete(invoiceTemplatesTable)
      .where(eq(invoiceTemplatesTable.id, id));

    return { success: true };
  }

  async setDefault(id: string): Promise<InvoiceTemplateOutput> {
    const [existing] = await db
      .select({ id: invoiceTemplatesTable.id })
      .from(invoiceTemplatesTable)
      .where(eq(invoiceTemplatesTable.id, id));

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }

    await db
      .update(invoiceTemplatesTable)
      .set({ isDefault: false })
      .where(eq(invoiceTemplatesTable.isDefault, true));

    await db
      .update(invoiceTemplatesTable)
      .set({ isDefault: true })
      .where(eq(invoiceTemplatesTable.id, id));

    return this.getTemplateById(id);
  }

  // --- Generation ---

  async generateInvoiceData(
    shipmentId: string,
    templateId?: string,
  ): Promise<InvoiceDataOutput> {
    let template: InvoiceTemplateOutput;

    if (templateId) {
      template = await this.getTemplateById(templateId);
    } else {
      const [defaultTemplate] = await templateBaseQuery().where(
        eq(invoiceTemplatesTable.isDefault, true),
      );
      if (!defaultTemplate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No invoice template configured",
        });
      }
      template = defaultTemplate as unknown as InvoiceTemplateOutput;
    }

    const [shipment] = await db
      .select({
        trackingNumber: shipmentsTable.trackingNumber,
        status: shipmentsTable.status,
        bookedAt: shipmentsTable.bookedAt,
        senderAddress: shipmentsTable.senderAddress,
        receiverAddress: shipmentsTable.receiverAddress,
        weight: shipmentsTable.weight,
        declaredValue: shipmentsTable.declaredValue,
        basePrice: shipmentsTable.basePrice,
        gstEnabled: shipmentsTable.gstEnabled,
        gstType: shipmentsTable.gstType,
        gstRate: shipmentsTable.gstRate,
        gstAmount: shipmentsTable.gstAmount,
        totalAmount: shipmentsTable.totalAmount,
        branchName: branchesTable.name,
        productTypeName: productTypesTable.name,
        serviceTypeName: serviceTypesTable.name,
        modeTypeName: modeTypesTable.name,
      })
      .from(shipmentsTable)
      .innerJoin(branchesTable, eq(shipmentsTable.branchId, branchesTable.id))
      .innerJoin(
        productTypesTable,
        eq(shipmentsTable.productTypeId, productTypesTable.id),
      )
      .innerJoin(
        serviceTypesTable,
        eq(shipmentsTable.serviceTypeId, serviceTypesTable.id),
      )
      .innerJoin(
        modeTypesTable,
        eq(shipmentsTable.modeTypeId, modeTypesTable.id),
      )
      .where(eq(shipmentsTable.id, shipmentId));

    if (!shipment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Shipment not found",
      });
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const qrContent = `${baseUrl}/track/${shipment.trackingNumber}`;

    return {
      template,
      shipment: {
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        bookedAt: shipment.bookedAt,
        senderAddress: shipment.senderAddress as Address,
        receiverAddress: shipment.receiverAddress as Address,
        productTypeName: shipment.productTypeName,
        serviceTypeName: shipment.serviceTypeName,
        modeTypeName: shipment.modeTypeName,
        weight: shipment.weight,
        declaredValue: shipment.declaredValue,
        basePrice: shipment.basePrice,
        gstEnabled: shipment.gstEnabled,
        gstType: shipment.gstType,
        gstRate: shipment.gstRate,
        gstAmount: shipment.gstAmount,
        totalAmount: shipment.totalAmount,
        branchName: shipment.branchName,
      },
      qrContent,
    };
  }

  // --- Export ---

  async exportShipmentsCsv(
    input: ExportShipmentsInput,
  ): Promise<{ csv: string; filename: string }> {
    const rows = await this.fetchShipmentsForExport(input.shipmentIds);

    const headers = [
      "Tracking#",
      "Sender",
      "Sender Phone",
      "Sender City",
      "Receiver",
      "Receiver Phone",
      "Receiver City",
      "Route",
      "Status",
      "Weight",
      "Base Price",
      "GST",
      "Total",
      "Booked At",
    ];

    const csvRows = rows.map((r) => {
      const sender = r.senderAddress as Address;
      const receiver = r.receiverAddress as Address;
      return [
        r.trackingNumber,
        sender.fullName,
        sender.phone,
        sender.city,
        receiver.fullName,
        receiver.phone,
        receiver.city,
        `${sender.city}-${receiver.city}`,
        r.status,
        r.weight,
        r.basePrice,
        r.gstAmount ?? "0.00",
        r.totalAmount,
        r.bookedAt ? new Date(r.bookedAt).toISOString() : "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csv = [headers.join(","), ...csvRows].join("\n");
    const filename = `shipments-export-${Date.now()}.csv`;

    return { csv, filename };
  }

  async exportShipmentsExcel(
    input: ExportShipmentsInput,
  ): Promise<{ base64: string; filename: string }> {
    const XLSX = await import("xlsx");
    const rows = await this.fetchShipmentsForExport(input.shipmentIds);

    const data = rows.map((r) => {
      const sender = r.senderAddress as Address;
      const receiver = r.receiverAddress as Address;
      return {
        "Tracking#": r.trackingNumber,
        Sender: sender.fullName,
        "Sender Phone": sender.phone,
        "Sender City": sender.city,
        Receiver: receiver.fullName,
        "Receiver Phone": receiver.phone,
        "Receiver City": receiver.city,
        Route: `${sender.city}-${receiver.city}`,
        Status: r.status,
        Weight: r.weight,
        "Base Price": r.basePrice,
        GST: r.gstAmount ?? "0.00",
        Total: r.totalAmount,
        "Booked At": r.bookedAt ? new Date(r.bookedAt).toISOString() : "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shipments");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const base64 = Buffer.from(buffer).toString("base64");
    const filename = `shipments-export-${Date.now()}.xlsx`;

    return { base64, filename };
  }

  private async fetchShipmentsForExport(shipmentIds: string[]) {
    return db
      .select({
        trackingNumber: shipmentsTable.trackingNumber,
        status: shipmentsTable.status,
        bookedAt: shipmentsTable.bookedAt,
        senderAddress: shipmentsTable.senderAddress,
        receiverAddress: shipmentsTable.receiverAddress,
        weight: shipmentsTable.weight,
        basePrice: shipmentsTable.basePrice,
        gstAmount: shipmentsTable.gstAmount,
        totalAmount: shipmentsTable.totalAmount,
      })
      .from(shipmentsTable)
      .where(inArray(shipmentsTable.id, shipmentIds));
  }
}

export default InvoiceService;
