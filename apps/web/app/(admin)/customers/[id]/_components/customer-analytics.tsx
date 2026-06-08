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
import {
  Package,
  IndianRupee,
  Timer,
  CheckCircle2,
  Send,
  Inbox,
} from "lucide-react";
import { StatCard } from "~/components/shared/stat-card";
import { trpc } from "~/trpc/client";

interface CustomerAnalyticsProps {
  customerId: string;
  customerName: string;
}

export function CustomerAnalytics({
  customerId,
  customerName,
}: CustomerAnalyticsProps) {
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

  const { data, isLoading } = trpc.dashboard.getCustomerAnalytics.useQuery({
    customerId,
    ...range,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Shipment Analytics
          </CardTitle>
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
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
              <StatCard title="Sent" value={data.totalShipmentsSent} icon={Send} />
              <StatCard title="Received" value={data.totalShipmentsReceived} icon={Inbox} />
              <StatCard
                title="Total Spend"
                value={`₹${parseFloat(data.totalSpend).toLocaleString("en-IN")}`}
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
              <StatCard
                title="Total Shipments"
                value={data.totalShipmentsSent + data.totalShipmentsReceived}
                icon={Package}
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
                      dataKey="sent"
                      name="Sent"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="received"
                      name="Received"
                      stroke="hsl(var(--chart-2))"
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
