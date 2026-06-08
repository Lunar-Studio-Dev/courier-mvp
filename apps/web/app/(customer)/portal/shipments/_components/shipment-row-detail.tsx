"use client";

import { trpc } from "~/trpc/client";
import { Skeleton } from "~/components/ui/skeleton";
import { CheckCircle2, Circle, Clock, MapPin } from "lucide-react";

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

interface ShipmentRowDetailProps {
  trackingNumber: string;
}

export function ShipmentRowDetail({ trackingNumber }: ShipmentRowDetailProps) {
  const { data, isLoading } = trpc.shipments.track.useQuery(
    { trackingNumber },
    { retry: false },
  );

  if (isLoading) {
    return (
      <div className="px-4 py-3">
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const currentStatusIndex = ALL_STATUSES.indexOf(data.status);
  const isTerminal = ["CANCELLED", "RETURNED"].includes(data.status);

  return (
    <div className="px-4 py-3 bg-muted/30 border-t">
      {!isTerminal ? (
        <div className="flex items-center justify-between">
          {ALL_STATUSES.map((status, i) => {
            const isDone = i <= currentStatusIndex;
            const isCurrent = i === currentStatusIndex;
            return (
              <div key={status} className="flex flex-col items-center flex-1">
                <div className="relative flex items-center w-full justify-center">
                  {i > 0 && (
                    <div
                      className={`absolute right-1/2 h-0.5 w-full ${
                        i <= currentStatusIndex ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                  <div
                    className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full ${
                      isDone
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border border-border"
                    } ${isCurrent ? "ring-2 ring-primary/20" : ""}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Circle className="h-2.5 w-2.5 text-muted-foreground/40" />
                    )}
                  </div>
                </div>
                <span
                  className={`mt-1.5 text-[9px] sm:text-[10px] text-center leading-tight ${
                    isDone ? "text-foreground font-medium" : "text-muted-foreground/50"
                  }`}
                >
                  {statusLabel(status)}
                </span>
                {data.history.find((h) => h.status === status)?.timestamp && (
                  <span className="text-[8px] text-muted-foreground">
                    {new Date(
                      data.history.find((h) => h.status === status)!.timestamp!,
                    ).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-sm text-muted-foreground">
          Shipment {data.status === "CANCELLED" ? "cancelled" : "returned"}
        </div>
      )}
    </div>
  );
}
