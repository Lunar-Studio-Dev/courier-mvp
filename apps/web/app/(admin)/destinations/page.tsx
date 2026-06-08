"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { PageHeader } from "~/components/shared/page-header";
import { DataTable } from "~/components/shared/data-table";
import { StatCard } from "~/components/shared/stat-card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { MapPin, CheckCircle, XCircle } from "lucide-react";
import { getColumns, type Destination } from "./_components/columns";

export default function DestinationsPage() {
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [serviceableFilter, setServiceableFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 50;

  const isServiceable =
    serviceableFilter === "yes"
      ? true
      : serviceableFilter === "no"
        ? false
        : undefined;

  const { data: states } = trpc.destinations.getStates.useQuery();

  const { data, isLoading } = trpc.destinations.list.useQuery({
    state: stateFilter !== "all" ? stateFilter : undefined,
    city: city || undefined,
    pincode: pincode || undefined,
    isServiceable,
    page,
    limit,
  });

  const utils = trpc.useUtils();

  const updateMutation = trpc.destinations.update.useMutation({
    onSuccess: () => {
      utils.destinations.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkMutation = trpc.destinations.bulkUpdateByState.useMutation({
    onSuccess: (result) => {
      utils.destinations.list.invalidate();
      toast.success(`Updated ${result.updated} destinations`);
    },
    onError: (err) => toast.error(err.message),
  });

  const columns = useMemo(
    () =>
      getColumns({
        onToggle: (item) =>
          updateMutation.mutate({
            id: item.id,
            isServiceable: !item.isServiceable,
          }),
      }),
    [updateMutation],
  );

  const total = data?.total ?? 0;
  const serviceableCount =
    serviceableFilter === "yes" ? total : undefined;
  const nonServiceableCount =
    serviceableFilter === "no" ? total : undefined;

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Destinations"
        description="Manage serviceable destinations and pincodes."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Locations" value={total} icon={MapPin} />
        <StatCard
          title="Serviceable"
          value={serviceableCount ?? "-"}
          icon={CheckCircle}
        />
        <StatCard
          title="Non-Serviceable"
          value={nonServiceableCount ?? "-"}
          icon={XCircle}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={stateFilter}
          onValueChange={(v) => {
            setStateFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {states?.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="City..."
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setPage(1);
          }}
          className="w-[160px]"
        />

        <Input
          placeholder="Pincode"
          value={pincode}
          onChange={(e) => {
            setPincode(e.target.value);
            setPage(1);
          }}
          className="w-[120px]"
        />

        <Select
          value={serviceableFilter}
          onValueChange={(v) => {
            setServiceableFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Serviceable</SelectItem>
            <SelectItem value="no">Not Serviceable</SelectItem>
          </SelectContent>
        </Select>

        {stateFilter !== "all" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              bulkMutation.mutate({
                state: stateFilter,
                isServiceable: serviceableFilter === "no",
              })
            }
            disabled={bulkMutation.isPending}
          >
            {serviceableFilter === "no"
              ? `Enable all in ${stateFilter}`
              : `Disable all in ${stateFilter}`}
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={(data?.data as Destination[]) ?? []}
        isLoading={isLoading}
        pageCount={data ? Math.ceil(data.total / limit) : undefined}
        pagination={{ pageIndex: page - 1, pageSize: limit }}
        onPaginationChange={(p) => setPage(p.pageIndex + 1)}
      />
    </div>
  );
}
