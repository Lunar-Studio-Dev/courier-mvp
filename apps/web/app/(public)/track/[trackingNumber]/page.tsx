"use client";

import { use } from "react";
import Link from "next/link";
import { trpc } from "~/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { MapPin, Clock, ArrowRight, Search, CheckCircle2, Circle } from "lucide-react";

const ALL_STATUSES = [
  "BOOKED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

function formatDate(date: string | Date | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export default function TrackingPage({
  params,
}: {
  params: Promise<{ trackingNumber: string }>;
}) {
  const { trackingNumber } = use(params);

  const { data, isLoading, error } = trpc.shipments.track.useQuery(
    { trackingNumber },
    { retry: false },
  );

  const isTerminal = data
    ? ["CANCELLED", "RETURNED"].includes(data.status)
    : false;

  // Build the expected steps timeline
  const completedStatuses = data
    ? data.history.map((h) => h.status)
    : [];

  const currentStatusIndex = data
    ? ALL_STATUSES.indexOf(data.status)
    : -1;

  // For cancelled/returned, find the last matching normal status
  const historyByStatus = data
    ? Object.fromEntries(
        data.history.map((h) => [h.status, h]),
      )
    : {};

  return (
    <main className="flex-1 bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-semibold mb-6">Shipment Tracking</h1>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-lg font-medium">Shipment Not Found</p>
              <p className="text-sm text-muted-foreground mt-1">
                No shipment found with tracking number:{" "}
                <span className="font-mono">{trackingNumber}</span>
              </p>
              <Link href="/track" className="mt-4 inline-block">
                <Button variant="outline" size="sm">
                  <Search className="mr-2 h-4 w-4" /> Try Another
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {data && (
          <div className="space-y-4">
            {/* Shipment Summary */}
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Tracking Number
                    </p>
                    <p className="font-mono text-lg font-semibold">
                      {data.trackingNumber}
                    </p>
                  </div>
                  <Badge
                    variant={
                      data.status === "DELIVERED"
                        ? "default"
                        : data.status === "CANCELLED" ||
                            data.status === "RETURNED"
                          ? "destructive"
                          : "outline"
                    }
                    className="text-sm px-3 py-1"
                  >
                    {statusLabel(data.status)}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>
                    {data.senderCity}, {data.senderState}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  <span>
                    {data.receiverCity}, {data.receiverState}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Booked:{" "}
                    {formatDate(data.bookedAt)}
                  </span>
                  {data.deliveredAt && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Delivered:{" "}
                      {formatDate(data.deliveredAt)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status Progress (non-terminal shipments) */}
            {!isTerminal && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Delivery Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    {ALL_STATUSES.map((status, i) => {
                      const isCompleted =
                        i <= currentStatusIndex &&
                        completedStatuses.includes(status);
                      const isCurrent = i === currentStatusIndex;
                      const isFuture = i > currentStatusIndex;
                      return (
                        <div
                          key={status}
                          className="flex flex-col items-center flex-1"
                        >
                          <div className="relative flex items-center w-full justify-center">
                            {/* Connector line before */}
                            {i > 0 && (
                              <div
                                className={`absolute right-1/2 h-0.5 w-full ${
                                  i <= currentStatusIndex
                                    ? "bg-primary"
                                    : "bg-border"
                                }`}
                              />
                            )}
                            {/* Dot */}
                            <div
                              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ${
                                isCompleted && !isCurrent
                                  ? "bg-primary text-primary-foreground"
                                  : isCurrent
                                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                                    : "bg-muted border-2 border-border"
                              }`}
                            >
                              {isCompleted && !isCurrent ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : isCurrent ? (
                                <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                              ) : (
                                <Circle className="h-3 w-3 text-muted-foreground/40" />
                              )}
                            </div>
                          </div>
                          <span
                            className={`mt-2 text-[10px] sm:text-xs text-center leading-tight ${
                              isFuture
                                ? "text-muted-foreground/40"
                                : "text-foreground font-medium"
                            }`}
                          >
                            {statusLabel(status)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Terminal status banner */}
            {isTerminal && (
              <Card className="border-destructive/50">
                <CardContent className="py-4 text-center">
                  <Badge variant="destructive" className="text-sm px-3 py-1">
                    {statusLabel(data.status)}
                  </Badge>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This shipment has been{" "}
                    {data.status === "CANCELLED" ? "cancelled" : "returned"}.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Tracking History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tracking History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {data.history.map((entry, i) => {
                    const isFirst = i === 0;
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                              isFirst
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted border border-border"
                            }`}
                          >
                            {isFirst ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Circle className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          {i < data.history.length - 1 && (
                            <div className="w-px flex-1 bg-border min-h-6" />
                          )}
                        </div>
                        <div className="pb-5 -mt-0.5">
                          <p
                            className={`text-sm ${isFirst ? "font-semibold" : "font-medium"}`}
                          >
                            {statusLabel(entry.status)}
                          </p>
                          {entry.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" /> {entry.location}
                            </p>
                          )}
                          {entry.remarks && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {entry.remarks}
                            </p>
                          )}
                          {entry.timestamp && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />{" "}
                              {formatDate(entry.timestamp)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Track another */}
            <div className="text-center pt-2">
              <Link href="/track">
                <Button variant="outline" size="sm">
                  <Search className="mr-2 h-4 w-4" /> Track Another Shipment
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
