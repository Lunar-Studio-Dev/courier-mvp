# Phase 8: Analytics & Dashboard

## Status: DONE

## Prerequisites
- **Phase 4 must be completed first.** Dashboard aggregates shipment, customer, and branch data.
- Phases 5-7 should be complete so all data sources are available.

## Goal
Build the main analytics dashboard with KPI stat cards, time-series charts, distribution charts, ranking tables, and a recent activity feed. Add per-entity analytics for product types, service types, and mode types. Add a customer analytics section to the customer detail page. All analytics support date range filtering.

---

## Current State Analysis

### Already Implemented
- **Dashboard page** (`(admin)/dashboard/page.tsx`) — Empty placeholder with title only
- **Customer detail page** (`(admin)/customers/[id]/page.tsx`) — Profile + ID proof cards, no analytics
- **Product/Service/Mode type pages** — CRUD list pages, no analytics
- **Shipments table** — Has all columns needed for aggregation: status, bookedAt, deliveredAt, totalAmount, branchId, productTypeId, serviceTypeId, modeTypeId, senderId, receiverId
- **Tracking history table** — Has shipmentId, status, location, timestamp for activity feed
- **Recharts** — Already installed (`recharts` in web dependencies)
- **StatCard component** (`components/shared/stat-card.tsx`) — Already exists

### Missing (All New)
1. `packages/services/dashboard/` — DashboardService with all aggregation queries
2. `packages/trpc/server/routes/dashboard/` — Dashboard tRPC routes
3. Full dashboard UI with charts, stat cards, rankings, activity feed
4. Per-entity analytics (product-type, service-type, mode-type)
5. Customer analytics on customer detail page

---

## Step 8.1 - Dashboard Service
**Status: DONE**

### Create: `packages/services/dashboard/model.ts`

Zod schemas for all dashboard endpoints:

```typescript
// Input — shared date range + branch filter
dashboardInputSchema = z.object({
  dateFrom: z.string().optional(),   // ISO date string
  dateTo: z.string().optional(),
  branchId: z.string().uuid().optional(),
})

// Overview KPIs
dashboardOverviewOutputSchema = z.object({
  totalShipments: z.number(),
  newOrdersToday: z.number(),
  deliveredCount: z.number(),
  deliveredPercentage: z.number(),   // 0-100
  inTransitCount: z.number(),
  pendingPickups: z.number(),        // BOOKED status
  returnedCount: z.number(),
  revenue: z.string(),               // decimal as string
  avgDeliveryTimeHours: z.number().nullable(),
})

// Time-series trends
orderTrendOutputSchema = z.object({
  data: z.array(z.object({
    date: z.string(),    // YYYY-MM-DD
    count: z.number(),
  })),
})

revenueTrendOutputSchema = z.object({
  data: z.array(z.object({
    date: z.string(),
    amount: z.string(),  // decimal as string
  })),
})

// Distribution charts
distributionOutputSchema = z.object({
  data: z.array(z.object({
    name: z.string(),
    value: z.number(),
  })),
})

// Rankings
topBranchesOutputSchema = z.object({
  data: z.array(z.object({
    branchId: z.string(),
    branchName: z.string(),
    shipmentCount: z.number(),
  })),
})

topCustomersOutputSchema = z.object({
  data: z.array(z.object({
    customerId: z.string(),
    customerName: z.string(),
    shipmentCount: z.number(),
    revenue: z.string(),
  })),
})

// Activity feed
recentActivityOutputSchema = z.object({
  data: z.array(z.object({
    id: z.string(),
    trackingNumber: z.string(),
    status: z.string(),
    location: z.string().nullable(),
    remarks: z.string().nullable(),
    timestamp: z.date().nullable(),
  })),
})
```

### Create: `packages/services/dashboard/index.ts`

Class `DashboardService` with these methods:

