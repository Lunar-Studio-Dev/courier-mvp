"use client";

import { useState, useEffect } from "react";
import { trpc } from "~/trpc/client";
import { Label } from "~/components/ui/label";
import { X } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  ComboboxWithCreate,
  type ComboboxItem,
} from "~/components/shared/combobox-with-create";
import { CreateCustomerModal } from "./create-customer-modal";

interface CustomerSelectProps {
  label: string;
  value: string;
  onChange: (customerId: string) => void;
  selectedCustomer: {
    id: string;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
  onCustomerLoaded: (customer: {
    id: string;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  } | null) => void;
}

export function CustomerSelect({
  label,
  value,
  onChange,
  selectedCustomer,
  onCustomerLoaded,
}: CustomerSelectProps) {
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: results } = trpc.customers.search.useQuery({ query });

  const { data: customerDetail } = trpc.customers.getById.useQuery(
    { id: value },
    { enabled: !!value && !selectedCustomer },
  );

  useEffect(() => {
    if (customerDetail && !selectedCustomer) {
      onCustomerLoaded(customerDetail as any);
    }
  }, [customerDetail, selectedCustomer, onCustomerLoaded]);

  const items: ComboboxItem[] = (results ?? []).map((c) => ({
    value: c.id,
    label: c.fullName,
    sublabel: c.phone,
  }));

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <ComboboxWithCreate
        items={items}
        value={value}
        onChange={(id) => {
          if (!id) {
            onChange("");
            onCustomerLoaded(null);
          } else {
            onChange(id);
          }
        }}
        onSearch={setQuery}
        onAddNew={() => setShowCreate(true)}
        placeholder="Search customer..."
        searchPlaceholder="Search by name or phone..."
        emptyMessage="No customers found."
        addNewLabel="Add New Customer"
      />

      {selectedCustomer && (
        <div className="rounded-lg border p-3 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-medium">{selectedCustomer.fullName}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                onChange("");
                onCustomerLoaded(null);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-muted-foreground">{selectedCustomer.phone}</p>
          <p className="text-muted-foreground">
            {selectedCustomer.address}, {selectedCustomer.city},{" "}
            {selectedCustomer.state} - {selectedCustomer.pincode}
          </p>
        </div>
      )}

      <CreateCustomerModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={(id) => onChange(id)}
      />
    </div>
  );
}
