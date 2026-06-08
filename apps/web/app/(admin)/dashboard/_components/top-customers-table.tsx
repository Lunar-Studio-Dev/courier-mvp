"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

interface TopCustomersTableProps {
  data: { customerName: string; shipmentCount: number; revenue: string }[] | undefined;
  isLoading: boolean;
}

export function TopCustomersTable({ data, isLoading }: TopCustomersTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Top Customers</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-3 text-left font-medium text-muted-foreground w-8">#</th>
                  <th className="py-2 pr-3 text-left font-medium text-muted-foreground">Customer</th>
                  <th className="py-2 pr-3 text-right font-medium text-muted-foreground">Shipments</th>
                  <th className="py-2 text-right font-medium text-muted-foreground">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-3 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 pr-3 font-medium">{c.customerName}</td>
                    <td className="py-2 pr-3 text-right">{c.shipmentCount}</td>
                    <td className="py-2 text-right font-mono">
                      {parseFloat(c.revenue).toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