- **`getOverview(input)`** — Aggregate queries on shipmentsTable:
  - `COUNT(*)` total shipments (filtered by date range)
  - `COUNT(*) WHERE bookedAt >= today` for new orders today
  - `COUNT(*) WHERE status = 'DELIVERED'` for delivered count
  - `deliveredCount / totalShipments * 100` for percentage
  - `COUNT(*) WHERE status = 'IN_TRANSIT'`
  - `COUNT(*) WHERE status = 'BOOKED'` for pending pickups
  - `COUNT(*) WHERE status IN ('RETURNED', 'CANCELLED')` for returned
  - `SUM(totalAmount)` for revenue
  - `AVG(deliveredAt - bookedAt)` in hours for avg delivery time (only for delivered shipments)
  - All filtered by optional dateFrom/dateTo/branchId

- **`getOrderTrend(input)`** — `GROUP BY DATE(bookedAt)`, `COUNT(*)`, ordered by date ASC. Use Drizzle `sql` template for date truncation. Returns last 30 days by default, or date range.

- **`getRevenueTrend(input)`** — `GROUP BY DATE(bookedAt)`, `SUM(totalAmount)`, ordered by date ASC.

- **`getDistributionByProductType(input)`** — `GROUP BY productTypeId`, `COUNT(*)`, JOIN productTypesTable for name. Returns `{ name, value }[]`.

- **`getDistributionByServiceType(input)`** — Same pattern with serviceTypesTable.

- **`getDistributionByMode(input)`** — Same pattern with modeTypesTable.

- **`getTopBranches(input)`** — `GROUP BY branchId`, `COUNT(*)`, JOIN branchesTable for name, `ORDER BY count DESC`, `LIMIT 10`.

- **`getTopCustomers(input)`** — `GROUP BY senderId`, `COUNT(*)`, `SUM(totalAmount)`, JOIN customersTable for fullName, `ORDER BY count DESC`, `LIMIT 10`.

- **`getRecentActivities(input)`** — Select from shipmentTrackingHistoryTable, JOIN shipmentsTable for trackingNumber, `ORDER BY timestamp DESC`, `LIMIT 20`.

All methods accept the shared `DashboardInput` with optional dateFrom, dateTo, branchId. Build `SQL[]` conditions array and apply via `and(...conditions)`.

**Note on SQL aggregation:** Use Drizzle `sql` tagged template for `DATE()`, `AVG()`, `EXTRACT()` etc. since Drizzle's type-safe API doesn't cover all aggregation functions. Pattern:
```typescript
import { sql } from "drizzle-orm";
sql<number>`COUNT(*)`.as("count")
sql<string>`DATE(${shipmentsTable.bookedAt})`.as("date")
sql<number>`EXTRACT(EPOCH FROM (${shipmentsTable.deliveredAt} - ${shipmentsTable.bookedAt})) / 3600`.as("avg_hours")
```

---

## Step 8.2 - Dashboard tRPC Routes
**Status: DONE**

### Create: `packages/trpc/server/routes/dashboard/route.ts`

All procedures use `adminProcedure`:

| Procedure | Method | Path | Description |
|-----------|--------|------|-------------|
| getOverview | GET | /dashboard/overview | KPI stat cards data |
| getOrderTrend | GET | /dashboard/order-trend | Orders per day |
| getRevenueTrend | GET | /dashboard/revenue-trend | Revenue per day |
| getDistributionByProduct | GET | /dashboard/distribution/product | Shipments by product type |
| getDistributionByService | GET | /dashboard/distribution/service | Shipments by service type |
| getDistributionByMode | GET | /dashboard/distribution/mode | Shipments by transport mode |
| getTopBranches | GET | /dashboard/top-branches | Top 10 branches by volume |
| getTopCustomers | GET | /dashboard/top-customers | Top 10 customers by volume + revenue |
| getRecentActivities | GET | /dashboard/recent-activities | Latest 20 tracking events |

All accept `dashboardInputSchema` (dateFrom?, dateTo?, branchId?).

### Update: `packages/trpc/server/services/index.ts`
Add `import DashboardService` and `export const dashboardService`.

