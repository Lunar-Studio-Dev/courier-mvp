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

const ID_PROOF_TYPES = [
  { value: "AADHAAR", label: "Aadhaar" },
  { value: "PAN", label: "PAN Card" },
  { value: "VOTER_ID", label: "Voter ID" },
  { value: "DRIVING_LICENSE", label: "Driving License" },
  { value: "PASSPORT", label: "Passport" },
];

interface CreateCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}

export function CreateCustomerModal({
  open,
  onOpenChange,
  onCreated,
}: CreateCustomerModalProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [idProofType, setIdProofType] = useState("");
  const [idProofNumber, setIdProofNumber] = useState("");

  const utils = trpc.useUtils();
  const mutation = trpc.customers.create.useMutation({
    onSuccess: (data) => {
      toast.success("Customer created");
      utils.customers.search.invalidate();
      onCreated(data.id);
      onOpenChange(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setFullName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setCity("");
    setState("");
    setPincode("");
    setIdProofType("");
    setIdProofNumber("");
  }

  const canSubmit =
    fullName.trim() &&
    /^[6-9]\d{9}$/.test(phone) &&
    address.trim() &&
    city.trim() &&
    state.trim() &&
    /^\d{6}$/.test(pincode) &&
    idProofType &&
    idProofNumber.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rajesh Kumar"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone (10 digits) *</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              type="email"
            />
          </div>
          <div className="space-y-2">
            <Label>Address *</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="42, Linking Road, Bandra"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
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
            <div className="space-y-2">
              <Label>Pincode *</Label>
              <Input
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="400001"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>ID Proof Type *</Label>
              <Select value={idProofType} onValueChange={setIdProofType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  {ID_PROOF_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ID Number *</Label>
              <Input
                value={idProofNumber}
                onChange={(e) => setIdProofNumber(e.target.value)}
                placeholder="ABCDE1234F"
              />
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() =>
              mutation.mutate({
                fullName: fullName.trim(),
                phone,
                email: email.trim() || undefined,
                address: address.trim(),
                city: city.trim(),
                state: state.trim(),
                pincode,
                idProofType: idProofType as any,
                idProofNumber: idProofNumber.trim(),
              })
            }
            disabled={!canSubmit || mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Customer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
