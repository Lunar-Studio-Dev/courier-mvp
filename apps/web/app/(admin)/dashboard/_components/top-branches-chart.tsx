"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

interface TopBranchesChartProps {
  data: { branchName: string; shipmentCount: number }[] | undefined;
  isLoading: boolean;
}

export function TopBranchesChart({ data, isLoading }: TopBranchesChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Top Branches</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="branchName"
                tick={{ fontSize: 12 }}
                width={120}
              />
              <Tooltip />
              <Bar
                dataKey="shipmentCount"
                name="Shipments"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
