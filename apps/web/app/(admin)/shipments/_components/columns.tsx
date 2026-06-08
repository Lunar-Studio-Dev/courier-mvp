"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Eye, RefreshCw } from "lucide-react";

export type Shipment = {
  id: string;
  trackingNumber: string;
  senderAddress: { fullName: string; city: string; state: string };
  receiverAddress: { fullName: string; city: string; state: string };
  originCity: string | null;
  deliveryCity: string | null;
  status: string;
  totalAmount: string;
  bookedAt: string | null;
};

type ColumnActions = {
  onUpdateStatus: (item: Shipment) => void;
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  BOOKED: "outline",
  PICKED_UP: "secondary",
  IN_TRANSIT: "default",
  OUT_FOR_DELIVERY: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
  RETURNED: "destructive",
  ON_HOLD: "secondary",
};

function formatINR(value: string) {
  return `₹${parseFloat(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export function getColumns(actions: ColumnActions): ColumnDef<Shipment>[] {
  return [
    {
      accessorKey: "trackingNumber",
      header: "Tracking #",
      cell: ({ row }) => (
        <Link href={`/shipments/${row.original.id}`} className="font-mono text-sm text-primary hover:underline">
          {row.original.trackingNumber}
        </Link>
      ),
    },
    {
      id: "sender",
      header: "Sender",
      cell: ({ row }) => row.original.senderAddress.fullName,
    },
    {
      id: "receiver",
      header: "Receiver",
      cell: ({ row }) => row.original.receiverAddress.fullName,
    },
    {
      id: "route",
      header: "Route",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.originCity ?? row.original.senderAddress.city} → {row.original.deliveryCity ?? row.original.receiverAddress.city}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusColors[row.original.status] ?? "outline"}>
          {row.original.status.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Amount",
      cell: ({ row }) => formatINR(row.original.totalAmount),
    },
    {
      accessorKey: "bookedAt",
      header: "Booked",
      cell: ({ row }) =>
        row.original.bookedAt
          ? new Date(row.original.bookedAt).toLocaleDateString("en-IN")
          : "-",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const terminal = ["DELIVERED", "CANCELLED", "RETURNED"].includes(row.original.status);
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/shipments/${row.original.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            {!terminal && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => actions.onUpdateStatus(row.original)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];
}
