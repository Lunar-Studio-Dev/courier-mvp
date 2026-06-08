import { db } from "@repo/database";
import {
  shipmentsTable,
  shipmentTrackingHistoryTable,
  branchesTable,
  customersTable,
  productTypesTable,
  serviceTypesTable,
  modeTypesTable,
} from "@repo/database/schema";
import { eq, and, sql, gte, lte, SQL } from "drizzle-orm";
import type {
  DashboardInput,
  DashboardOverviewOutput,
  EntityAnalyticsInput,
  EntityAnalyticsOutput,
  CustomerAnalyticsInput,
  CustomerAnalyticsOutput,
} from "./model";

function buildDateAndBranchConditions(input: DashboardInput): SQL[] {
  const conditions: SQL[] = [];
  if (input.dateFrom) {
    conditions.push(gte(shipmentsTable.bookedAt, new Date(input.dateFrom)));
  }
  if (input.dateTo) {
    conditions.push(lte(shipmentsTable.bookedAt, new Date(input.dateTo)));
  }
  if (input.branchId) {
    conditions.push(eq(shipmentsTable.branchId, input.branchId));
  }
  return conditions;
}

class DashboardService {
  async getOverview(input: DashboardInput): Promise<DashboardOverviewOutput> {
    const conditions = buildDateAndBranchConditions(input);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayConditions = [...conditions, gte(shipmentsTable.bookedAt, todayStart)];

    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)::int`,
        delivered: sql<number>`COUNT(*) FILTER (WHERE ${shipmentsTable.status} = 'DELIVERED')::int`,
        inTransit: sql<number>`COUNT(*) FILTER (WHERE ${shipmentsTable.status} = 'IN_TRANSIT')::int`,
        pendingPickups: sql<number>`COUNT(*) FILTER (WHERE ${shipmentsTable.status} = 'BOOKED')::int`,
        returned: sql<number>`COUNT(*) FILTER (WHERE ${shipmentsTable.status} IN ('RETURNED', 'CANCELLED'))::int`,
        revenue: sql<string>`COALESCE(SUM(${shipmentsTable.totalAmount}), 0)::text`,
        avgHours: sql<number>`AVG(EXTRACT(EPOCH FROM (${shipmentsTable.deliveredAt} - ${shipmentsTable.bookedAt})) / 3600) FILTER (WHERE ${shipmentsTable.deliveredAt} IS NOT NULL)`,
      })
      .from(shipmentsTable)
      .where(where);

    const [todayStats] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(shipmentsTable)
      .where(and(...todayConditions));

    const total = stats?.total ?? 0;
    const delivered = stats?.delivered ?? 0;

    return {
      totalShipments: total,
      newOrdersToday: todayStats?.count ?? 0,
      deliveredCount: delivered,
      deliveredPercentage: total > 0 ? Math.round((delivered / total) * 100) : 0,
      inTransitCount: stats?.inTransit ?? 0,
      pendingPickups: stats?.pendingPickups ?? 0,
      returnedCount: stats?.returned ?? 0,
      revenue: stats?.revenue ?? "0",
      avgDeliveryTimeHours: stats?.avgHours ? Math.round(stats.avgHours * 10) / 10 : null,
    };
  }

  async getOrderTrend(input: DashboardInput) {
    const conditions = buildDateAndBranchConditions(input);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        date: sql<string>`TO_CHAR(${shipmentsTable.bookedAt}, 'YYYY-MM-DD')`.as("date"),
        count: sql<number>`COUNT(*)::int`.as("count"),
      })
      .from(shipmentsTable)
      .where(where)
      .groupBy(sql`TO_CHAR(${shipmentsTable.bookedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${shipmentsTable.bookedAt}, 'YYYY-MM-DD') ASC`);

    return { data: rows };
  }

  async getRevenueTrend(input: DashboardInput) {
    const conditions = buildDateAndBranchConditions(input);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        date: sql<string>`TO_CHAR(${shipmentsTable.bookedAt}, 'YYYY-MM-DD')`.as("date"),
        amount: sql<string>`COALESCE(SUM(${shipmentsTable.totalAmount}), 0)::text`.as("amount"),
      })
      .from(shipmentsTable)
      .where(where)
      .groupBy(sql`TO_CHAR(${shipmentsTable.bookedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${shipmentsTable.bookedAt}, 'YYYY-MM-DD') ASC`);

    return { data: rows };
  }

  async getDistributionByProductType(input: DashboardInput) {
    const conditions = buildDateAndBranchConditions(input);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        name: productTypesTable.name,
        value: sql<number>`COUNT(*)::int`.as("value"),
      })
      .from(shipmentsTable)
      .innerJoin(productTypesTable, eq(shipmentsTable.productTypeId, productTypesTable.id))
      .where(where)
      .groupBy(productTypesTable.name);

    return { data: rows };
  }

  async getDistributionByServiceType(input: DashboardInput) {
    const conditions = buildDateAndBranchConditions(input);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        name: serviceTypesTable.name,
        value: sql<number>`COUNT(*)::int`.as("value"),
      })
      .from(shipmentsTable)
      .innerJoin(serviceTypesTable, eq(shipmentsTable.serviceTypeId, serviceTypesTable.id))
      .where(where)
      .groupBy(serviceTypesTable.name);

    return { data: rows };
  }

  async getDistributionByMode(input: DashboardInput) {
    const conditions = buildDateAndBranchConditions(input);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        name: modeTypesTable.name,
        value: sql<number>`COUNT(*)::int`.as("value"),
      })
      .from(shipmentsTable)
      .innerJoin(modeTypesTable, eq(shipmentsTable.modeTypeId, modeTypesTable.id))
      .where(where)
      .groupBy(modeTypesTable.name);

    return { data: rows };
  }

  async getTopBranches(input: DashboardInput) {
    const conditions = buildDateAndBranchConditions(input);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        branchId: shipmentsTable.branchId,
        branchName: branchesTable.name,
        shipmentCount: sql<number>`COUNT(*)::int`.as("shipment_count"),
      })
      .from(shipmentsTable)
      .innerJoin(branchesTable, eq(shipmentsTable.branchId, branchesTable.id))
      .where(where)
      .groupBy(shipmentsTable.branchId, branchesTable.name)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(10);

    return { data: rows };
  }

  async getTopCustomers(input: DashboardInput) {
    const conditions = buildDateAndBranchConditions(input);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        customerId: shipmentsTable.senderId,
        customerName: customersTable.fullName,
        shipmentCount: sql<number>`COUNT(*)::int`.as("shipment_count"),
        revenue: sql<string>`COALESCE(SUM(${shipmentsTable.totalAmount}), 0)::text`.as("revenue"),
      })
      .from(shipmentsTable)
      .innerJoin(customersTable, eq(shipmentsTable.senderId, customersTable.id))
      .where(where)
      .groupBy(shipmentsTable.senderId, customersTable.fullName)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(10);

    return { data: rows };
  }

  async getRecentActivities(input: DashboardInput) {
    const conditions: SQL[] = [];
    if (input.branchId) {
      conditions.push(eq(shipmentsTable.branchId, input.branchId));
    }

    const rows = await db
      .select({
        id: shipmentTrackingHistoryTable.id,
        trackingNumber: shipmentsTable.trackingNumber,
        status: shipmentTrackingHistoryTable.status,
        location: shipmentTrackingHistoryTable.location,
        remarks: shipmentTrackingHistoryTable.remarks,
        timestamp: shipmentTrackingHistoryTable.timestamp,
      })
      .from(shipmentTrackingHistoryTable)
      .innerJoin(shipmentsTable, eq(shipmentTrackingHistoryTable.shipmentId, shipmentsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${shipmentTrackingHistoryTable.timestamp} DESC`)
      .limit(20);

    return { data: rows };
  }

