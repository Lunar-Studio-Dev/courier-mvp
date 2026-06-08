import { db } from "@repo/database";
import {
  pricingRulesTable,
  productTypesTable,
  serviceTypesTable,
  modeTypesTable,
  shipmentsTable,
} from "@repo/database/schema";
import { eq, and, count, SQL, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type {
  CreatePricingRuleInput,
  UpdatePricingRuleInput,
  ListPricingRulesInput,
  ListPricingRulesOutput,
  PricingRuleOutput,
  CalculatePriceInput,
  CalculatePriceOutput,
} from "./model";

const selectWithJoins = {
  id: pricingRulesTable.id,
  originState: pricingRulesTable.originState,
  originCity: pricingRulesTable.originCity,
  destinationState: pricingRulesTable.destinationState,
  destinationCity: pricingRulesTable.destinationCity,
  productTypeId: pricingRulesTable.productTypeId,
  serviceTypeId: pricingRulesTable.serviceTypeId,
  modeTypeId: pricingRulesTable.modeTypeId,
  unitPrice: pricingRulesTable.unitPrice,
  minimumCharge: pricingRulesTable.minimumCharge,
  isActive: pricingRulesTable.isActive,
  productTypeName: productTypesTable.name,
  serviceTypeName: serviceTypesTable.name,
  modeTypeName: modeTypesTable.name,
  createdAt: pricingRulesTable.createdAt,
  updatedAt: pricingRulesTable.updatedAt,
};

function baseQuery() {
  return db
    .select(selectWithJoins)
    .from(pricingRulesTable)
    .innerJoin(productTypesTable, eq(pricingRulesTable.productTypeId, productTypesTable.id))
    .innerJoin(serviceTypesTable, eq(pricingRulesTable.serviceTypeId, serviceTypesTable.id))
    .innerJoin(modeTypesTable, eq(pricingRulesTable.modeTypeId, modeTypesTable.id));
}

class PricingRuleService {
  async list(input: ListPricingRulesInput): Promise<ListPricingRulesOutput> {
    const { originState, destinationState, productTypeId, serviceTypeId, modeTypeId, isActive, page, limit } = input;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (originState) conditions.push(eq(pricingRulesTable.originState, originState));
    if (destinationState) conditions.push(eq(pricingRulesTable.destinationState, destinationState));
    if (productTypeId) conditions.push(eq(pricingRulesTable.productTypeId, productTypeId));
    if (serviceTypeId) conditions.push(eq(pricingRulesTable.serviceTypeId, serviceTypeId));
    if (modeTypeId) conditions.push(eq(pricingRulesTable.modeTypeId, modeTypeId));
    if (isActive !== undefined) conditions.push(eq(pricingRulesTable.isActive, isActive));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      baseQuery()
        .where(where)
        .orderBy(pricingRulesTable.originState, pricingRulesTable.destinationState)
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(pricingRulesTable).where(where),
    ]);

    return {
      data: data as PricingRuleOutput[],
      total: totalResult[0]?.count ?? 0,
      page,
      limit,
    };
  }

  async getById(id: string): Promise<PricingRuleOutput> {
    const [record] = await baseQuery().where(eq(pricingRulesTable.id, id));
    if (!record) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Pricing rule not found" });
    }
    return record as PricingRuleOutput;
  }

  async create(input: CreatePricingRuleInput): Promise<PricingRuleOutput> {
    await this.checkDuplicate(input);

    const [created] = await db
      .insert(pricingRulesTable)
      .values({
        originState: input.originState,
        originCity: input.originCity || null,
        destinationState: input.destinationState,
        destinationCity: input.destinationCity || null,
        productTypeId: input.productTypeId,
        serviceTypeId: input.serviceTypeId,
        modeTypeId: input.modeTypeId,
        unitPrice: input.unitPrice,
        minimumCharge: input.minimumCharge || "0",
      })
      .returning({ id: pricingRulesTable.id });

    return this.getById(created!.id);
  }

  async update(input: UpdatePricingRuleInput): Promise<PricingRuleOutput> {
    const { id, ...data } = input;

    const existing = await this.getById(id);

    if (data.originState || data.destinationState || data.productTypeId || data.serviceTypeId || data.modeTypeId) {
      await this.checkDuplicate(
        {
          originState: data.originState ?? existing.originState,
          originCity: data.originCity !== undefined ? data.originCity : (existing.originCity ?? undefined),
          destinationState: data.destinationState ?? existing.destinationState,
          destinationCity: data.destinationCity !== undefined ? data.destinationCity : (existing.destinationCity ?? undefined),
          productTypeId: data.productTypeId ?? existing.productTypeId,
          serviceTypeId: data.serviceTypeId ?? existing.serviceTypeId,
          modeTypeId: data.modeTypeId ?? existing.modeTypeId,
        },
        id,
      );
    }

    const updateData: Record<string, unknown> = {};
    if (data.originState !== undefined) updateData.originState = data.originState;
    if (data.originCity !== undefined) updateData.originCity = data.originCity || null;
    if (data.destinationState !== undefined) updateData.destinationState = data.destinationState;
    if (data.destinationCity !== undefined) updateData.destinationCity = data.destinationCity || null;
    if (data.productTypeId !== undefined) updateData.productTypeId = data.productTypeId;
    if (data.serviceTypeId !== undefined) updateData.serviceTypeId = data.serviceTypeId;
    if (data.modeTypeId !== undefined) updateData.modeTypeId = data.modeTypeId;
    if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice;
    if (data.minimumCharge !== undefined) updateData.minimumCharge = data.minimumCharge;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await db.update(pricingRulesTable).set(updateData).where(eq(pricingRulesTable.id, id));
    return this.getById(id);
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await this.getById(id);

    const [shipmentCount] = await db
      .select({ count: count() })
      .from(shipmentsTable)
      .where(eq(shipmentsTable.productTypeId, id));

    if ((shipmentCount?.count ?? 0) > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Cannot delete: pricing rule is referenced by shipments",
      });
    }

    await db.delete(pricingRulesTable).where(eq(pricingRulesTable.id, id));
    return { success: true };
  }

  async calculatePrice(input: CalculatePriceInput): Promise<CalculatePriceOutput> {
    const { originState, originCity, destinationState, destinationCity, productTypeId, serviceTypeId, modeTypeId, weight } = input;

    const baseConditions = [
      eq(pricingRulesTable.productTypeId, productTypeId),
      eq(pricingRulesTable.serviceTypeId, serviceTypeId),
      eq(pricingRulesTable.modeTypeId, modeTypeId),
      eq(pricingRulesTable.isActive, true),
    ];

    // Priority 1: exact city-to-city
    let rule: { id: string; unitPrice: string; minimumCharge: string | null } | undefined;

    if (originCity && destinationCity) {
      const [r] = await db
        .select({ id: pricingRulesTable.id, unitPrice: pricingRulesTable.unitPrice, minimumCharge: pricingRulesTable.minimumCharge })
        .from(pricingRulesTable)
        .where(and(
          ...baseConditions,
          eq(pricingRulesTable.originState, originState),
          eq(pricingRulesTable.originCity, originCity),
          eq(pricingRulesTable.destinationState, destinationState),
          eq(pricingRulesTable.destinationCity, destinationCity),
        ))
        .limit(1);
      rule = r;
    }

    // Priority 2: city-to-state
    if (!rule && originCity) {
      const [r] = await db
        .select({ id: pricingRulesTable.id, unitPrice: pricingRulesTable.unitPrice, minimumCharge: pricingRulesTable.minimumCharge })
        .from(pricingRulesTable)
        .where(and(
          ...baseConditions,
          eq(pricingRulesTable.originState, originState),
          eq(pricingRulesTable.originCity, originCity),
          eq(pricingRulesTable.destinationState, destinationState),
          isNull(pricingRulesTable.destinationCity),
        ))
        .limit(1);
      rule = r;
    }

    // Priority 3: state-to-city
    if (!rule && destinationCity) {
      const [r] = await db
        .select({ id: pricingRulesTable.id, unitPrice: pricingRulesTable.unitPrice, minimumCharge: pricingRulesTable.minimumCharge })
        .from(pricingRulesTable)
        .where(and(
          ...baseConditions,
          eq(pricingRulesTable.originState, originState),
          isNull(pricingRulesTable.originCity),
          eq(pricingRulesTable.destinationState, destinationState),
          eq(pricingRulesTable.destinationCity, destinationCity),
        ))
        .limit(1);
      rule = r;
    }

    // Priority 4: state-to-state
    if (!rule) {
      const [r] = await db
        .select({ id: pricingRulesTable.id, unitPrice: pricingRulesTable.unitPrice, minimumCharge: pricingRulesTable.minimumCharge })
        .from(pricingRulesTable)
        .where(and(
          ...baseConditions,
          eq(pricingRulesTable.originState, originState),
          isNull(pricingRulesTable.originCity),
          eq(pricingRulesTable.destinationState, destinationState),
          isNull(pricingRulesTable.destinationCity),
        ))
        .limit(1);
      rule = r;
    }

    if (!rule) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No pricing rule found for this route and configuration" });
    }

    const unitPriceNum = parseFloat(rule.unitPrice);
    const weightNum = parseFloat(weight);
    const minChargeNum = parseFloat(rule.minimumCharge || "0");
    const calculated = unitPriceNum * weightNum;
    const basePrice = Math.max(calculated, minChargeNum);

    return {
      ruleId: rule.id,
      unitPrice: rule.unitPrice,
      weight,
      basePrice: basePrice.toFixed(2),
      minimumCharge: rule.minimumCharge || "0",
    };
  }

  private async checkDuplicate(
    input: { originState: string; originCity?: string; destinationState: string; destinationCity?: string; productTypeId: string; serviceTypeId: string; modeTypeId: string },
    excludeId?: string,
  ) {
    const conditions: SQL[] = [
      eq(pricingRulesTable.originState, input.originState),
      eq(pricingRulesTable.destinationState, input.destinationState),
      eq(pricingRulesTable.productTypeId, input.productTypeId),
      eq(pricingRulesTable.serviceTypeId, input.serviceTypeId),
      eq(pricingRulesTable.modeTypeId, input.modeTypeId),
    ];

    if (input.originCity) {
      conditions.push(eq(pricingRulesTable.originCity, input.originCity));
    } else {
      conditions.push(isNull(pricingRulesTable.originCity));
    }

    if (input.destinationCity) {
      conditions.push(eq(pricingRulesTable.destinationCity, input.destinationCity));
    } else {
      conditions.push(isNull(pricingRulesTable.destinationCity));
    }

    const [existing] = await db
      .select({ id: pricingRulesTable.id })
      .from(pricingRulesTable)
      .where(and(...conditions))
      .limit(1);

    if (existing && existing.id !== excludeId) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A pricing rule with this exact route and type combination already exists",
      });
    }
  }
}

export default PricingRuleService;
