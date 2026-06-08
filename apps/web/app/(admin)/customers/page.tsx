"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { PageHeader } from "~/components/shared/page-header";
import { DataTable } from "~/components/shared/data-table";
import { StatCard } from "~/components/shared/stat-card";
import { ConfirmDialog } from "~/components/shared/confirm-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Users, UserCheck, UserX } from "lucide-react";
import { getColumns, type Customer } from "./_components/columns";
import { OnboardCustomerSheet } from "./_components/onboard-customer-sheet";
import { EditCustomerSheet } from "./_components/edit-customer-sheet";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [onboardOpen, setOnboardOpen] = useState(false);
  const [editItem, setEditItem] = useState<Customer | null>(null);
  const [deactivateItem, setDeactivateItem] = useState<Customer | null>(null);

  const isActive =
    activeFilter === "active"
      ? true
      : activeFilter === "inactive"
        ? false
        : undefined;

  const { data, isLoading } = trpc.customers.list.useQuery({
    search: search || undefined,
    isActive,
    page,
    limit,
  });

  const utils = trpc.useUtils();

  const createMutation = trpc.customers.create.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate();
      setOnboardOpen(false);
      toast.success("Customer created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.customers.update.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate();
      setEditItem(null);
      toast.success("Customer updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deactivateMutation = trpc.customers.update.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate();
      setDeactivateItem(null);
      toast.success("Customer deactivated");
    },
    onError: (err) => toast.error(err.message),
  });

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: (item) => setEditItem(item),
        onDeactivate: (item) => setDeactivateItem(item),
      }),
    [],
  );

  const total = data?.total ?? 0;

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Customers"
        description="Manage customer records and ID proofs."
        actions={
          <Button onClick={() => setOnboardOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Onboard Customer
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Customers" value={total} icon={Users} />
        <StatCard
          title="Active"
          value={activeFilter === "active" ? total : "-"}
          icon={UserCheck}
        />
        <StatCard
          title="Inactive"
          value={activeFilter === "inactive" ? total : "-"}
          icon={UserX}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={activeFilter}
          onValueChange={(v) => {
            setActiveFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data as Customer[]) ?? []}
        isLoading={isLoading}
        pageCount={data ? Math.ceil(data.total / limit) : undefined}
        pagination={{ pageIndex: page - 1, pageSize: limit }}
        onPaginationChange={(p) => setPage(p.pageIndex + 1)}
      />

      <OnboardCustomerSheet
        open={onboardOpen}
        onOpenChange={setOnboardOpen}
        onSubmit={(values) => createMutation.mutate(values)}
        isLoading={createMutation.isPending}
      />

      {editItem && (
        <EditCustomerSheet
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
          defaultValues={editItem as any}
          onSubmit={(values) => updateMutation.mutate(values)}
          isLoading={updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        open={!!deactivateItem}
        onOpenChange={(open) => !open && setDeactivateItem(null)}
        title="Deactivate Customer"
        description={`Are you sure you want to deactivate "${deactivateItem?.fullName}"? They will no longer be able to create new shipments.`}
        onConfirm={() =>
          deactivateItem &&
          deactivateMutation.mutate({
            id: deactivateItem.id,
            isActive: false,
          })
        }
        isLoading={deactivateMutation.isPending}
      />
    </div>
  );
}