### Update: `packages/trpc/server/index.ts`
Add `import { dashboardRouter }` and `dashboard: dashboardRouter`.

---

## Step 8.3 - Dashboard UI: Stat Cards & Date Filter
**Status: DONE**

### Update: `apps/web/app/(admin)/dashboard/page.tsx`

Rewrite the empty placeholder into the full dashboard page. Mark as `"use client"`.

**Row 1: Date Range Selector + Branch Filter**
- Preset buttons: Today, 7 Days, 30 Days, 90 Days (default: 30 Days)
- Each sets `dateFrom` and `dateTo` state
- Optional branch filter dropdown (loads from `trpc.branches.list`)
- All dashboard queries receive the current dateFrom/dateTo/branchId

**Row 2: KPI Stat Cards (responsive grid: 4 cols desktop, 2 cols mobile)**

Use the existing `StatCard` component. 8 cards:
1. Total Shipments (Package icon)
2. New Orders Today (Plus icon)
3. Delivered (CheckCircle icon, show percentage as sub-text)
4. Revenue (IndianRupee icon, format as INR)
5. In-Transit (Truck icon)
6. Pending Pickups (Clock icon)
7. Returned/Failed (AlertTriangle icon)
8. Avg Delivery Time (Timer icon, format as "X.X hrs")

Data from `trpc.dashboard.getOverview.useQuery({ dateFrom, dateTo, branchId })`.

### Create: `apps/web/app/(admin)/dashboard/_components/date-range-filter.tsx`
Client component with preset buttons and optional custom date range (two date inputs). Props: `onRangeChange(dateFrom, dateTo)`. Also includes optional branch select dropdown.

---

## Step 8.4 - Dashboard UI: Charts
**Status: DONE**

### Create: `apps/web/app/(admin)/dashboard/_components/order-trend-chart.tsx`
- Uses Recharts `AreaChart` (or `LineChart`)
- Data from `trpc.dashboard.getOrderTrend.useQuery()`
- X-axis: date, Y-axis: count
- Responsive, fills card width
- Wrapped in a Card with title "Order Growth"
- Tooltip showing date + count on hover
- Area fill with primary color at low opacity

### Create: `apps/web/app/(admin)/dashboard/_components/revenue-trend-chart.tsx`
- Uses Recharts `BarChart`
- Data from `trpc.dashboard.getRevenueTrend.useQuery()`
- X-axis: date, Y-axis: amount (INR)
- Wrapped in a Card with title "Revenue Trend"
- Bar fill with primary color

### Create: `apps/web/app/(admin)/dashboard/_components/distribution-chart.tsx`
- Reusable component for donut/pie charts
- Props: `title: string`, `data: { name: string, value: number }[]`
- Uses Recharts `PieChart` with `Pie` (innerRadius for donut effect)
- Color array for segments
- Legend below showing name + count
- Used 3 times: by Product Type, by Service Type, by Mode

Layout on the page:
- **Row 3**: 2-column grid — Order Trend (left) + Revenue Trend (right)
- **Row 4**: 3-column grid — Distribution by Product / Service / Mode

---

## Step 8.5 - Dashboard UI: Rankings & Activity Feed
**Status: DONE**

### Create: `apps/web/app/(admin)/dashboard/_components/top-branches-chart.tsx`
- Uses Recharts `BarChart` (horizontal via `layout="vertical"`)
- Data from `trpc.dashboard.getTopBranches.useQuery()`
- Shows branch name on Y-axis, shipment count on X-axis
- Wrapped in Card with title "Top Branches"

### Create: `apps/web/app/(admin)/dashboard/_components/top-customers-table.tsx`
- Simple table (not DataTable — just a `<table>`)
- Data from `trpc.dashboard.getTopCustomers.useQuery()`
- Columns: Rank | Customer Name | Shipments | Revenue
- Wrapped in Card with title "Top Customers"
- Top 10 rows

