"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "~/trpc/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  originState: z.string().min(1, "Required"),
  originCity: z.string().optional(),
  destinationState: z.string().min(1, "Required"),
  destinationCity: z.string().optional(),
  productTypeId: z.string().min(1, "Required"),
  serviceTypeId: z.string().min(1, "Required"),
  modeTypeId: z.string().min(1, "Required"),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price"),
  minimumCharge: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price").optional(),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PricingRuleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: {
    id: string;
    originState: string;
    originCity: string | null;
    destinationState: string;
    destinationCity: string | null;
    productTypeId: string;
    serviceTypeId: string;
    modeTypeId: string;
    unitPrice: string;
    minimumCharge: string | null;
    isActive: boolean | null;
  };
  onSubmit: (values: FormValues & { id?: string }) => void;
  isLoading?: boolean;
}

export function PricingRuleForm({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isLoading,
}: PricingRuleFormProps) {
  const isEdit = !!defaultValues;

  const { data: statesData } = trpc.destinations.getStates.useQuery();
  const { data: productTypes } = trpc.productTypes.list.useQuery({ limit: 100 });
  const { data: serviceTypes } = trpc.serviceTypes.list.useQuery({ limit: 100 });
  const { data: modeTypes } = trpc.modeTypes.list.useQuery({ limit: 100 });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originState: defaultValues?.originState ?? "",
      originCity: defaultValues?.originCity ?? "",
      destinationState: defaultValues?.destinationState ?? "",
      destinationCity: defaultValues?.destinationCity ?? "",
      productTypeId: defaultValues?.productTypeId ?? "",
      serviceTypeId: defaultValues?.serviceTypeId ?? "",
      modeTypeId: defaultValues?.modeTypeId ?? "",
      unitPrice: defaultValues?.unitPrice ?? "",
      minimumCharge: defaultValues?.minimumCharge ?? "",
      isActive: defaultValues?.isActive ?? true,
    },
  });

  function handleSubmit(values: FormValues) {
    onSubmit(isEdit ? { ...values, id: defaultValues!.id } : values);
  }

  const states = statesData ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Pricing Rule" : "Add Pricing Rule"}</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="originState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origin State</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {states.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="originCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origin City (optional)</FormLabel>
                  <FormControl><Input placeholder="e.g. Mumbai" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destinationState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination State</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {states.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destinationCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination City (optional)</FormLabel>
                  <FormControl><Input placeholder="e.g. Delhi" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select product type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productTypes?.data?.filter((p) => p.isActive).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serviceTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select service type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceTypes?.data?.filter((s) => s.isActive).map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="modeTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mode Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select mode type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {modeTypes?.data?.filter((m) => m.isActive).map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unitPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Price (₹ per kg)</FormLabel>
                  <FormControl><Input placeholder="e.g. 50.00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minimumCharge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Charge (₹, optional)</FormLabel>
                  <FormControl><Input placeholder="e.g. 100.00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEdit && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="cursor-pointer">Active</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Update" : "Create"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
