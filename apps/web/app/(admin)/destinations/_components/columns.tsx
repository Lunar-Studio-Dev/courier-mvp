"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Switch } from "~/components/ui/switch";

export type Destination = {
  id: string;
  state: string;
  city: string;
  pincode: string;
  isServiceable: boolean | null;
};

type ColumnActions = {
  onToggle: (item: Destination) => void;
};

export function getColumns(actions: ColumnActions): ColumnDef<Destination>[] {
  return [
    {
      accessorKey: "state",
      header: "State",
    },
    {
      accessorKey: "city",
      header: "City",
    },
    {
      accessorKey: "pincode",
      header: "Pincode",
      cell: ({ row }) => (
        <span className="font-mono">{row.original.pincode}</span>
      ),
    },
    {
      accessorKey: "isServiceable",
      header: "Serviceable",
      cell: ({ row }) => (
        <Switch
          checked={row.original.isServiceable ?? false}
          onCheckedChange={() => actions.onToggle(row.original)}
        />
      ),
    },
  ];
}
