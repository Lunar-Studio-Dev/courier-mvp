import { db } from "@repo/database";
import { customersTable, shipmentsTable } from "@repo/database/schema";
import { eq, ilike, and, or, count, notInArray, SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { idProofPatterns } from "./model";
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  ListCustomersInput,
  ListCustomersOutput,
  CustomerOutput,
} from "./model";

class CustomerService {
  async list(input: ListCustomersInput): Promise<ListCustomersOutput> {
    const { search, isActive, page, limit } = input;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (search) {
      conditions.push(
        or(
          ilike(customersTable.fullName, `%${search}%`),
          ilike(customersTable.phone, `%${search}%`),
          ilike(customersTable.email, `%${search}%`),
        )!,
      );
    }
    if (isActive !== undefined) {
      conditions.push(eq(customersTable.isActive, isActive));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(customersTable)
        .where(where)
        .orderBy(customersTable.createdAt)
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(customersTable).where(where),
    ]);

    return {
      data: data as CustomerOutput[],
      total: totalResult[0]?.count ?? 0,
      page,
      limit,
    };
  }

  async getById(id: string): Promise<CustomerOutput> {
    const [record] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, id));

    if (!record) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
    }

    return record as CustomerOutput;
  }

  async create(input: CreateCustomerInput): Promise<CustomerOutput> {
    const pattern = idProofPatterns[input.idProofType];
    if (pattern && !pattern.test(input.idProofNumber)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Invalid ${input.idProofType} number format`,
      });
    }

    const [existing] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.phone, input.phone));

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A customer with this phone number already exists",
      });
    }

    const [created] = await db
      .insert(customersTable)
      .values(input)
      .returning();

    return created as CustomerOutput;
  }

  async update(input: UpdateCustomerInput): Promise<CustomerOutput> {
    const { id, ...data } = input;

    const [existing] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, id));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
    }

    if (data.phone && data.phone !== existing.phone) {
      const [duplicate] = await db
        .select()
        .from(customersTable)
        .where(eq(customersTable.phone, data.phone));

      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A customer with this phone number already exists",
        });
      }
    }

    const [updated] = await db
      .update(customersTable)
      .set(data)
      .where(eq(customersTable.id, id))
      .returning();

    return updated as CustomerOutput;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const [existing] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, id));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
    }

    const completedStatuses = ["DELIVERED", "CANCELLED", "RETURNED"];
    const [activeShipments] = await db
      .select({ count: count() })
      .from(shipmentsTable)
      .where(
        and(
          or(
            eq(shipmentsTable.senderId, id),
            eq(shipmentsTable.receiverId, id),
          ),
          notInArray(shipmentsTable.status, completedStatuses),
        ),
      );

    if ((activeShipments?.count ?? 0) > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Cannot deactivate: customer has ${activeShipments?.count} active shipments`,
      });
    }

    await db
      .update(customersTable)
      .set({ isActive: false })
      .where(eq(customersTable.id, id));

    return { success: true };
  }

  async search(query: string) {
    const results = await db
      .select({
        id: customersTable.id,
        fullName: customersTable.fullName,
        phone: customersTable.phone,
      })
      .from(customersTable)
      .where(
        and(
          eq(customersTable.isActive, true),
          or(
            ilike(customersTable.fullName, `%${query}%`),
            ilike(customersTable.phone, `%${query}%`),
          ),
        ),
      )
      .limit(10);

    return results;
  }
}

export default CustomerService;
