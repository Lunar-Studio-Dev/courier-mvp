"use client";

import { useState, useEffect } from "react";
import { trpc } from "~/trpc/client";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import { Check, ChevronsUpDown, X } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: results } = trpc.customers.search.useQuery(
    { query },
    { enabled: query.length >= 1 },
  );

  const { data: customerDetail } = trpc.customers.getById.useQuery(
    { id: value },
    { enabled: !!value && !selectedCustomer },
  );

  useEffect(() => {
    if (customerDetail && !selectedCustomer) {
      onCustomerLoaded(customerDetail as any);
    }
  }, [customerDetail, selectedCustomer, onCustomerLoaded]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between">
            {selectedCustomer ? (
              <span>{selectedCustomer.fullName} ({selectedCustomer.phone})</span>
            ) : (
              <span className="text-muted-foreground">Search customer...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Input
                placeholder="Search by name or phone..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 px-0"
              />
            </div>
            <CommandList>
              <CommandEmpty>No customers found.</CommandEmpty>
              <CommandGroup>
                {results?.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.id}
                    onSelect={() => {
                      onChange(c.id);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <Check className={`mr-2 h-4 w-4 ${value === c.id ? "opacity-100" : "opacity-0"}`} />
                    <div>
                      <div className="font-medium">{c.fullName}</div>
                      <div className="text-xs text-muted-foreground">{c.phone}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCustomer && (
        <div className="rounded-lg border p-3 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-medium">{selectedCustomer.fullName}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => { onChange(""); onCustomerLoaded(null); }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-muted-foreground">{selectedCustomer.phone}</p>
          <p className="text-muted-foreground">
            {selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pincode}
          </p>
        </div>
      )}
    </div>
  );
}
