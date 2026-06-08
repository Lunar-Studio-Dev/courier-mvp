"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { X, Package, IndianRupee, Timer, CheckCircle2 } from "lucide-react";
import { StatCard } from "~/components/shared/stat-card";
import { trpc } from "~/trpc/client";

interface EntityAnalyticsPanelProps {
  entityType: "productType" | "serviceType" | "modeType";
  entityId: string;
  entityName: string;
  onClose: () => void;
}

export function EntityAnalyticsPanel({
  entityType,
  entityId,
  entityName,
  onClose,
}: EntityAnalyticsPanelProps) {
  const [preset, setPreset] = useState("all");

  function getDateRange() {
    if (preset === "all") return {};
    const now = new Date();
    const to = now.toISOString();
    const from = new Date(now);
    if (preset === "30d") from.setDate(from.getDate() - 30);
    else if (preset === "90d") from.setDate(from.getDate() - 90);
    else if (preset === "1y") from.setFullYear(from.getFullYear() - 1);
    return { dateFrom: from.toISOString(), dateTo: to };
  }

  const range = getDateRange();

  const { data, isLoading } = trpc.dashboard.getEntityAnalytics.useQuery({
    entityType,
    entityId,
    ...range,
  });

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Analytics: {entityName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[
                { value: "all", label: "All" },
                { value: "30d", label: "30d" },
                { value: "90d", label: "90d" },
                { value: "1y", label: "1y" },
              ].map((p) => (
                <Button
                  key={p.value}
                  size="sm"
                  variant={preset === p.value ? "default" : "outline"}
                  className="h-7 text-xs px-2"
                  onClick={() => setPreset(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Shipments" value={data.totalShipments} icon={Package} />
              <StatCard
                title="Revenue"
                value={`₹${parseFloat(data.revenue).toLocaleString("en-IN")}`}
                icon={IndianRupee}
              />
              <StatCard
                title="Avg Delivery"
                value={data.avgDeliveryTimeHours != null ? `${data.avgDeliveryTimeHours} hrs` : "-"}
                icon={Timer}
              />
              <StatCard
                title="Success Rate"
                value={`${data.successRate}%`}
                icon={CheckCircle2}
              />
            </div>
            {data.monthlyTrend.length > 0 && (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Shipments"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
