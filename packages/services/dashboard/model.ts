import { z } from "zod";

export const dashboardInputSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  branchId: z.string().uuid().optional(),
});
export type DashboardInput = z.infer<typeof dashboardInputSchema>;

export const dashboardOverviewOutputSchema = z.object({
  totalShipments: z.number(),
  newOrdersToday: z.number(),
  deliveredCount: z.number(),
  deliveredPercentage: z.number(),
  inTransitCount: z.number(),
  pendingPickups: z.number(),
  returnedCount: z.number(),
  revenue: z.string(),
  avgDeliveryTimeHours: z.number().nullable(),
});
export type DashboardOverviewOutput = z.infer<typeof dashboardOverviewOutputSchema>;

export const orderTrendOutputSchema = z.object({
  data: z.array(z.object({ date: z.string(), count: z.number() })),
});

export const revenueTrendOutputSchema = z.object({
  data: z.array(z.object({ date: z.string(), amount: z.string() })),
});

export const distributionOutputSchema = z.object({
  data: z.array(z.object({ name: z.string(), value: z.number() })),
});

export const topBranchesOutputSchema = z.object({
  data: z.array(
    z.object({
      branchId: z.string(),
      branchName: z.string(),
      shipmentCount: z.number(),
    }),
  ),
});

export const topCustomersOutputSchema = z.object({
  data: z.array(
    z.object({
      customerId: z.string(),
      customerName: z.string(),
      shipmentCount: z.number(),
      revenue: z.string(),
    }),
  ),
});

export const recentActivityOutputSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      trackingNumber: z.string(),
      status: z.string(),
      location: z.string().nullable(),
      remarks: z.string().nullable(),
      timestamp: z.date().nullable(),
    }),
  ),
});

export const entityAnalyticsInputSchema = z.object({
  entityType: z.enum(["productType", "serviceType", "modeType"]),
  entityId: z.string().uuid(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
export type EntityAnalyticsInput = z.infer<typeof entityAnalyticsInputSchema>;

export const entityAnalyticsOutputSchema = z.object({
  totalShipments: z.number(),
  revenue: z.string(),
  avgDeliveryTimeHours: z.number().nullable(),
  successRate: z.number(),
  monthlyTrend: z.array(z.object({ month: z.string(), count: z.number() })),
});
export type EntityAnalyticsOutput = z.infer<typeof entityAnalyticsOutputSchema>;

export const customerAnalyticsInputSchema = z.object({
  customerId: z.string().uuid(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
export type CustomerAnalyticsInput = z.infer<typeof customerAnalyticsInputSchema>;

export const customerAnalyticsOutputSchema = z.object({
  totalShipmentsSent: z.number(),
  totalShipmentsReceived: z.number(),
  totalSpend: z.string(),
  avgDeliveryTimeHours: z.number().nullable(),
  successRate: z.number(),
  monthlyTrend: z.array(
    z.object({ month: z.string(), sent: z.number(), received: z.number() }),
  ),
});
export type CustomerAnalyticsOutput = z.infer<typeof customerAnalyticsOutputSchema>;
