"use client";

import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { trpc } from "~/trpc/client";
import { ShipmentRowDetail } from "./_components/shipment-row-detail";

function formatDate(date: string | Date | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function statusVariant(status: string) {
  switch (status) {
    case "DELIVERED":
      return "default" as const;
    case "CANCELLED":
    case "RETURNED":
      return "destructive" as const;
    case "IN_TRANSIT":
    case "OUT_FOR_DELIVERY":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
}

export default function CustomerShipmentsPage() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 20;

  const { data, isLoading } = trpc.customerPortal.myShipments.useQuery({
    role: roleFilter as "all" | "sender" | "receiver",
    status: statusFilter === "all" ? undefined : (statusFilter as any),
    page,
    limit,
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-1">My Shipments</h1>
      <p className="text-muted-foreground text-sm mb-6">
        View all your shipments and their current status.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="sender">Sent</SelectItem>
            <SelectItem value="receiver">Received</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="BOOKED">Booked</SelectItem>
            <SelectItem value="PICKED_UP">Picked Up</SelectItem>
            <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
            <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="RETURNED">Returned</SelectItem>
          </SelectContent>
        </Select>

        {data && (
          <span className="text-xs text-muted-foreground ml-auto">
            {data.total} shipment{data.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {data && data.data.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No shipments found.</p>
          </CardContent>
        </Card>
      )}

      {data && data.data.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium w-8" />
                <th className="text-left px-4 py-3 font-medium">Tracking #</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">
                  Date
                </th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                  Route
                </th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((shipment) => {
                const isExpanded = expandedId === shipment.id;
                return (
                  <tr key={shipment.id} className="group">
                    <td colSpan={6} className="p-0">
                      <div
                        className="flex items-center cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : shipment.id)
                        }
                      >
                        <div className="px-4 py-3 w-8">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="px-4 py-3 font-mono text-xs flex-1 min-w-0">
                          {shipment.trackingNumber}
                          <span className="ml-2 text-muted-foreground text-[10px]">
                            {shipment.isSender ? "(sent)" : "(received)"}
                          </span>
                        </div>
                        <div className="px-4 py-3 hidden sm:table-cell text-muted-foreground whitespace-nowrap">
                          {formatDate(shipment.bookedAt)}
                        </div>
                        <div className="px-4 py-3 hidden md:flex items-center gap-1 text-muted-foreground whitespace-nowrap">
                          {shipment.senderCity}
                          <ArrowRight className="h-3 w-3" />
                          {shipment.receiverCity}
                        </div>
                        <div className="px-4 py-3">
                          <Badge variant={statusVariant(shipment.status)} className="text-xs">
                            {statusLabel(shipment.status)}
                          </Badge>
                        </div>
                        <div className="px-4 py-3 text-right hidden sm:block whitespace-nowrap">
                          ₹{parseFloat(shipment.totalAmount).toLocaleString("en-IN")}
                        </div>
                      </div>
                      {isExpanded && (
                        <ShipmentRowDetail
                          trackingNumber={shipment.trackingNumber}
                        />
                      )}
                      <div className="border-b" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
