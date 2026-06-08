"use client";

import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { trpc } from "~/trpc/client";

interface DateRangeFilterProps {
  dateFrom: string | undefined;
  dateTo: string | undefined;
  branchId: string | undefined;
  onRangeChange: (dateFrom: string | undefined, dateTo: string | undefined) => void;
  onBranchChange: (branchId: string | undefined) => void;
  activePreset: string;
  onPresetChange: (preset: string) => void;
}

function getPresetDates(preset: string): { dateFrom: string | undefined; dateTo: string | undefined } {
  const now = new Date();
  const to = now.toISOString();
  switch (preset) {
    case "today": {
      const from = new Date(now);
      from.setHours(0, 0, 0, 0);
      return { dateFrom: from.toISOString(), dateTo: to };
    }
    case "7d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return { dateFrom: from.toISOString(), dateTo: to };
    }
    case "30d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return { dateFrom: from.toISOString(), dateTo: to };
    }
    case "90d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 90);
      return { dateFrom: from.toISOString(), dateTo: to };
    }
    default:
      return { dateFrom: undefined, dateTo: undefined };
  }
}

const PRESETS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
];

export function DateRangeFilter({
  branchId,
  onRangeChange,
  onBranchChange,
  activePreset,
  onPresetChange,
}: DateRangeFilterProps) {
  const { data: branchData } = trpc.branches.list.useQuery({
    page: 1,
    limit: 100,
    isActive: true,
  });

  function handlePreset(preset: string) {
    onPresetChange(preset);
    const { dateFrom, dateTo } = getPresetDates(preset);
    onRangeChange(dateFrom, dateTo);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex gap-1">
        {PRESETS.map((p) => (
          <Button
            key={p.value}
            variant={activePreset === p.value ? "default" : "outline"}
            size="sm"
            onClick={() => handlePreset(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <Select
        value={branchId ?? "all"}
        onValueChange={(v) => onBranchChange(v === "all" ? undefined : v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Branches" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Branches</SelectItem>
          {branchData?.data?.map((b: { id: string; name: string }) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
