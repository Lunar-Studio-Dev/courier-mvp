"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { PageHeader } from "~/components/shared/page-header";
import { DataTable } from "~/components/shared/data-table";
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
import { getColumns, type Branch } from "./_components/columns";
import { BranchForm } from "./_components/branch-form";

const branchTypes = [
  "Head Office",
  "Regional Office",
  "Franchise",
  "Collection Center",
  "Hub",
];

export default function BranchesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Branch | null>(null);
  const [deleteItem, setDeleteItem] = useState<Branch | null>(null);

  const isActive =
    activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined;
  const type = typeFilter !== "all" ? (typeFilter as any) : undefined;

  const { data, isLoading } = trpc.branches.list.useQuery({
    search: search || undefined,
    type,
    isActive,
    page,
    limit,
  });

  const utils = trpc.useUtils();

  const createMutation = trpc.branches.create.useMutation({
    onSuccess: () => {
      utils.branches.list.invalidate();
      setFormOpen(false);
      toast.success("Branch created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.branches.update.useMutation({
    onSuccess: () => {
      utils.branches.list.invalidate();
      setEditItem(null);
      toast.success("Branch updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.branches.delete.useMutation({
    onSuccess: () => {
      utils.branches.list.invalidate();
      setDeleteItem(null);
      toast.success("Branch deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: (item) => setEditItem(item),
        onDelete: (item) => setDeleteItem(item),
        onToggleActive: (item) =>
          updateMutation.mutate({ id: item.id, isActive: !item.isActive }),
      }),
    [updateMutation],
  );

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Branches"
        description="Manage branch offices and franchise locations."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Branch
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, code, city..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {branchTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        data={(data?.data as Branch[]) ?? []}
        isLoading={isLoading}
        pageCount={data ? Math.ceil(data.total / limit) : undefined}
        pagination={{ pageIndex: page - 1, pageSize: limit }}
        onPaginationChange={(p) => setPage(p.pageIndex + 1)}
      />

      <BranchForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(values) => createMutation.mutate(values)}
        isLoading={createMutation.isPending}
      />

      {editItem && (
        <BranchForm
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
          defaultValues={editItem}
          onSubmit={(values) => updateMutation.mutate(values)}
          isLoading={updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title="Delete Branch"
        description={`Are you sure you want to delete "${deleteItem?.name}" (${deleteItem?.code})? This cannot be undone.`}
        onConfirm={() => deleteItem && deleteMutation.mutate({ id: deleteItem.id })}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
