import { db } from "@repo/database";
import { destinationsTable } from "@repo/database/schema";
import { eq, ilike, and, or, count, sql, SQL, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type {
  ListDestinationsInput,
  ListDestinationsOutput,
  UpdateDestinationInput,
  BulkUpdateByStateInput,
  DestinationOutput,
} from "./model";

class DestinationService {
  async list(input: ListDestinationsInput): Promise<ListDestinationsOutput> {
    const { state, city, pincode, isServiceable, page, limit } = input;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (state) {
      conditions.push(ilike(destinationsTable.state, state));
    }
    if (city) {
      conditions.push(ilike(destinationsTable.city, `%${city}%`));
    }
    if (pincode) {
      conditions.push(eq(destinationsTable.pincode, pincode));
    }
    if (isServiceable !== undefined) {
      conditions.push(eq(destinationsTable.isServiceable, isServiceable));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(destinationsTable)
        .where(where)
        .orderBy(asc(destinationsTable.state), asc(destinationsTable.city), asc(destinationsTable.pincode))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(destinationsTable).where(where),
    ]);

    return {
      data: data as DestinationOutput[],
      total: totalResult[0]?.count ?? 0,
      page,
      limit,
    };
  }

  async update(input: UpdateDestinationInput): Promise<DestinationOutput> {
    const [existing] = await db
      .select()
      .from(destinationsTable)
      .where(eq(destinationsTable.id, input.id));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Destination not found" });
    }

    const [updated] = await db
      .update(destinationsTable)
      .set({ isServiceable: input.isServiceable })
      .where(eq(destinationsTable.id, input.id))
      .returning();

    return updated as DestinationOutput;
  }

  async bulkUpdateByState(input: BulkUpdateByStateInput): Promise<{ updated: number }> {
    const result = await db
      .update(destinationsTable)
      .set({ isServiceable: input.isServiceable })
      .where(ilike(destinationsTable.state, input.state));

    return { updated: result.rowCount ?? 0 };
  }

  async getStates(): Promise<string[]> {
    const rows = await db
      .selectDistinct({ state: destinationsTable.state })
      .from(destinationsTable)
      .orderBy(asc(destinationsTable.state));

    return rows.map((r) => r.state);
  }

  async getCitiesByState(state: string): Promise<string[]> {
    const rows = await db
      .selectDistinct({ city: destinationsTable.city })
      .from(destinationsTable)
      .where(ilike(destinationsTable.state, state))
      .orderBy(asc(destinationsTable.city));

    return rows.map((r) => r.city);
  }

  async search(query: string): Promise<DestinationOutput[]> {
    const trimmed = query.trim();

    const baseConditions = eq(destinationsTable.isServiceable, true);
    let where: SQL | undefined = baseConditions;

    if (trimmed.length > 0) {
      where = and(
        baseConditions,
        or(
          ilike(destinationsTable.city, `%${trimmed}%`),
          ilike(destinationsTable.state, `%${trimmed}%`),
          ilike(destinationsTable.pincode, `%${trimmed}%`),
        ),
      );
    }

    const results = await db
      .select()
      .from(destinationsTable)
      .where(where)
      .orderBy(asc(destinationsTable.state), asc(destinationsTable.city))
      .limit(20);

    return results as DestinationOutput[];
  }

  async create(input: { state: string; city: string; pincode: string }): Promise<DestinationOutput> {
    const [existing] = await db
      .select()
      .from(destinationsTable)
      .where(eq(destinationsTable.pincode, input.pincode));

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Pincode ${input.pincode} already exists (${existing.city}, ${existing.state})`,
      });
    }

    const [created] = await db
      .insert(destinationsTable)
      .values({
        state: input.state,
        city: input.city,
        pincode: input.pincode,
        isServiceable: true,
      })
      .returning();

    return created as DestinationOutput;
  }

  async checkServiceability(pincode: string) {
    const [record] = await db
      .select()
      .from(destinationsTable)
      .where(eq(destinationsTable.pincode, pincode));

    if (!record) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Pincode ${pincode} not found in system`,
      });
    }

    return {
      pincode: record.pincode,
      isServiceable: record.isServiceable ?? false,
      city: record.city,
      state: record.state,
    };
  }
}

export default DestinationService;
