"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

export type PricingRule = {
  id: string;
  originState: string;
  originCity: string | null;
  destinationState: string;
  destinationCity: string | null;
  productTypeName: string;
  serviceTypeName: string;
  modeTypeName: string;
  unitPrice: string;
  minimumCharge: string | null;
  isActive: boolean | null;
};

type ColumnActions = {
  onEdit: (item: PricingRule) => void;
  onDelete: (item: PricingRule) => void;
};

function formatINR(value: string | null) {
  if (!value) return "-";
  return `₹${parseFloat(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export function getColumns(actions: ColumnActions): ColumnDef<PricingRule>[] {
  return [
    {
      id: "origin",
      header: "Origin",
      cell: ({ row }) => (
        <span>
          {row.original.originState}
          {row.original.originCity && (
            <span className="text-muted-foreground"> / {row.original.originCity}</span>
          )}
        </span>
      ),
    },
    {
      id: "destination",
      header: "Destination",
      cell: ({ row }) => (
        <span>
          {row.original.destinationState}
          {row.original.destinationCity && (
            <span className="text-muted-foreground"> / {row.original.destinationCity}</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "productTypeName",
      header: "Product",
    },
    {
      accessorKey: "serviceTypeName",
      header: "Service",
    },
    {
      accessorKey: "modeTypeName",
      header: "Mode",
    },
    {
      accessorKey: "unitPrice",
      header: "Unit Price",
      cell: ({ row }) => formatINR(row.original.unitPrice),
    },
    {
      accessorKey: "minimumCharge",
      header: "Min. Charge",
      cell: ({ row }) => formatINR(row.original.minimumCharge),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => actions.onEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => actions.onDelete(row.original)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}
