"use client";

import { useState } from "react";
import { trpc } from "~/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CategoryDialog({ open, onOpenChange, onSuccess }: CategoryDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = trpc.invoices.createCategory.useMutation({
    onSuccess: () => {
      toast.success("Category created");
      setName("");
      setDescription("");
      onSuccess();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard"
              maxLength={50}
            />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Category description"
              maxLength={500}
            />
          </div>
          <Button
            className="w-full"
            disabled={!name.trim() || createMutation.isPending}
            onClick={() =>
              createMutation.mutate({
                name: name.trim(),
                description: description.trim() || undefined,
              })
            }
          >
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