### Create: `apps/web/app/(admin)/dashboard/_components/recent-activity-feed.tsx`
- Data from `trpc.dashboard.getRecentActivities.useQuery()` with `refetchInterval: 30000` (auto-refresh every 30s)
- Table: Time | Tracking # (link) | Status (Badge) | Location | Remarks
- Wrapped in Card with title "Recent Activity"
- Show latest 20 entries
- Tracking number links to `/shipments/{id}` or shows tracking number as text

Layout on the page:
- **Row 5**: 2-column grid — Top Branches (left) + Top Customers (right)
- **Row 6**: Full-width — Recent Activity Feed

---

## Step 8.6 - Per-Entity Analytics
**Status: DONE**

Add analytics for Product Types, Service Types, and Mode Types.

### Create: `packages/services/dashboard/entity-analytics.ts`

A generic method (or a small class) reusable across entity types:

```typescript
getEntityAnalytics(input: {
  entityType: "productType" | "serviceType" | "modeType";
  entityId: string;
  dateFrom?: string;
  dateTo?: string;
}) -> {
  totalShipments: number;
  revenue: string;
  avgDeliveryTimeHours: number | null;
  successRate: number;     // delivered / total * 100
  monthlyTrend: { month: string; count: number }[];
}
```

Logic:
- Filter shipmentsTable WHERE `{entityType}Id = entityId` and optional date range
- COUNT total, SUM totalAmount, AVG delivery time
- COUNT delivered / COUNT total for success rate
- GROUP BY `DATE_TRUNC('month', bookedAt)` for monthly trend

### Add to dashboard tRPC routes:
- `getEntityAnalytics` procedure accepting `{ entityType, entityId, dateFrom?, dateTo? }`

### Create: `apps/web/app/(admin)/_components/entity-analytics-panel.tsx`
Reusable client component shown on product-type, service-type, and mode-type pages.

Props: `entityType`, `entityId`

Shows:
- 4 stat cards in a row: Total Shipments, Revenue, Avg Delivery Time, Success Rate
- Monthly trend line chart (Recharts `LineChart`)
- Date range filter (reuse date-range-filter component or simple preset buttons)

### Integration:
When a user clicks a row or views an entity, show the analytics panel. Implementation options:
- **Option A (simpler)**: Add a collapsible section at the top of each entity page that shows when an entity is selected
- **Option B**: Show in a Sheet/Dialog when clicking an "Analytics" button on a row

Go with **Option A** — add a row-click handler that sets `selectedEntityId`, and render `EntityAnalyticsPanel` above the table when set.

### Update: `apps/web/app/(admin)/product-types/page.tsx`
- Add `selectedEntityId` state
- Row click sets the selected entity
- Show `EntityAnalyticsPanel` above table when selected
- Add close/dismiss button on the panel

### Update: `apps/web/app/(admin)/service-types/page.tsx`
- Same pattern as product-types

### Update: `apps/web/app/(admin)/mode-types/page.tsx`
- Same pattern as mode-types

---

## Step 8.7 - Customer Analytics on Detail Page
**Status: DONE**

### Add to DashboardService: `getCustomerAnalytics(input)`

```typescript
getCustomerAnalytics(input: {
  customerId: string;
  dateFrom?: string;
  dateTo?: string;
}) -> {
  totalShipmentsSent: number;
  totalShipmentsReceived: number;
  totalSpend: string;          // SUM totalAmount WHERE senderId = customerId
  avgDeliveryTimeHours: number | null;
  successRate: number;
  monthlyTrend: { month: string; sent: number; received: number }[];
}
```

Logic:
- Count shipments WHERE senderId = customerId (sent)
- Count shipments WHERE receiverId = customerId (received)
- SUM totalAmount WHERE senderId = customerId
- AVG delivery time for sent shipments
- Monthly trend with both sent and received counts

### Add tRPC route:
- `getCustomerAnalytics` procedure in dashboard router

### Create: `apps/web/app/(admin)/customers/[id]/_components/customer-analytics.tsx`
Client component. Props: `customerId: string`.

