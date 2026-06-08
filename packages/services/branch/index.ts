import { db } from "@repo/database";
import { branchesTable, shipmentsTable } from "@repo/database/schema";
import { eq, ilike, and, or, count, SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type {
  CreateBranchInput,
  UpdateBranchInput,
  ListBranchesInput,
  ListBranchesOutput,
  BranchOutput,
} from "./model";

class BranchService {
  async list(input: ListBranchesInput): Promise<ListBranchesOutput> {
    const { search, type, isActive, page, limit } = input;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (search) {
      conditions.push(
        or(
          ilike(branchesTable.name, `%${search}%`),
          ilike(branchesTable.code, `%${search}%`),
          ilike(branchesTable.city, `%${search}%`),
        )!,
      );
    }
    if (type) {
      conditions.push(eq(branchesTable.type, type));
    }
    if (isActive !== undefined) {
      conditions.push(eq(branchesTable.isActive, isActive));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(branchesTable)
        .where(where)
        .orderBy(branchesTable.createdAt)
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(branchesTable).where(where),
    ]);

    return {
      data: data as BranchOutput[],
      total: totalResult[0]?.count ?? 0,
      page,
      limit,
    };
  }

  async getById(id: string): Promise<BranchOutput> {
    const [record] = await db
      .select()
      .from(branchesTable)
      .where(eq(branchesTable.id, id));

    if (!record) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Branch not found" });
    }

    return record as BranchOutput;
  }

  async create(input: CreateBranchInput): Promise<BranchOutput> {
    const [existing] = await db
      .select()
      .from(branchesTable)
      .where(ilike(branchesTable.code, input.code));

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A branch with this code already exists",
      });
    }

    const [created] = await db
      .insert(branchesTable)
      .values(input)
      .returning();

    return created as BranchOutput;
  }

  async update(input: UpdateBranchInput): Promise<BranchOutput> {
    const { id, ...data } = input;

    const [existing] = await db
      .select()
      .from(branchesTable)
      .where(eq(branchesTable.id, id));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Branch not found" });
    }

    if (data.code && data.code.toLowerCase() !== existing.code.toLowerCase()) {
      const [duplicate] = await db
        .select()
        .from(branchesTable)
        .where(ilike(branchesTable.code, data.code));

      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A branch with this code already exists",
        });
      }
    }

    const [updated] = await db
      .update(branchesTable)
      .set(data)
      .where(eq(branchesTable.id, id))
      .returning();

    return updated as BranchOutput;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const [existing] = await db
      .select()
      .from(branchesTable)
      .where(eq(branchesTable.id, id));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Branch not found" });
    }

    const [shipmentCount] = await db
      .select({ count: count() })
      .from(shipmentsTable)
      .where(eq(shipmentsTable.branchId, id));

    const refs = shipmentCount?.count ?? 0;

    if (refs > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Cannot delete: branch has ${refs} shipments`,
      });
    }

    await db.delete(branchesTable).where(eq(branchesTable.id, id));
    return { success: true };
  }
}

export default BranchService;
