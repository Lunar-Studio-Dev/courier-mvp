"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { trpc } from "~/trpc/client";
import { PageHeader } from "~/components/shared/page-header";
import { DataTable } from "~/components/shared/data-table";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getColumns, type Shipment } from "./_components/columns";
import { UpdateStatusSheet } from "./_components/update-status-sheet";

const STATUSES = [
  "BOOKED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY",
  "DELIVERED", "CANCELLED", "RETURNED", "ON_HOLD",
];

export default function ShipmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [statusShipment, setStatusShipment] = useState<Shipment | null>(null);

  const { data, isLoading } = trpc.shipments.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    page,
    limit,
  });

  const utils = trpc.useUtils();

  const columns = useMemo(
    () =>
      getColumns({
        onUpdateStatus: (item) => setStatusShipment(item),
      }),
    [],
  );

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Shipments"
        description="View and manage all shipments."
        actions={
          <Button asChild>
            <Link href="/shipments/new">
              <Plus className="mr-2 h-4 w-4" /> Create Shipment
            </Link>
          </Button>
        }
      />

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search tracking #..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data as Shipment[]) ?? []}
        isLoading={isLoading}
        pageCount={data ? Math.ceil(data.total / limit) : undefined}
        pagination={{ pageIndex: page - 1, pageSize: limit }}
        onPaginationChange={(p) => setPage(p.pageIndex + 1)}
      />

      <UpdateStatusSheet
        shipment={statusShipment}
        open={!!statusShipment}
        onOpenChange={(open) => !open && setStatusShipment(null)}
        onSuccess={() => {
          setStatusShipment(null);
          utils.shipments.list.invalidate();
        }}
      />
    </div>
  );
}
