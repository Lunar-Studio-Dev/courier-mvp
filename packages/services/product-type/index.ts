import { db } from "@repo/database";
import {
  productTypesTable,
  pricingRulesTable,
  shipmentsTable,
} from "@repo/database/schema";
import { eq, ilike, and, count, SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type {
  CreateProductTypeInput,
  UpdateProductTypeInput,
  ListProductTypesInput,
  ListProductTypesOutput,
  ProductTypeOutput,
} from "./model";

class ProductTypeService {
  async list(input: ListProductTypesInput): Promise<ListProductTypesOutput> {
    const { search, isActive, page, limit } = input;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (search) {
      conditions.push(ilike(productTypesTable.name, `%${search}%`));
    }
    if (isActive !== undefined) {
      conditions.push(eq(productTypesTable.isActive, isActive));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(productTypesTable)
        .where(where)
        .orderBy(productTypesTable.createdAt)
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(productTypesTable).where(where),
    ]);

    return {
      data: data as ProductTypeOutput[],
      total: totalResult[0]?.count ?? 0,
      page,
      limit,
    };
  }

  async getById(id: string): Promise<ProductTypeOutput> {
    const [record] = await db
      .select()
      .from(productTypesTable)
      .where(eq(productTypesTable.id, id));

    if (!record) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Product type not found" });
    }

    return record as ProductTypeOutput;
  }

  async create(input: CreateProductTypeInput): Promise<ProductTypeOutput> {
    const [existing] = await db
      .select()
      .from(productTypesTable)
      .where(ilike(productTypesTable.name, input.name));

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A product type with this name already exists",
      });
    }

    const [created] = await db
      .insert(productTypesTable)
      .values(input)
      .returning();

    return created as ProductTypeOutput;
  }

  async update(input: UpdateProductTypeInput): Promise<ProductTypeOutput> {
    const { id, ...data } = input;

    const [existing] = await db
      .select()
      .from(productTypesTable)
      .where(eq(productTypesTable.id, id));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Product type not found" });
    }

    if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
      const [duplicate] = await db
        .select()
        .from(productTypesTable)
        .where(ilike(productTypesTable.name, data.name));

      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A product type with this name already exists",
        });
      }
    }

    const [updated] = await db
      .update(productTypesTable)
      .set(data)
      .where(eq(productTypesTable.id, id))
      .returning();

    return updated as ProductTypeOutput;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const [existing] = await db
      .select()
      .from(productTypesTable)
      .where(eq(productTypesTable.id, id));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Product type not found" });
    }

    const [pricingCount] = await db
      .select({ count: count() })
      .from(pricingRulesTable)
      .where(eq(pricingRulesTable.productTypeId, id));

    const [shipmentCount] = await db
      .select({ count: count() })
      .from(shipmentsTable)
      .where(eq(shipmentsTable.productTypeId, id));

    const pricingRefs = pricingCount?.count ?? 0;
    const shipmentRefs = shipmentCount?.count ?? 0;

    if (pricingRefs > 0 || shipmentRefs > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Cannot delete: product type is referenced by ${pricingRefs} pricing rules and ${shipmentRefs} shipments`,
      });
    }

    await db.delete(productTypesTable).where(eq(productTypesTable.id, id));
    return { success: true };
  }
}

export default ProductTypeService;
