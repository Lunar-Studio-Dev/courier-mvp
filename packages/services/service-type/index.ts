import { db } from "@repo/database";
import {
  serviceTypesTable,
  pricingRulesTable,
  shipmentsTable,
} from "@repo/database/schema";
import { eq, ilike, and, count, SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type {
  CreateServiceTypeInput,
  UpdateServiceTypeInput,
  ListServiceTypesInput,
  ListServiceTypesOutput,
  ServiceTypeOutput,
} from "./model";

class ServiceTypeService {
  async list(input: ListServiceTypesInput): Promise<ListServiceTypesOutput> {
    const { search, isActive, page, limit } = input;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (search) {
      conditions.push(ilike(serviceTypesTable.name, `%${search}%`));
    }
    if (isActive !== undefined) {
      conditions.push(eq(serviceTypesTable.isActive, isActive));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(serviceTypesTable)
        .where(where)
        .orderBy(serviceTypesTable.createdAt)
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(serviceTypesTable).where(where),
    ]);

    return {
      data: data as ServiceTypeOutput[],
      total: totalResult[0]?.count ?? 0,
      page,
      limit,
    };
  }

  async getById(id: string): Promise<ServiceTypeOutput> {
    const [record] = await db
      .select()
      .from(serviceTypesTable)
      .where(eq(serviceTypesTable.id, id));

    if (!record) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Service type not found" });
    }

    return record as ServiceTypeOutput;
  }

  async create(input: CreateServiceTypeInput): Promise<ServiceTypeOutput> {
    const [existing] = await db
      .select()
      .from(serviceTypesTable)
      .where(ilike(serviceTypesTable.name, input.name));

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A service type with this name already exists",
      });
    }

    const [created] = await db
      .insert(serviceTypesTable)
      .values(input)
      .returning();

    return created as ServiceTypeOutput;
  }

  async update(input: UpdateServiceTypeInput): Promise<ServiceTypeOutput> {
    const { id, ...data } = input;

    const [existing] = await db
      .select()
      .from(serviceTypesTable)
      .where(eq(serviceTypesTable.id, id));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Service type not found" });
    }

    if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
      const [duplicate] = await db
        .select()
        .from(serviceTypesTable)
        .where(ilike(serviceTypesTable.name, data.name));

      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A service type with this name already exists",
        });
      }
    }

    const [updated] = await db
      .update(serviceTypesTable)
      .set(data)
      .where(eq(serviceTypesTable.id, id))
      .returning();

    return updated as ServiceTypeOutput;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const [existing] = await db
      .select()
      .from(serviceTypesTable)
      .where(eq(serviceTypesTable.id, id));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Service type not found" });
    }

    const [pricingCount] = await db
      .select({ count: count() })
      .from(pricingRulesTable)
      .where(eq(pricingRulesTable.serviceTypeId, id));

    const [shipmentCount] = await db
      .select({ count: count() })
      .from(shipmentsTable)
      .where(eq(shipmentsTable.serviceTypeId, id));

    const pricingRefs = pricingCount?.count ?? 0;
    const shipmentRefs = shipmentCount?.count ?? 0;

    if (pricingRefs > 0 || shipmentRefs > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Cannot delete: service type is referenced by ${pricingRefs} pricing rules and ${shipmentRefs} shipments`,
      });
    }

    await db.delete(serviceTypesTable).where(eq(serviceTypesTable.id, id));
    return { success: true };
  }
}

export default ServiceTypeService;
