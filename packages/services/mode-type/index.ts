import { db } from "@repo/database";
import {
  modeTypesTable,
  pricingRulesTable,
  shipmentsTable,
} from "@repo/database/schema";
import { eq, ilike, and, count, SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type {
  CreateModeTypeInput,
  UpdateModeTypeInput,
  ListModeTypesInput,
  ListModeTypesOutput,
  ModeTypeOutput,
} from "./model";

class ModeTypeService {
  async list(input: ListModeTypesInput): Promise<ListModeTypesOutput> {
    const { search, isActive, page, limit } = input;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (search) {
      conditions.push(ilike(modeTypesTable.name, `%${search}%`));
    }
    if (isActive !== undefined) {
      conditions.push(eq(modeTypesTable.isActive, isActive));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(modeTypesTable)
        .where(where)
        .orderBy(modeTypesTable.createdAt)
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(modeTypesTable).where(where),
    ]);

    return {
      data: data as ModeTypeOutput[],
      total: totalResult[0]?.count ?? 0,
      page,
      limit,
    };
  }

  async getById(id: string): Promise<ModeTypeOutput> {
    const [record] = await db
      .select()
      .from(modeTypesTable)
      .where(eq(modeTypesTable.id, id));

    if (!record) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Mode type not found" });
    }

    return record as ModeTypeOutput;
  }

  async create(input: CreateModeTypeInput): Promise<ModeTypeOutput> {
    const [existing] = await db
      .select()
      .from(modeTypesTable)
      .where(ilike(modeTypesTable.name, input.name));

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A mode type with this name already exists",
      });
    }

    const [created] = await db
      .insert(modeTypesTable)
      .values(input)
      .returning();

    return created as ModeTypeOutput;
  }

  async update(input: UpdateModeTypeInput): Promise<ModeTypeOutput> {
    const { id, ...data } = input;

    const [existing] = await db
      .select()
      .from(modeTypesTable)
      .where(eq(modeTypesTable.id, id));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Mode type not found" });
    }

    if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
      const [duplicate] = await db
        .select()
        .from(modeTypesTable)
        .where(ilike(modeTypesTable.name, data.name));

      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A mode type with this name already exists",
        });
      }
    }

    const [updated] = await db
      .update(modeTypesTable)
      .set(data)
      .where(eq(modeTypesTable.id, id))
      .returning();

    return updated as ModeTypeOutput;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const [existing] = await db
      .select()
      .from(modeTypesTable)
      .where(eq(modeTypesTable.id, id));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Mode type not found" });
    }

    const [pricingCount] = await db
      .select({ count: count() })
      .from(pricingRulesTable)
      .where(eq(pricingRulesTable.modeTypeId, id));

    const [shipmentCount] = await db
      .select({ count: count() })
      .from(shipmentsTable)
      .where(eq(shipmentsTable.modeTypeId, id));

    const pricingRefs = pricingCount?.count ?? 0;
    const shipmentRefs = shipmentCount?.count ?? 0;

    if (pricingRefs > 0 || shipmentRefs > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Cannot delete: mode type is referenced by ${pricingRefs} pricing rules and ${shipmentRefs} shipments`,
      });
    }

    await db.delete(modeTypesTable).where(eq(modeTypesTable.id, id));
    return { success: true };
  }
}

export default ModeTypeService;
