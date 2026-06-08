"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Eye, Pencil, UserX } from "lucide-react";

export type Customer = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  city: string;
  state: string;
  idProofType: string;
  isActive: boolean | null;
};

type ColumnActions = {
  onEdit: (item: Customer) => void;
  onDeactivate: (item: Customer) => void;
};

export function getColumns(actions: ColumnActions): ColumnDef<Customer>[] {
  return [
    {
      accessorKey: "fullName",
      header: "Name",
      cell: ({ row }) => (
        <Link
          href={`/customers/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.fullName}
        </Link>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.email || "-"}
        </span>
      ),
    },
    {
      accessorKey: "city",
      header: "City",
    },
    {
      accessorKey: "idProofType",
      header: "ID Type",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.idProofType}</Badge>
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
          <Link href={`/customers/${row.original.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => actions.onEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {row.original.isActive && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => actions.onDeactivate(row.original)}
            >
              <UserX className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];
}
