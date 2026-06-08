"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { PageHeader } from "~/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Loader2, ArrowLeft } from "lucide-react";
import { CustomerSelect } from "./_components/customer-select";
import { PriceCalculator } from "./_components/price-calculator";
import Link from "next/link";

type CustomerInfo = {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

export default function NewShipmentPage() {
  const router = useRouter();

  const [senderId, setSenderId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [senderInfo, setSenderInfo] = useState<CustomerInfo | null>(null);
  const [receiverInfo, setReceiverInfo] = useState<CustomerInfo | null>(null);

  const [branchId, setBranchId] = useState("");
  const [productTypeId, setProductTypeId] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [modeTypeId, setModeTypeId] = useState("");
  const [weight, setWeight] = useState("");
  const [declaredValue, setDeclaredValue] = useState("");
  const [gstEnabled, setGstEnabled] = useState(true);

  const { data: branches } = trpc.branches.list.useQuery({ limit: 100 });
  const { data: productTypes } = trpc.productTypes.list.useQuery({ limit: 100 });
  const { data: serviceTypes } = trpc.serviceTypes.list.useQuery({ limit: 100 });
  const { data: modeTypes } = trpc.modeTypes.list.useQuery({ limit: 100 });

  const createMutation = trpc.shipments.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Shipment created: ${data.trackingNumber}`);
      router.push(`/shipments/${data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const canSubmit = senderId && receiverId && branchId && productTypeId && serviceTypeId && modeTypeId && weight && declaredValue;

  function handleSubmit() {
    if (!canSubmit) return;
    createMutation.mutate({
      branchId,
      senderId,
      receiverId,
      productTypeId,
      serviceTypeId,
      modeTypeId,
      weight,
      declaredValue,
      gstEnabled,
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/shipments"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageHeader title="Create Shipment" description="Book a new shipment." />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Sender</CardTitle></CardHeader>
          <CardContent>
            <CustomerSelect
              label="Select Sender"
              value={senderId}
              onChange={setSenderId}
              selectedCustomer={senderInfo}
              onCustomerLoaded={setSenderInfo}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Receiver</CardTitle></CardHeader>
          <CardContent>
            <CustomerSelect
              label="Select Receiver"
              value={receiverId}
              onChange={setReceiverId}
              selectedCustomer={receiverInfo}
              onCustomerLoaded={setReceiverInfo}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Shipment Details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Branch</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>
                {branches?.data?.filter((b) => b.isActive).map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name} ({b.city})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Product Type</Label>
            <Select value={productTypeId} onValueChange={setProductTypeId}>
              <SelectTrigger><SelectValue placeholder="Select product type" /></SelectTrigger>
              <SelectContent>
                {productTypes?.data?.filter((p) => p.isActive).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Service Type</Label>
            <Select value={serviceTypeId} onValueChange={setServiceTypeId}>
              <SelectTrigger><SelectValue placeholder="Select service type" /></SelectTrigger>
              <SelectContent>
                {serviceTypes?.data?.filter((s) => s.isActive).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mode Type</Label>
            <Select value={modeTypeId} onValueChange={setModeTypeId}>
              <SelectTrigger><SelectValue placeholder="Select mode type" /></SelectTrigger>
              <SelectContent>
                {modeTypes?.data?.filter((m) => m.isActive).map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Weight (kg)</Label>
            <Input
              type="number"
              step="0.001"
              min="0.001"
              placeholder="e.g. 2.500"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Declared Value (₹)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 5000.00"
              value={declaredValue}
              onChange={(e) => setDeclaredValue(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
            <Label className="cursor-pointer">GST Enabled</Label>
            <Switch checked={gstEnabled} onCheckedChange={setGstEnabled} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <PriceCalculator
          originState={senderInfo?.state ?? ""}
          originCity={senderInfo?.city ?? ""}
          destinationState={receiverInfo?.state ?? ""}
          destinationCity={receiverInfo?.city ?? ""}
          productTypeId={productTypeId}
          serviceTypeId={serviceTypeId}
          modeTypeId={modeTypeId}
          weight={weight}
          gstEnabled={gstEnabled}
        />

        <Card>
          <CardHeader><CardTitle className="text-base">Confirm Booking</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review all details above before booking. A tracking number will be generated automatically.
            </p>
            <Separator />
            <Button
              className="w-full"
              size="lg"
              disabled={!canSubmit || createMutation.isPending}
              onClick={handleSubmit}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Book Shipment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
