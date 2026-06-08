"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";

const EVENT_LABELS: Record<string, string> = {
  SHIPMENT_BOOKED: "Shipment Booked",
  STATUS_UPDATE: "Status Update",
  DELIVERED: "Delivered",
};

export function NotificationToastListener() {
  const sinceRef = useRef(new Date().toISOString());
  const seenIds = useRef(new Set<string>());

  const { data } = trpc.notifications.recentEvents.useQuery(
    { since: sinceRef.current },
    { refetchInterval: 5000 },
  );

  useEffect(() => {
    if (!data || data.length === 0) return;

    for (const event of data) {
      if (seenIds.current.has(event.id)) continue;
      seenIds.current.add(event.id);

      const label = EVENT_LABELS[event.eventType] ?? event.eventType;

      if (event.status === "SENT") {
        toast.success(`${label}`, {
          description: `${event.channel.toUpperCase()} to ${event.recipient}`,
        });
      } else {
        toast.error(`${label} Failed`, {
          description: event.error ?? `${event.channel} to ${event.recipient}`,
        });
      }
    }
  }, [data]);

  return null;
}
