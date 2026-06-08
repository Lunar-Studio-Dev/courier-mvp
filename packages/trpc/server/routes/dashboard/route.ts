import { dashboardService } from "../../services";
import {
  dashboardInputSchema,
  dashboardOverviewOutputSchema,
  orderTrendOutputSchema,
  revenueTrendOutputSchema,
  distributionOutputSchema,
  topBranchesOutputSchema,
  topCustomersOutputSchema,
  recentActivityOutputSchema,
  entityAnalyticsInputSchema,
  entityAnalyticsOutputSchema,
  customerAnalyticsInputSchema,
  customerAnalyticsOutputSchema,
} from "@repo/services/dashboard/model";
import { adminProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Dashboard"];
const getPath = generatePath("/dashboard");

export const dashboardRouter = router({
  getOverview: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/overview"), tags: TAGS } })
    .input(dashboardInputSchema)
    .output(dashboardOverviewOutputSchema)
    .query(({ input }) => dashboardService.getOverview(input)),

  getOrderTrend: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/order-trend"), tags: TAGS } })
    .input(dashboardInputSchema)
    .output(orderTrendOutputSchema)
    .query(({ input }) => dashboardService.getOrderTrend(input)),

  getRevenueTrend: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/revenue-trend"), tags: TAGS } })
    .input(dashboardInputSchema)
    .output(revenueTrendOutputSchema)
    .query(({ input }) => dashboardService.getRevenueTrend(input)),

  getDistributionByProduct: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/distribution/product"), tags: TAGS } })
    .input(dashboardInputSchema)
    .output(distributionOutputSchema)
    .query(({ input }) => dashboardService.getDistributionByProductType(input)),

  getDistributionByService: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/distribution/service"), tags: TAGS } })
    .input(dashboardInputSchema)
    .output(distributionOutputSchema)
    .query(({ input }) => dashboardService.getDistributionByServiceType(input)),

  getDistributionByMode: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/distribution/mode"), tags: TAGS } })
    .input(dashboardInputSchema)
    .output(distributionOutputSchema)
    .query(({ input }) => dashboardService.getDistributionByMode(input)),

  getTopBranches: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/top-branches"), tags: TAGS } })
    .input(dashboardInputSchema)
    .output(topBranchesOutputSchema)
    .query(({ input }) => dashboardService.getTopBranches(input)),

  getTopCustomers: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/top-customers"), tags: TAGS } })
    .input(dashboardInputSchema)
    .output(topCustomersOutputSchema)
    .query(({ input }) => dashboardService.getTopCustomers(input)),

  getRecentActivities: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/recent-activities"), tags: TAGS } })
    .input(dashboardInputSchema)
    .output(recentActivityOutputSchema)
    .query(({ input }) => dashboardService.getRecentActivities(input)),

  getEntityAnalytics: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/entity-analytics"), tags: TAGS } })
    .input(entityAnalyticsInputSchema)
    .output(entityAnalyticsOutputSchema)
    .query(({ input }) => dashboardService.getEntityAnalytics(input)),

  getCustomerAnalytics: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/customer-analytics"), tags: TAGS } })
    .input(customerAnalyticsInputSchema)
    .output(customerAnalyticsOutputSchema)
    .query(({ input }) => dashboardService.getCustomerAnalytics(input)),
});
