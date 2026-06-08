"use client";

import { useState } from "react";
import {
  Package,
  PlusCircle,
  CheckCircle2,
  IndianRupee,
  Truck,
  Clock,
  AlertTriangle,
  Timer,
} from "lucide-react";
import { trpc } from "~/trpc/client";
import { PageHeader } from "~/components/shared/page-header";
import { StatCard } from "~/components/shared/stat-card";
import { DateRangeFilter } from "./_components/date-range-filter";
import { OrderTrendChart } from "./_components/order-trend-chart";
import { RevenueTrendChart } from "./_components/revenue-trend-chart";
import { DistributionChart } from "./_components/distribution-chart";
import { TopBranchesChart } from "./_components/top-branches-chart";
import { TopCustomersTable } from "./_components/top-customers-table";
import { RecentActivityFeed } from "./_components/recent-activity-feed";

export default function DashboardPage() {
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [branchId, setBranchId] = useState<string | undefined>();
  const [activePreset, setActivePreset] = useState("all");

  const filters = { dateFrom, dateTo, branchId };

  const { data: overview, isLoading: overviewLoading } =
    trpc.dashboard.getOverview.useQuery(filters);

  const { data: orderTrend, isLoading: orderTrendLoading } =
    trpc.dashboard.getOrderTrend.useQuery(filters);

  const { data: revenueTrend, isLoading: revenueTrendLoading } =
    trpc.dashboard.getRevenueTrend.useQuery(filters);

  const { data: byProduct, isLoading: byProductLoading } =
    trpc.dashboard.getDistributionByProduct.useQuery(filters);

  const { data: byService, isLoading: byServiceLoading } =
    trpc.dashboard.getDistributionByService.useQuery(filters);

  const { data: byMode, isLoading: byModeLoading } =
    trpc.dashboard.getDistributionByMode.useQuery(filters);

  const { data: topBranches, isLoading: topBranchesLoading } =
    trpc.dashboard.getTopBranches.useQuery(filters);

  const { data: topCustomers, isLoading: topCustomersLoading } =
    trpc.dashboard.getTopCustomers.useQuery(filters);

  const { data: activities, isLoading: activitiesLoading } =
    trpc.dashboard.getRecentActivities.useQuery(filters, {
      refetchInterval: 30000,
    });

  function formatRevenue(val: string | undefined) {
    if (!val) return "₹0";
    const num = parseFloat(val);
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num.toLocaleString("en-IN")}`;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your courier operations."
      />

      {/* Row 1: Filters */}
      <DateRangeFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        branchId={branchId}
        onRangeChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
        onBranchChange={setBranchId}
        activePreset={activePreset}
        onPresetChange={setActivePreset}
      />

      {/* Row 2: KPI Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Shipments"
          value={overview?.totalShipments ?? 0}
          icon={Package}
        />
        <StatCard
          title="New Orders Today"
          value={overview?.newOrdersToday ?? 0}
          icon={PlusCircle}
        />
        <StatCard
          title="Delivered"
          value={overview?.deliveredCount ?? 0}
          icon={CheckCircle2}
          description={overview ? `${overview.deliveredPercentage}% success rate` : undefined}
        />
        <StatCard
          title="Revenue"
          value={formatRevenue(overview?.revenue)}
          icon={IndianRupee}
        />
        <StatCard
          title="In Transit"
          value={overview?.inTransitCount ?? 0}
          icon={Truck}
        />
        <StatCard
          title="Pending Pickups"
          value={overview?.pendingPickups ?? 0}
          icon={Clock}
        />
        <StatCard
          title="Returned / Failed"
          value={overview?.returnedCount ?? 0}
          icon={AlertTriangle}
        />
        <StatCard
          title="Avg Delivery Time"
          value={overview?.avgDeliveryTimeHours != null ? `${overview.avgDeliveryTimeHours} hrs` : "-"}
          icon={Timer}
        />
      </div>

      {/* Row 3: Time-Series Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <OrderTrendChart data={orderTrend?.data} isLoading={orderTrendLoading} />
        <RevenueTrendChart data={revenueTrend?.data} isLoading={revenueTrendLoading} />
      </div>

      {/* Row 4: Distribution Charts */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DistributionChart
          title="By Product Type"
          data={byProduct?.data}
          isLoading={byProductLoading}
        />
        <DistributionChart
          title="By Service Type"
          data={byService?.data}
          isLoading={byServiceLoading}
        />
        <DistributionChart
          title="By Transport Mode"
          data={byMode?.data}
          isLoading={byModeLoading}
        />
      </div>

      {/* Row 5: Rankings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopBranchesChart data={topBranches?.data} isLoading={topBranchesLoading} />
        <TopCustomersTable data={topCustomers?.data} isLoading={topCustomersLoading} />
      </div>

      {/* Row 6: Recent Activity */}
      <RecentActivityFeed data={activities?.data} isLoading={activitiesLoading} />
    </div>
  );
}
