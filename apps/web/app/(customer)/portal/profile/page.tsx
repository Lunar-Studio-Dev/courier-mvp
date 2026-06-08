"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Pencil, X, Package, Send, Inbox } from "lucide-react";
import { StatCard } from "~/components/shared/stat-card";
import { trpc } from "~/trpc/client";

export default function CustomerProfilePage() {
  const [editing, setEditing] = useState(false);
  const [formValues, setFormValues] = useState({
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.customerPortal.profile.useQuery();

  useEffect(() => {
    if (profile) {
      setFormValues({
        email: profile.email ?? "",
        address: profile.address,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
      });
    }
  }, [profile]);

  const updateMutation = trpc.customerPortal.updateProfile.useMutation({
    onSuccess: () => {
      utils.customerPortal.profile.invalidate();
      setEditing(false);
      toast.success("Profile updated");
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSave() {
    const updates: Record<string, string> = {};
    if (formValues.email && formValues.email !== (profile?.email ?? ""))
      updates.email = formValues.email;
    if (formValues.address !== profile?.address)
      updates.address = formValues.address;
    if (formValues.city !== profile?.city) updates.city = formValues.city;
    if (formValues.state !== profile?.state) updates.state = formValues.state;
    if (formValues.pincode !== profile?.pincode)
      updates.pincode = formValues.pincode;

    if (Object.keys(updates).length === 0) {
      setEditing(false);
      return;
    }
    updateMutation.mutate(updates as any);
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-semibold mb-6">My Profile</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">My Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account details and preferences.
          </p>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(false);
                setFormValues({
                  email: profile.email ?? "",
                  address: profile.address,
                  city: profile.city,
                  state: profile.state,
                  pincode: profile.pincode,
                });
              }}
            >
              <X className="mr-1 h-4 w-4" /> Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard
          title="Shipments Sent"
          value={profile.totalShipmentsSent}
          icon={Send}
        />
        <StatCard
          title="Shipments Received"
          value={profile.totalShipmentsReceived}
          icon={Inbox}
        />
        <StatCard
          title="Total"
          value={profile.totalShipmentsSent + profile.totalShipmentsReceived}
          icon={Package}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{profile.fullName}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <div className="flex items-center gap-2">
                <span>+91 {profile.phone}</span>
                <Badge variant="outline" className="text-[10px]">
                  Verified
                </Badge>
              </div>
            </div>
            <Separator />
            {editing ? (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input
                  value={formValues.email}
                  onChange={(e) =>
                    setFormValues((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="you@example.com"
                  className="h-8"
                />
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{profile.email || "-"}</span>
              </div>
            )}
            <Separator />
            {editing ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  <Input
                    value={formValues.address}
                    onChange={(e) =>
                      setFormValues((f) => ({ ...f, address: e.target.value }))
                    }
                    className="h-8"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">City</Label>
                    <Input
                      value={formValues.city}
                      onChange={(e) =>
                        setFormValues((f) => ({ ...f, city: e.target.value }))
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">State</Label>
                    <Input
                      value={formValues.state}
                      onChange={(e) =>
                        setFormValues((f) => ({ ...f, state: e.target.value }))
                      }
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Pincode</Label>
                  <Input
                    value={formValues.pincode}
                    onChange={(e) =>
                      setFormValues((f) => ({ ...f, pincode: e.target.value }))
                    }
                    maxLength={6}
                    className="h-8 w-28"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="text-right max-w-[200px]">{profile.address}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">City</span>
                  <span>{profile.city}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">State</span>
                  <span>{profile.state}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pincode</span>
                  <span className="font-mono">{profile.pincode}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ID Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID Type</span>
              <span>{profile.idProofType.replace("_", " ")}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID Number</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">
                  {"****" + profile.idProofNumber.slice(-4)}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  Verified
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Since</span>
              <span>
                {profile.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                    })
                  : "-"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={profile.isActive ? "default" : "secondary"}>
                {profile.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
