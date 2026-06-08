"use client";

import { useState } from "react";
import { trpc } from "~/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function EventLogTable() {
  const [channel, setChannel] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = trpc.notifications.getEventLog.useQuery({
    channel: channel !== "all" ? (channel as "email" | "sms" | "whatsapp") : undefined,
    status: status !== "all" ? (status as "SENT" | "FAILED") : undefined,
    page,
    limit,
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Notification Event Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Select value={channel} onValueChange={(v) => { setChannel(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {data && data.data.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No notification events found.
          </p>
        )}

        {data && data.data.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Time</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Channel</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Provider</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Recipient</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Event</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="py-2 font-medium text-muted-foreground">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((event) => (
                    <tr key={event.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                        {event.sentAt
                          ? new Date(event.sentAt).toLocaleString("en-IN", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "-"}
                      </td>
                      <td className="py-2 pr-4 capitalize">{event.channel}</td>
                      <td className="py-2 pr-4">{event.provider}</td>
                      <td className="py-2 pr-4 font-mono text-xs max-w-[200px] truncate">
                        {event.recipient}
                      </td>
                      <td className="py-2 pr-4 text-xs">
                        {event.eventType.replace(/_/g, " ")}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge
                          variant={event.status === "SENT" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {event.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                        {event.error ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({data.total} total)
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
