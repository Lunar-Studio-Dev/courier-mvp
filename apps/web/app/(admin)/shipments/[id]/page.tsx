"use client";

import { use, useState } from "react";
import Link from "next/link";
import { trpc } from "~/trpc/client";
import { PageHeader } from "~/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { ArrowLeft, RefreshCw, MapPin, Clock } from "lucide-react";
import { UpdateStatusSheet } from "../_components/update-status-sheet";
import { ExportDropdown } from "~/components/invoice/export-dropdown";

function formatINR(value: string) {
  return `₹${parseFloat(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function formatDate(date: string | Date | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type Address = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

export default function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [statusOpen, setStatusOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: shipment, isLoading } = trpc.shipments.getById.useQuery({ id });

  const { data: tracking } = trpc.shipments.track.useQuery(
    { trackingNumber: shipment?.trackingNumber ?? "" },
    { enabled: !!shipment?.trackingNumber },
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Shipment not found.</p>
      </div>
    );
  }

  const sAddr = shipment.senderAddress as Address;
  const rAddr = shipment.receiverAddress as Address;
  const terminal = ["DELIVERED", "CANCELLED", "RETURNED"].includes(shipment.status);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/shipments"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageHeader
          title={shipment.trackingNumber}
          description={`Booked ${formatDate(shipment.bookedAt)}`}
          actions={
            <div className="flex gap-2">
              <ExportDropdown shipmentId={id} />
              {!terminal && (
                <Button onClick={() => setStatusOpen(true)}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Update Status
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div className="flex items-center gap-3">
        <Badge
          variant={shipment.status === "DELIVERED" ? "default" : shipment.status === "CANCELLED" || shipment.status === "RETURNED" ? "destructive" : "outline"}
          className="text-sm px-3 py-1"
        >
          {shipment.status.replace(/_/g, " ")}
        </Badge>
        {shipment.deliveredAt && (
          <span className="text-sm text-muted-foreground">
            Delivered {formatDate(shipment.deliveredAt)}
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Shipment Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Tracking #</span><span className="font-mono">{shipment.trackingNumber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Branch</span><span>{shipment.branchName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span>{shipment.productTypeName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span>{shipment.serviceTypeName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Mode</span><span>{shipment.modeTypeName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Weight</span><span>{shipment.weight} kg</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Declared Value</span><span>{formatINR(shipment.declaredValue)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Price Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Base Price</span><span>{formatINR(shipment.basePrice)}</span></div>
            {shipment.gstEnabled && (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">GST Type</span><span>{shipment.gstType}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">GST Rate</span><span>{shipment.gstRate}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">GST Amount</span><span>{formatINR(shipment.gstAmount ?? "0")}</span></div>
              </>
            )}
            <Separator />
            <div className="flex justify-between font-semibold"><span>Total</span><span>{formatINR(shipment.totalAmount)}</span></div>
          </CardContent>
        </Card>
      </div>

      {(shipment.originCity || shipment.deliveryCity) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Route</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-3 text-sm">
            <div>
              <p className="font-medium">{shipment.originCity}, {shipment.originState}</p>
              {shipment.originPincode && <p className="text-muted-foreground">{shipment.originPincode}</p>}
            </div>
            <span className="text-muted-foreground">→</span>
            <div>
              <p className="font-medium">{shipment.deliveryCity}, {shipment.deliveryState}</p>
              {shipment.deliveryPincode && <p className="text-muted-foreground">{shipment.deliveryPincode}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Sender</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{sAddr.fullName}</p>
            <p className="text-muted-foreground">{sAddr.phone}</p>
            <p className="text-muted-foreground">{sAddr.address}</p>
            <p className="text-muted-foreground">{sAddr.city}, {sAddr.state} - {sAddr.pincode}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Receiver</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{rAddr.fullName}</p>
            <p className="text-muted-foreground">{rAddr.phone}</p>
            <p className="text-muted-foreground">{rAddr.address}</p>
            <p className="text-muted-foreground">{rAddr.city}, {rAddr.state} - {rAddr.pincode}</p>
          </CardContent>
        </Card>
      </div>

      {tracking && tracking.history.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Tracking Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tracking.history.map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full ${i === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                    {i < tracking.history.length - 1 && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-sm">{entry.status.replace(/_/g, " ")}</p>
                    {entry.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {entry.location}
                      </p>
                    )}
                    {entry.remarks && (
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.remarks}</p>
                    )}
                    {entry.timestamp && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> {formatDate(entry.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <UpdateStatusSheet
        shipment={statusOpen ? shipment : null}
        open={statusOpen}
        onOpenChange={setStatusOpen}
        onSuccess={() => {
          setStatusOpen(false);
          utils.shipments.getById.invalidate({ id });
          utils.shipments.track.invalidate({ trackingNumber: shipment.trackingNumber });
        }}
      />
    </div>
  );
}
