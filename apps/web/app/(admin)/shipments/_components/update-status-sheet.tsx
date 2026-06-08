"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Loader2 } from "lucide-react";

const VALID_TRANSITIONS: Record<string, string[]> = {
  BOOKED: ["PICKED_UP", "CANCELLED", "ON_HOLD"],
  PICKED_UP: ["IN_TRANSIT", "CANCELLED", "ON_HOLD"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "RETURNED", "ON_HOLD"],
  OUT_FOR_DELIVERY: ["DELIVERED", "RETURNED", "ON_HOLD"],
  ON_HOLD: ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "CANCELLED"],
};

interface UpdateStatusSheetProps {
  shipment: { id: string; trackingNumber: string; status: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UpdateStatusSheet({ shipment, open, onOpenChange, onSuccess }: UpdateStatusSheetProps) {
  const [newStatus, setNewStatus] = useState("");
  const [location, setLocation] = useState("");
  const [remarks, setRemarks] = useState("");

  const mutation = trpc.shipments.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      setNewStatus("");
      setLocation("");
      setRemarks("");
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!shipment) return null;

  const allowedStatuses = VALID_TRANSITIONS[shipment.status] ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Update Status</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div>
            <Label className="text-muted-foreground">Tracking #</Label>
            <p className="font-mono">{shipment.trackingNumber}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Current Status</Label>
            <div className="mt-1"><Badge variant="outline">{shipment.status.replace(/_/g, " ")}</Badge></div>
          </div>
          <div className="space-y-2">
            <Label>New Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {allowedStatuses.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Location (optional)</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Mumbai Hub" />
          </div>
          <div className="space-y-2">
            <Label>Remarks (optional)</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any notes..." />
          </div>
          <Button
            className="w-full"
            disabled={!newStatus || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                id: shipment.id,
                status: newStatus as any,
                location: location || undefined,
                remarks: remarks || undefined,
              })
            }
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
