"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Loader2 } from "lucide-react";
import { trpc } from "~/trpc/client";

const BRANCH_TYPES = [
  "Head Office",
  "Regional Office",
  "Franchise",
  "Collection Center",
  "Hub",
];

interface CreateBranchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}

export function CreateBranchModal({
  open,
  onOpenChange,
  onCreated,
}: CreateBranchModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const utils = trpc.useUtils();
  const mutation = trpc.branches.create.useMutation({
    onSuccess: (data) => {
      toast.success("Branch created");
      utils.branches.list.invalidate();
      onCreated(data.id);
      onOpenChange(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setCode("");
    setName("");
    setType("");
    setCity("");
    setState("");
    setPincode("");
  }

  const canSubmit = code.trim() && name.trim() && type && city.trim() && state.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Branch</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. MUM-01"
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCH_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mumbai Central Hub"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>City *</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
              />
            </div>
            <div className="space-y-2">
              <Label>State *</Label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Maharashtra"
              />
            </div>
          </div>
          <div className="space-y-2 w-32">
            <Label>Pincode</Label>
            <Input
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="400001"
              maxLength={6}
            />
          </div>
          <Button
            className="w-full"
            onClick={() =>
              mutation.mutate({
                code: code.trim(),
                name: name.trim(),
                type: type as "Head Office" | "Regional Office" | "Franchise" | "Collection Center" | "Hub",
                city: city.trim(),
                state: state.trim(),
                pincode: pincode || undefined,
              })
            }
            disabled={!canSubmit || mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Branch
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
