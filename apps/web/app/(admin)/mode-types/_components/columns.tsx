"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { BarChart3, Pencil, Trash2 } from "lucide-react";

export type ModeType = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean | null;
  createdAt: string | null;
};

type ColumnActions = {
  onEdit: (item: ModeType) => void;
  onDelete: (item: ModeType) => void;
  onAnalytics?: (item: ModeType) => void;
};

export function getColumns(actions: ColumnActions): ColumnDef<ModeType>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.description || "-"}
        </span>
      ),
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
          {actions.onAnalytics && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => actions.onAnalytics!(row.original)}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          )}
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
