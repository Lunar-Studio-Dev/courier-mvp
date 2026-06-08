"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Pencil, Trash2 } from "lucide-react";

export type Branch = {
  id: string;
  code: string;
  name: string;
  type: string;
  city: string;
  state: string;
  address: string | null;
  pincode: string | null;
  latitude: string | null;
  longitude: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  isActive: boolean | null;
  createdAt: string | null;
};

const typeColors: Record<string, string> = {
  "Head Office": "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  "Regional Office": "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  Franchise: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  "Collection Center": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
  Hub: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
};

type ColumnActions = {
  onEdit: (item: Branch) => void;
  onDelete: (item: Branch) => void;
  onToggleActive: (item: Branch) => void;
};

export function getColumns(actions: ColumnActions): ColumnDef<Branch>[] {
  return [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.code}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`border-transparent font-medium ${typeColors[row.original.type] ?? ""}`}
        >
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "city",
      header: "City",
    },
    {
      accessorKey: "state",
      header: "State",
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Switch
          checked={row.original.isActive ?? false}
          onCheckedChange={() => actions.onToggleActive(row.original)}
        />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => actions.onEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => actions.onDelete(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}