  async getEntityAnalytics(input: EntityAnalyticsInput): Promise<EntityAnalyticsOutput> {
    const columnMap = {
      productType: shipmentsTable.productTypeId,
      serviceType: shipmentsTable.serviceTypeId,
      modeType: shipmentsTable.modeTypeId,
    };
    const col = columnMap[input.entityType];

    const conditions: SQL[] = [eq(col, input.entityId)];
    if (input.dateFrom) conditions.push(gte(shipmentsTable.bookedAt, new Date(input.dateFrom)));
    if (input.dateTo) conditions.push(lte(shipmentsTable.bookedAt, new Date(input.dateTo)));

    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)::int`,
        delivered: sql<number>`COUNT(*) FILTER (WHERE ${shipmentsTable.status} = 'DELIVERED')::int`,
        revenue: sql<string>`COALESCE(SUM(${shipmentsTable.totalAmount}), 0)::text`,
        avgHours: sql<number>`AVG(EXTRACT(EPOCH FROM (${shipmentsTable.deliveredAt} - ${shipmentsTable.bookedAt})) / 3600) FILTER (WHERE ${shipmentsTable.deliveredAt} IS NOT NULL)`,
      })
      .from(shipmentsTable)
      .where(and(...conditions));

    const total = stats?.total ?? 0;
    const delivered = stats?.delivered ?? 0;

    const trend = await db
      .select({
        month: sql<string>`TO_CHAR(${shipmentsTable.bookedAt}, 'YYYY-MM')`.as("month"),
        count: sql<number>`COUNT(*)::int`.as("count"),
      })
      .from(shipmentsTable)
      .where(and(...conditions))
      .groupBy(sql`TO_CHAR(${shipmentsTable.bookedAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${shipmentsTable.bookedAt}, 'YYYY-MM') ASC`);

    return {
      totalShipments: total,
      revenue: stats?.revenue ?? "0",
      avgDeliveryTimeHours: stats?.avgHours ? Math.round(stats.avgHours * 10) / 10 : null,
      successRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
      monthlyTrend: trend,
    };
  }

  async getCustomerAnalytics(input: CustomerAnalyticsInput): Promise<CustomerAnalyticsOutput> {
    const dateConditions: SQL[] = [];
    if (input.dateFrom) dateConditions.push(gte(shipmentsTable.bookedAt, new Date(input.dateFrom)));
    if (input.dateTo) dateConditions.push(lte(shipmentsTable.bookedAt, new Date(input.dateTo)));

    const sentConditions = [eq(shipmentsTable.senderId, input.customerId), ...dateConditions];
    const recvConditions = [eq(shipmentsTable.receiverId, input.customerId), ...dateConditions];

    const [[sentStats], [recvStats]] = await Promise.all([
      db
        .select({
          total: sql<number>`COUNT(*)::int`,
          delivered: sql<number>`COUNT(*) FILTER (WHERE ${shipmentsTable.status} = 'DELIVERED')::int`,
          revenue: sql<string>`COALESCE(SUM(${shipmentsTable.totalAmount}), 0)::text`,
          avgHours: sql<number>`AVG(EXTRACT(EPOCH FROM (${shipmentsTable.deliveredAt} - ${shipmentsTable.bookedAt})) / 3600) FILTER (WHERE ${shipmentsTable.deliveredAt} IS NOT NULL)`,
        })
        .from(shipmentsTable)
        .where(and(...sentConditions)),
      db
        .select({ total: sql<number>`COUNT(*)::int` })
        .from(shipmentsTable)
        .where(and(...recvConditions)),
    ]);

    const totalSent = sentStats?.total ?? 0;
    const delivered = sentStats?.delivered ?? 0;

    const sentTrend = await db
      .select({
        month: sql<string>`TO_CHAR(${shipmentsTable.bookedAt}, 'YYYY-MM')`.as("month"),
        count: sql<number>`COUNT(*)::int`.as("count"),
      })
      .from(shipmentsTable)
      .where(and(...sentConditions))
      .groupBy(sql`TO_CHAR(${shipmentsTable.bookedAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${shipmentsTable.bookedAt}, 'YYYY-MM') ASC`);

    const recvTrend = await db
      .select({
        month: sql<string>`TO_CHAR(${shipmentsTable.bookedAt}, 'YYYY-MM')`.as("month"),
        count: sql<number>`COUNT(*)::int`.as("count"),
      })
      .from(shipmentsTable)
      .where(and(...recvConditions))
      .groupBy(sql`TO_CHAR(${shipmentsTable.bookedAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${shipmentsTable.bookedAt}, 'YYYY-MM') ASC`);

    // Merge sent + received trends by month
    const monthMap = new Map<string, { sent: number; received: number }>();
    for (const r of sentTrend) {
      monthMap.set(r.month, { sent: r.count, received: 0 });
    }
    for (const r of recvTrend) {
      const existing = monthMap.get(r.month) ?? { sent: 0, received: 0 };
      existing.received = r.count;
      monthMap.set(r.month, existing);
    }
    const monthlyTrend = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, sent: v.sent, received: v.received }));

    return {
      totalShipmentsSent: totalSent,
      totalShipmentsReceived: recvStats?.total ?? 0,
      totalSpend: sentStats?.revenue ?? "0",
      avgDeliveryTimeHours: sentStats?.avgHours ? Math.round(sentStats.avgHours * 10) / 10 : null,
      successRate: totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0,
      monthlyTrend,
    };
  }
}

export default DashboardService;
