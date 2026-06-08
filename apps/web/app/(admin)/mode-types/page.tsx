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
import { getColumns, type ModeType } from "./_components/columns";
import { ModeTypeForm } from "./_components/mode-type-form";
import { EntityAnalyticsPanel } from "../_components/entity-analytics-panel";

export default function ModeTypesPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ModeType | null>(null);
  const [deleteItem, setDeleteItem] = useState<ModeType | null>(null);
  const [analyticsItem, setAnalyticsItem] = useState<ModeType | null>(null);

  const isActive =
    activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined;

  const { data, isLoading } = trpc.modeTypes.list.useQuery({
    search: search || undefined,
    isActive,
    page,
    limit,
  });

  const utils = trpc.useUtils();

  const createMutation = trpc.modeTypes.create.useMutation({
    onSuccess: () => {
      utils.modeTypes.list.invalidate();
      setFormOpen(false);
      toast.success("Mode type created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.modeTypes.update.useMutation({
    onSuccess: () => {
      utils.modeTypes.list.invalidate();
      setEditItem(null);
      toast.success("Mode type updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.modeTypes.delete.useMutation({
    onSuccess: () => {
      utils.modeTypes.list.invalidate();
      setDeleteItem(null);
      toast.success("Mode type deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: (item) => setEditItem(item),
        onDelete: (item) => setDeleteItem(item),
        onAnalytics: (item) => setAnalyticsItem(item),
      }),
    [],
  );

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Mode Types"
        description="Manage transport mode options for shipments."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Mode Type
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by name..."
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

      {analyticsItem && (
        <EntityAnalyticsPanel
          entityType="modeType"
          entityId={analyticsItem.id}
          entityName={analyticsItem.name}
          onClose={() => setAnalyticsItem(null)}
        />
      )}

      <DataTable
        columns={columns}
        data={(data?.data as ModeType[]) ?? []}
        isLoading={isLoading}
        pageCount={data ? Math.ceil(data.total / limit) : undefined}
        pagination={{ pageIndex: page - 1, pageSize: limit }}
        onPaginationChange={(p) => setPage(p.pageIndex + 1)}
      />

      <ModeTypeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(values) => createMutation.mutate(values)}
        isLoading={createMutation.isPending}
      />

      {editItem && (
        <ModeTypeForm
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
          defaultValues={editItem}
          onSubmit={(values) => updateMutation.mutate(values as any)}
          isLoading={updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title="Delete Mode Type"
        description={`Are you sure you want to delete "${deleteItem?.name}"? This cannot be undone.`}
        onConfirm={() => deleteItem && deleteMutation.mutate({ id: deleteItem.id })}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