Shows:
- 4 stat cards: Shipments Sent, Shipments Received, Total Spend (INR), Avg Delivery Time
- Monthly trend chart (Recharts `BarChart` with stacked bars: sent vs received)
- Success rate badge

### Update: `apps/web/app/(admin)/customers/[id]/page.tsx`
- Add the `CustomerAnalytics` component below the existing profile/ID proof cards
- Wrapped in a Card with title "Shipment Analytics"

---

## Step 8.8 - Build Verification
**Status: DONE**

- Run `pnpm turbo build` to verify full compilation
- Dashboard page renders with all 6 rows (date filter, stats, charts, distributions, rankings, activity)
- Charts render correctly with Recharts (area, bar, donut, horizontal bar)
- Date range filter updates all queries
- Branch filter scopes all data
- Auto-refresh on activity feed (30s interval)
- Per-entity analytics panels render on product/service/mode type pages
- Customer analytics renders on customer detail page
- All new tRPC routes accessible

---

## Implementation Notes

### Recharts Integration
Recharts is already installed. Key components to import:
- `AreaChart`, `Area`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer` — for order trend
- `BarChart`, `Bar` — for revenue trend and top branches
- `PieChart`, `Pie`, `Cell`, `Legend` — for distribution donut charts
- `LineChart`, `Line` — for entity monthly trend

All charts wrapped in `<ResponsiveContainer width="100%" height={300}>` for responsiveness.

### Color Palette for Charts
Use CSS variables from the theme for consistent chart colors:
```typescript
const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];
```
Or define a fixed color array if CSS variables don't work well with Recharts SVG fills.

### SQL Aggregation Pattern with Drizzle
Since Drizzle's query builder doesn't natively support all SQL aggregation functions, use the `sql` tagged template:
```typescript
const result = await db
  .select({
    date: sql<string>`DATE(${shipmentsTable.bookedAt})`.as("date"),
    count: sql<number>`COUNT(*)::int`.as("count"),
  })
  .from(shipmentsTable)
  .where(and(...conditions))
  .groupBy(sql`DATE(${shipmentsTable.bookedAt})`)
  .orderBy(sql`DATE(${shipmentsTable.bookedAt}) ASC`);
```

### Performance Considerations
- Dashboard queries can be expensive on large datasets. For MVP, no caching layer — rely on PostgreSQL indexes.
- If needed later: add indexes on `bookedAt`, `status`, `branchId`, `productTypeId`, `serviceTypeId`, `modeTypeId` columns.
- Activity feed auto-refresh at 30s is reasonable for MVP; can reduce to 60s if needed.

---

## Deliverables Checklist

| # | Item | Status |
|---|------|--------|
| 1 | DashboardService with all aggregation methods | DONE |
| 2 | Dashboard Zod schemas (input/output for all endpoints) | DONE |
| 3 | Dashboard tRPC routes (9 procedures) registered in serverRouter | DONE |
| 4 | Date range filter component with preset buttons + branch filter | DONE |
| 5 | KPI stat cards row (8 cards: shipments, orders, delivered, revenue, etc.) | DONE |
| 6 | Order trend area chart (Recharts) | DONE |
| 7 | Revenue trend bar chart (Recharts) | DONE |
| 8 | Distribution donut charts x3 (product/service/mode) | DONE |
| 9 | Top branches horizontal bar chart | DONE |
| 10 | Top customers ranking table | DONE |
| 11 | Recent activity feed with 30s auto-refresh | DONE |
| 12 | Per-entity analytics service method (generic for product/service/mode) | DONE |
| 13 | Entity analytics tRPC route | DONE |
| 14 | Reusable EntityAnalyticsPanel component | DONE |
| 15 | Product Types page: row-select analytics panel | DONE |
| 16 | Service Types page: row-select analytics panel | DONE |
| 17 | Mode Types page: row-select analytics panel | DONE |
| 18 | Customer analytics service method | DONE |
| 19 | Customer analytics tRPC route | DONE |
| 20 | Customer analytics component on detail page | DONE |
| 21 | Full build passes | DONE |
