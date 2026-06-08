"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
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
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Progress } from "~/components/ui/progress";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useIdOcr } from "~/hooks/use-id-ocr";
import type { ParsedIDResult } from "~/lib/ocr/types";

const idProofTypes = [
  { value: "PAN", label: "PAN Card" },
  { value: "AADHAAR", label: "Aadhaar Card" },
  { value: "VOTER_ID", label: "Voter ID" },
  { value: "DRIVING_LICENSE", label: "Driving License" },
  { value: "PASSPORT", label: "Passport" },
];

const formSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid 10-digit Indian phone number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required").max(500),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  pincode: z.string().regex(/^\d{6}$/, "Must be 6 digits"),
  idProofType: z.enum(["PAN", "AADHAAR", "VOTER_ID", "DRIVING_LICENSE", "PASSPORT"]),
  idProofNumber: z.string().min(1, "ID number is required").max(50),
  idProofImageUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface OnboardCustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues) => void;
  isLoading?: boolean;
}

export function OnboardCustomerSheet({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: OnboardCustomerSheetProps) {
  const [phase, setPhase] = useState<"upload" | "form">("upload");
  const [ocrResult, setOcrResult] = useState<ParsedIDResult | null>(null);
  const { processImage, isProcessing, progress } = useIdOcr();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      idProofType: "PAN",
      idProofNumber: "",
      idProofImageUrl: "",
    },
  });

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const result = await processImage(file);
      setOcrResult(result);

      if (result && result.confidence >= 0.3) {
        form.setValue("idProofType", result.detectedType);
        form.setValue("idProofNumber", result.fields.idProofNumber ?? "");
        if (result.fields.fullName) form.setValue("fullName", result.fields.fullName);
        if (result.fields.address) form.setValue("address", result.fields.address);
        if (result.fields.city) form.setValue("city", result.fields.city);
        if (result.fields.state) form.setValue("state", result.fields.state);
        if (result.fields.pincode) form.setValue("pincode", result.fields.pincode);
      }

      setPhase("form");
    },
    [processImage, form],
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPhase("upload");
      setOcrResult(null);
      form.reset();
    }
    onOpenChange(open);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Onboard Customer</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
          {phase === "upload" && (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border-2 border-dashed p-8 text-center">
                {isProcessing ? (
                  <div className="space-y-3">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Processing ID proof...
                    </p>
                    <Progress value={progress} className="mx-auto max-w-xs" />
                    <p className="text-xs text-muted-foreground">{progress}%</p>
                  </div>
                ) : (
                  <label className="cursor-pointer space-y-2 block">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="font-medium">Upload ID Proof Image</p>
                    <p className="text-xs text-muted-foreground">
                      Supports: Aadhaar, PAN, Voter ID, Driving License, Passport
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </div>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setPhase("form")}
                  className="text-sm"
                >
                  Skip — fill form manually
                </Button>
              </div>
            </div>
          )}

          {phase === "form" && (
            <div className="mt-6 space-y-4">
              {ocrResult && (
                <div
                  className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                    ocrResult.confidence >= 0.5
                      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                      : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  {ocrResult.confidence >= 0.5 ? (
                    <CheckCircle className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>
                    {ocrResult.detectedType.replace("_", " ")} detected (
                    {Math.round(ocrResult.confidence * 100)}% confidence).
                    Please review fields below.
                  </span>
                </div>
              )}

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="9876543210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Full address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input maxLength={6} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="idProofType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Proof Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {idProofTypes.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="idProofNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Number</FormLabel>
                          <FormControl>
                            <Input placeholder="ID number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Customer
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
