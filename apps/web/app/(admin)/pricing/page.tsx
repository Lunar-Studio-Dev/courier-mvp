"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { PageHeader } from "~/components/shared/page-header";
import { DataTable } from "~/components/shared/data-table";
import { ConfirmDialog } from "~/components/shared/confirm-dialog";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getColumns, type PricingRule } from "./_components/columns";
import { PricingRuleForm } from "./_components/pricing-rule-form";

export default function PricingPage() {
  const [originState, setOriginState] = useState<string>("all");
  const [destinationState, setDestinationState] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<PricingRule | null>(null);
  const [deleteItem, setDeleteItem] = useState<PricingRule | null>(null);

  const { data: states } = trpc.destinations.getStates.useQuery();

  const isActive =
    activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined;

  const { data, isLoading } = trpc.pricingRules.list.useQuery({
    originState: originState !== "all" ? originState : undefined,
    destinationState: destinationState !== "all" ? destinationState : undefined,
    isActive,
    page,
    limit,
  });

  const utils = trpc.useUtils();

  const createMutation = trpc.pricingRules.create.useMutation({
    onSuccess: () => {
      utils.pricingRules.list.invalidate();
      setFormOpen(false);
      toast.success("Pricing rule created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.pricingRules.update.useMutation({
    onSuccess: () => {
      utils.pricingRules.list.invalidate();
      setEditItem(null);
      toast.success("Pricing rule updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.pricingRules.delete.useMutation({
    onSuccess: () => {
      utils.pricingRules.list.invalidate();
      setDeleteItem(null);
      toast.success("Pricing rule deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: (item) => setEditItem(item),
        onDelete: (item) => setDeleteItem(item),
      }),
    [],
  );

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Pricing Rules"
        description="Configure pricing rules for routes and services."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Rule
          </Button>
        }
      />

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={originState} onValueChange={(v) => { setOriginState(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Origin State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Origins</SelectItem>
            {states?.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={destinationState} onValueChange={(v) => { setDestinationState(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Destination State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Destinations</SelectItem>
            {states?.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setPage(1); }}>
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
        data={(data?.data as PricingRule[]) ?? []}
        isLoading={isLoading}
        pageCount={data ? Math.ceil(data.total / limit) : undefined}
        pagination={{ pageIndex: page - 1, pageSize: limit }}
        onPaginationChange={(p) => setPage(p.pageIndex + 1)}
      />

      <PricingRuleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(values) => createMutation.mutate(values as any)}
        isLoading={createMutation.isPending}
      />

      {editItem && (
        <PricingRuleForm
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
          defaultValues={editItem as any}
          onSubmit={(values) => updateMutation.mutate(values as any)}
          isLoading={updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title="Delete Pricing Rule"
        description="Are you sure you want to delete this pricing rule? This cannot be undone."
        onConfirm={() => deleteItem && deleteMutation.mutate({ id: deleteItem.id })}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
