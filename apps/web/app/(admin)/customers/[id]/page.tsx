"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { PageHeader } from "~/components/shared/page-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { ArrowLeft, Pencil } from "lucide-react";
import { useState } from "react";
import { EditCustomerSheet } from "../_components/edit-customer-sheet";
import { CustomerAnalytics } from "./_components/customer-analytics";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [editOpen, setEditOpen] = useState(false);

  const { data: customer, isLoading } = trpc.customers.getById.useQuery({ id });
  const utils = trpc.useUtils();

  const updateMutation = trpc.customers.update.useMutation({
    onSuccess: () => {
      utils.customers.getById.invalidate({ id });
      setEditOpen(false);
      toast.success("Customer updated");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 mt-6">
            <div className="h-40 rounded bg-muted" />
            <div className="h-40 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    notFound();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/customers">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <PageHeader
            title={customer.fullName}
            description={`Phone: ${customer.phone}`}
            actions={
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={customer.isActive ? "default" : "secondary"}>
          {customer.isActive ? "Active" : "Inactive"}
        </Badge>
        <Badge variant="outline">{customer.idProofType}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{customer.phone}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{customer.email || "-"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address</span>
              <span className="text-right max-w-[200px]">
                {customer.address}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">City</span>
              <span>{customer.city}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">State</span>
              <span>{customer.state}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pincode</span>
              <span className="font-mono">{customer.pincode}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ID Proof Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID Type</span>
              <span>{customer.idProofType.replace("_", " ")}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID Number</span>
              <span className="font-mono">{customer.idProofNumber}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>
                {customer.createdAt
                  ? new Date(customer.createdAt).toLocaleDateString("en-IN")
                  : "-"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>
                {customer.updatedAt
                  ? new Date(customer.updatedAt).toLocaleDateString("en-IN")
                  : "-"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <CustomerAnalytics customerId={id} customerName={customer.fullName} />

      {editOpen && (
        <EditCustomerSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          defaultValues={{
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            city: customer.city,
            state: customer.state,
            pincode: customer.pincode,
            idProofType: customer.idProofType,
            idProofNumber: customer.idProofNumber,
            isActive: customer.isActive,
          }}
          onSubmit={(values) => updateMutation.mutate(values)}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}
