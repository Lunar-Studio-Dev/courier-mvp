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
import { Separator } from "~/components/ui/separator";
import { Loader2, ArrowLeft } from "lucide-react";
import { CustomerSelect } from "./_components/customer-select";
import { PriceCalculator } from "./_components/price-calculator";
import {
  ComboboxWithCreate,
  type ComboboxItem,
} from "~/components/shared/combobox-with-create";
import { CreateBranchModal } from "./_components/create-branch-modal";
import { CreateSimpleTypeModal } from "./_components/create-simple-type-modal";
import { CreateDestinationModal } from "./_components/create-destination-modal";
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

  const [originDestinationId, setOriginDestinationId] = useState("");
  const [deliveryDestinationId, setDeliveryDestinationId] = useState("");

  const [branchId, setBranchId] = useState("");
  const [productTypeId, setProductTypeId] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [modeTypeId, setModeTypeId] = useState("");
  const [weight, setWeight] = useState("");
  const [declaredValue, setDeclaredValue] = useState("");
  const [gstEnabled, setGstEnabled] = useState(true);

  // Modal states
  const [showOriginDestModal, setShowOriginDestModal] = useState(false);
  const [showDeliveryDestModal, setShowDeliveryDestModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [simpleTypeModal, setSimpleTypeModal] = useState<{
    open: boolean;
    type: "productType" | "serviceType" | "modeType";
  }>({ open: false, type: "productType" });

  const [originSearch, setOriginSearch] = useState("");
  const [deliverySearch, setDeliverySearch] = useState("");
  const { data: originDestinations } = trpc.destinations.search.useQuery(
    { query: originSearch },
    { placeholderData: (prev) => prev },
  );
  const { data: deliveryDestinations } = trpc.destinations.search.useQuery(
    { query: deliverySearch },
    { placeholderData: (prev) => prev },
  );

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

  const canSubmit =
    senderId &&
    receiverId &&
    originDestinationId &&
    deliveryDestinationId &&
    branchId &&
    productTypeId &&
    serviceTypeId &&
    modeTypeId &&
    weight &&
    declaredValue;

  function handleSubmit() {
    if (!canSubmit) return;
    createMutation.mutate({
      branchId,
      senderId,
      receiverId,
      originDestinationId,
      deliveryDestinationId,
      productTypeId,
      serviceTypeId,
      modeTypeId,
      weight,
      declaredValue,
      gstEnabled,
    });
  }

  // Build combobox items
  const originDestItems: ComboboxItem[] =
    originDestinations?.map((d) => ({
      value: d.id,
      label: `${d.city}, ${d.state}`,
      sublabel: d.pincode,
    })) ?? [];

  const deliveryDestItems: ComboboxItem[] =
    deliveryDestinations?.map((d) => ({
      value: d.id,
      label: `${d.city}, ${d.state}`,
      sublabel: d.pincode,
    })) ?? [];

  // Find selected destination info for price calculator
  const selectedOriginDest = originDestinations?.find(
    (d) => d.id === originDestinationId,
  );
  const selectedDeliveryDest = deliveryDestinations?.find(
    (d) => d.id === deliveryDestinationId,
  );

  const branchItems: ComboboxItem[] =
    branches?.data
      ?.filter((b) => b.isActive)
      .map((b) => ({
        value: b.id,
        label: b.name,
        sublabel: b.city,
      })) ?? [];

  const productTypeItems: ComboboxItem[] =
    productTypes?.data
      ?.filter((p) => p.isActive)
      .map((p) => ({ value: p.id, label: p.name })) ?? [];

  const serviceTypeItems: ComboboxItem[] =
    serviceTypes?.data
      ?.filter((s) => s.isActive)
      .map((s) => ({ value: s.id, label: s.name })) ?? [];

  const modeTypeItems: ComboboxItem[] =
    modeTypes?.data
      ?.filter((m) => m.isActive)
      .map((m) => ({ value: m.id, label: m.name })) ?? [];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/shipments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader title="Create Shipment" description="Book a new shipment." />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sender</CardTitle>
          </CardHeader>
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
          <CardHeader>
            <CardTitle className="text-base">Receiver</CardTitle>
          </CardHeader>
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
        <CardHeader>
          <CardTitle className="text-base">Route</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>From (Origin)</Label>
            <ComboboxWithCreate
              items={originDestItems}
              value={originDestinationId}
              onChange={setOriginDestinationId}
              onSearch={setOriginSearch}
              placeholder="Select origin"
              searchPlaceholder="Search city, state, or pincode..."
              addNewLabel="Add New Destination"
              onAddNew={() => setShowOriginDestModal(true)}
            />
          </div>
          <div className="space-y-2">
            <Label>To (Destination)</Label>
            <ComboboxWithCreate
              items={deliveryDestItems}
              value={deliveryDestinationId}
              onChange={setDeliveryDestinationId}
              onSearch={setDeliverySearch}
              placeholder="Select destination"
              searchPlaceholder="Search city, state, or pincode..."
              addNewLabel="Add New Destination"
              onAddNew={() => setShowDeliveryDestModal(true)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shipment Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Branch</Label>
            <ComboboxWithCreate
              items={branchItems}
              value={branchId}
              onChange={setBranchId}
              placeholder="Select branch"
              searchPlaceholder="Search branches..."
              addNewLabel="Add New Branch"
              onAddNew={() => setShowBranchModal(true)}
            />
          </div>
          <div className="space-y-2">
            <Label>Product Type</Label>
            <ComboboxWithCreate
              items={productTypeItems}
              value={productTypeId}
              onChange={setProductTypeId}
              placeholder="Select product type"
              searchPlaceholder="Search product types..."
              addNewLabel="Add New Product Type"
              onAddNew={() =>
                setSimpleTypeModal({ open: true, type: "productType" })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Service Type</Label>
            <ComboboxWithCreate
              items={serviceTypeItems}
              value={serviceTypeId}
              onChange={setServiceTypeId}
              placeholder="Select service type"
              searchPlaceholder="Search service types..."
              addNewLabel="Add New Service Type"
              onAddNew={() =>
                setSimpleTypeModal({ open: true, type: "serviceType" })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Mode Type</Label>
            <ComboboxWithCreate
              items={modeTypeItems}
              value={modeTypeId}
              onChange={setModeTypeId}
              placeholder="Select mode type"
              searchPlaceholder="Search mode types..."
              addNewLabel="Add New Mode Type"
              onAddNew={() =>
                setSimpleTypeModal({ open: true, type: "modeType" })
              }
            />
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
          originState={selectedOriginDest?.state ?? ""}
          originCity={selectedOriginDest?.city ?? ""}
          destinationState={selectedDeliveryDest?.state ?? ""}
          destinationCity={selectedDeliveryDest?.city ?? ""}
          productTypeId={productTypeId}
          serviceTypeId={serviceTypeId}
          modeTypeId={modeTypeId}
          weight={weight}
          gstEnabled={gstEnabled}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confirm Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review all details above before booking. A tracking number will be
              generated automatically.
            </p>
            <Separator />
            <Button
              className="w-full"
              size="lg"
              disabled={!canSubmit || createMutation.isPending}
              onClick={handleSubmit}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Book Shipment
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Inline creation modals */}
      <CreateDestinationModal
        open={showOriginDestModal}
        onOpenChange={setShowOriginDestModal}
        onCreated={setOriginDestinationId}
      />
      <CreateDestinationModal
        open={showDeliveryDestModal}
        onOpenChange={setShowDeliveryDestModal}
        onCreated={setDeliveryDestinationId}
      />
      <CreateBranchModal
        open={showBranchModal}
        onOpenChange={setShowBranchModal}
        onCreated={setBranchId}
      />
      <CreateSimpleTypeModal
        open={simpleTypeModal.open}
        onOpenChange={(open) =>
          setSimpleTypeModal((prev) => ({ ...prev, open }))
        }
        entityType={simpleTypeModal.type}
        onCreated={(id) => {
          switch (simpleTypeModal.type) {
            case "productType":
              setProductTypeId(id);
              break;
            case "serviceType":
              setServiceTypeId(id);
              break;
            case "modeType":
              setModeTypeId(id);
              break;
          }
        }}
      />
    </div>
  );
}
