"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";

interface ActivityEntry {
  id: string;
  trackingNumber: string;
  status: string;
  location: string | null;
  remarks: string | null;
  timestamp: Date | string | null;
}

interface RecentActivityFeedProps {
  data: ActivityEntry[] | undefined;
  isLoading: boolean;
}

function statusVariant(status: string) {
  if (status === "DELIVERED") return "default" as const;
  if (status === "CANCELLED" || status === "RETURNED") return "destructive" as const;
  return "outline" as const;
}

export function RecentActivityFeed({ data, isLoading }: RecentActivityFeedProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <span className="text-xs text-muted-foreground">Auto-refreshes every 30s</span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-3 text-left font-medium text-muted-foreground">Time</th>
                  <th className="py-2 pr-3 text-left font-medium text-muted-foreground">Tracking #</th>
                  <th className="py-2 pr-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="py-2 pr-3 text-left font-medium text-muted-foreground">Location</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground text-xs">
                      {entry.timestamp
                        ? new Date(entry.timestamp).toLocaleString("en-IN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "-"}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">{entry.trackingNumber}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={statusVariant(entry.status)} className="text-xs">
                        {entry.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 text-xs">{entry.location ?? "-"}</td>
                    <td className="py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                      {entry.remarks ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
            No recent activity
          </div>
        )}
      </CardContent>
    </Card>
  );
}
