"use client";

import { useState } from "react";
import { trpc } from "~/trpc/client";
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
import { Loader2 } from "lucide-react";

interface CreateDestinationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}

export function CreateDestinationModal({
  open,
  onOpenChange,
  onCreated,
}: CreateDestinationModalProps) {
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const utils = trpc.useUtils();

  const createMutation = trpc.destinations.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Destination created: ${data.city}, ${data.state}`);
      utils.destinations.search.invalidate();
      onCreated(data.id);
      onOpenChange(false);
      setState("");
      setCity("");
      setPincode("");
    },
    onError: (err) => toast.error(err.message),
  });

  const canSubmit = state.trim() && city.trim() && /^\d{6}$/.test(pincode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Destination</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>State</Label>
            <Input
              placeholder="e.g. Maharashtra"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              placeholder="e.g. Mumbai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Pincode</Label>
            <Input
              placeholder="e.g. 400001"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <Button
            onClick={() =>
              createMutation.mutate({
                state: state.trim(),
                city: city.trim(),
                pincode,
              })
            }
            disabled={!canSubmit || createMutation.isPending}
          >
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Destination
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
