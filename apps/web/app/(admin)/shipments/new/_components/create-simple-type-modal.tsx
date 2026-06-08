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
import { Textarea } from "~/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { trpc } from "~/trpc/client";

type EntityType = "productType" | "serviceType" | "modeType";

const TITLES: Record<EntityType, string> = {
  productType: "Add Product Type",
  serviceType: "Add Service Type",
  modeType: "Add Mode Type",
};

interface CreateSimpleTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  onCreated: (id: string) => void;
}

export function CreateSimpleTypeModal({
  open,
  onOpenChange,
  entityType,
  onCreated,
}: CreateSimpleTypeModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const utils = trpc.useUtils();

  const productMutation = trpc.productTypes.create.useMutation();
  const serviceMutation = trpc.serviceTypes.create.useMutation();
  const modeMutation = trpc.modeTypes.create.useMutation();

  const isPending =
    productMutation.isPending ||
    serviceMutation.isPending ||
    modeMutation.isPending;

  function handleSubmit() {
    if (!name.trim()) return;
    const input = { name: name.trim(), description: description.trim() || undefined };

    const onSuccess = (data: { id: string }) => {
      toast.success(`${TITLES[entityType].replace("Add ", "")} created`);
      utils.productTypes.list.invalidate();
      utils.serviceTypes.list.invalidate();
      utils.modeTypes.list.invalidate();
      onCreated(data.id);
      onOpenChange(false);
      setName("");
      setDescription("");
    };
    const onError = (err: { message: string }) => toast.error(err.message);

    switch (entityType) {
      case "productType":
        productMutation.mutate(input, { onSuccess, onError });
        break;
      case "serviceType":
        serviceMutation.mutate(input, { onSuccess, onError });
        break;
      case "modeType":
        modeMutation.mutate(input, { onSuccess, onError });
        break;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{TITLES[entityType]}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Documents"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!name.trim() || isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
