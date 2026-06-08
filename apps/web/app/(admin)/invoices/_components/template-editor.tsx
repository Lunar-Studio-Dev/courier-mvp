"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { InvoicePreview } from "~/components/invoice/invoice-preview";

const formSchema = z.object({
  name: z.string().min(1).max(100),
  categoryId: z.string().min(1),
  width: z.number().int().min(50).max(500),
  height: z.number().int().min(50).max(500),
  orientation: z.enum(["portrait", "landscape"]),
  padding: z.number().int().min(0).max(50),
  showQR: z.boolean(),
  qrPosition: z.enum(["top-left", "top-right", "bottom-left", "bottom-right"]),
  // Colors
  colorPrimary: z.string(),
  colorSecondary: z.string(),
  colorBackground: z.string(),
  colorText: z.string(),
  colorBorder: z.string(),
  // Typography
  headingFont: z.string(),
  headingSize: z.number().int().min(8).max(36),
  baseFont: z.string(),
  baseSize: z.number().int().min(6).max(24),
  // Visible fields
  trackingNumber: z.boolean(),
  senderName: z.boolean(),
  senderAddress: z.boolean(),
  senderPhone: z.boolean(),
  receiverName: z.boolean(),
  receiverAddress: z.boolean(),
  receiverPhone: z.boolean(),
  productType: z.boolean(),
  serviceType: z.boolean(),
  modeType: z.boolean(),
  weight: z.boolean(),
  declaredValue: z.boolean(),
  basePrice: z.boolean(),
  gstBreakdown: z.boolean(),
  totalAmount: z.boolean(),
  bookedDate: z.boolean(),
  // Header
  companyName: z.string(),
  headerAddress: z.string(),
  logoUrl: z.string().optional(),
  // Footer
  termsText: z.string(),
  disclaimerText: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

type TemplateData = {
  id: string;
  name: string;
  categoryId: string;
  width: number;
  height: number;
  showQR: boolean | null;
  qrPosition: string | null;
  isDefault: boolean | null;
  layout: { orientation: string; padding: number };
  colors: { primary: string; secondary: string; background: string; text: string; border: string };
  typography: { headingFont: string; headingSize: number; baseFont: string; baseSize: number };
  visibleFields: Record<string, boolean>;
  headerConfig: { companyName: string; address: string; logoUrl?: string } | null;
  footerConfig: { termsText: string; disclaimerText: string } | null;
};

interface TemplateEditorProps {
  template: TemplateData | null;
  categories: { id: string; name: string }[];
  onSuccess: () => void;
}

export function TemplateEditor({ template, categories, onSuccess }: TemplateEditorProps) {
  const utils = trpc.useUtils();
  const isEdit = !!template;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: template
      ? {
          name: template.name,
          categoryId: template.categoryId,
          width: template.width,
          height: template.height,
          orientation: template.layout.orientation as "portrait" | "landscape",
          padding: template.layout.padding,
          showQR: template.showQR ?? true,
          qrPosition: (template.qrPosition ?? "bottom-right") as FormValues["qrPosition"],
          colorPrimary: template.colors.primary,
          colorSecondary: template.colors.secondary,
          colorBackground: template.colors.background,
          colorText: template.colors.text,
          colorBorder: template.colors.border,
          headingFont: template.typography.headingFont,
          headingSize: template.typography.headingSize,
          baseFont: template.typography.baseFont,
          baseSize: template.typography.baseSize,
          trackingNumber: template.visibleFields.trackingNumber ?? true,
          senderName: template.visibleFields.senderName ?? true,
          senderAddress: template.visibleFields.senderAddress ?? true,
          senderPhone: template.visibleFields.senderPhone ?? true,
          receiverName: template.visibleFields.receiverName ?? true,
          receiverAddress: template.visibleFields.receiverAddress ?? true,
          receiverPhone: template.visibleFields.receiverPhone ?? true,
          productType: template.visibleFields.productType ?? true,
          serviceType: template.visibleFields.serviceType ?? true,
          modeType: template.visibleFields.modeType ?? true,
          weight: template.visibleFields.weight ?? true,
          declaredValue: template.visibleFields.declaredValue ?? true,
          basePrice: template.visibleFields.basePrice ?? true,
          gstBreakdown: template.visibleFields.gstBreakdown ?? true,
          totalAmount: template.visibleFields.totalAmount ?? true,
          bookedDate: template.visibleFields.bookedDate ?? true,
          companyName: template.headerConfig?.companyName ?? "TPC India",
          headerAddress: template.headerConfig?.address ?? "",
          logoUrl: template.headerConfig?.logoUrl ?? "",
          termsText: template.footerConfig?.termsText ?? "",
          disclaimerText: template.footerConfig?.disclaimerText ?? "",
        }
      : {
          name: "",
          categoryId: categories[0]?.id ?? "",
          width: 210,
          height: 297,
          orientation: "portrait",
          padding: 20,
          showQR: true,
          qrPosition: "bottom-right",
          colorPrimary: "#000000",
          colorSecondary: "#666666",
          colorBackground: "#ffffff",
          colorText: "#000000",
          colorBorder: "#e5e7eb",
          headingFont: "Helvetica",
          headingSize: 16,
          baseFont: "Helvetica",
          baseSize: 10,
          trackingNumber: true,
          senderName: true,
          senderAddress: true,
          senderPhone: true,
          receiverName: true,
          receiverAddress: true,
          receiverPhone: true,
          productType: true,
          serviceType: true,
          modeType: true,
          weight: true,
          declaredValue: true,
          basePrice: true,
          gstBreakdown: true,
          totalAmount: true,
          bookedDate: true,
          companyName: "TPC India",
          headerAddress: "",
          logoUrl: "",
          termsText: "",
          disclaimerText: "",
        },
  });

  const createMutation = trpc.invoices.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template created");
      utils.invoices.listTemplates.invalidate();
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.invoices.updateTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template updated");
      utils.invoices.listTemplates.invalidate();
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const setDefaultMutation = trpc.invoices.setDefault.useMutation({
    onSuccess: () => {
      toast.success("Set as default");
      utils.invoices.listTemplates.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      categoryId: values.categoryId,
      width: values.width,
      height: values.height,
      showQR: values.showQR,
      qrPosition: values.qrPosition,
      layout: { orientation: values.orientation, padding: values.padding },
      colors: {
        primary: values.colorPrimary,
        secondary: values.colorSecondary,
        background: values.colorBackground,
        text: values.colorText,
        border: values.colorBorder,
      },
      typography: {
        headingFont: values.headingFont,
        headingSize: values.headingSize,
        baseFont: values.baseFont,
        baseSize: values.baseSize,
      },
      visibleFields: {
        trackingNumber: values.trackingNumber,
        senderName: values.senderName,
        senderAddress: values.senderAddress,
        senderPhone: values.senderPhone,
        receiverName: values.receiverName,
        receiverAddress: values.receiverAddress,
        receiverPhone: values.receiverPhone,
        productType: values.productType,
        serviceType: values.serviceType,
        modeType: values.modeType,
        weight: values.weight,
        declaredValue: values.declaredValue,
        basePrice: values.basePrice,
        gstBreakdown: values.gstBreakdown,
        totalAmount: values.totalAmount,
        bookedDate: values.bookedDate,
      },
      headerConfig: {
        companyName: values.companyName,
        address: values.headerAddress,
        logoUrl: values.logoUrl || undefined,
      },
      footerConfig: {
        termsText: values.termsText,
        disclaimerText: values.disclaimerText,
      },
    };

    if (isEdit && template) {
      updateMutation.mutate({ id: template.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const watched = form.watch();
  const previewTemplate = {
    width: watched.width || 210,
    height: watched.height || 297,
    showQR: watched.showQR,
    qrPosition: watched.qrPosition,
    layout: { orientation: watched.orientation, padding: watched.padding || 20 },
    colors: {
      primary: watched.colorPrimary,
      secondary: watched.colorSecondary,
      background: watched.colorBackground,
      text: watched.colorText,
      border: watched.colorBorder,
    },
    typography: {
      headingFont: watched.headingFont,
      headingSize: watched.headingSize || 16,
      baseFont: watched.baseFont,
      baseSize: watched.baseSize || 10,
    },
    visibleFields: {
      trackingNumber: watched.trackingNumber,
      senderName: watched.senderName,
      senderAddress: watched.senderAddress,
      senderPhone: watched.senderPhone,
      receiverName: watched.receiverName,
      receiverAddress: watched.receiverAddress,
      receiverPhone: watched.receiverPhone,
      productType: watched.productType,
      serviceType: watched.serviceType,
      modeType: watched.modeType,
      weight: watched.weight,
      declaredValue: watched.declaredValue,
      basePrice: watched.basePrice,
      gstBreakdown: watched.gstBreakdown,
      totalAmount: watched.totalAmount,
      bookedDate: watched.bookedDate,
    },
    headerConfig: {
      companyName: watched.companyName || "TPC India",
      address: watched.headerAddress,
    },
    footerConfig: {
      termsText: watched.termsText,
      disclaimerText: watched.disclaimerText,
    },
  };

  const fieldToggles = [
    { name: "trackingNumber" as const, label: "Tracking Number" },
    { name: "senderName" as const, label: "Sender Name" },
    { name: "senderAddress" as const, label: "Sender Address" },
    { name: "senderPhone" as const, label: "Sender Phone" },
    { name: "receiverName" as const, label: "Receiver Name" },
    { name: "receiverAddress" as const, label: "Receiver Address" },
    { name: "receiverPhone" as const, label: "Receiver Phone" },
    { name: "productType" as const, label: "Product Type" },
    { name: "serviceType" as const, label: "Service Type" },
    { name: "modeType" as const, label: "Mode Type" },
    { name: "weight" as const, label: "Weight" },
    { name: "declaredValue" as const, label: "Declared Value" },
    { name: "basePrice" as const, label: "Base Price" },
    { name: "gstBreakdown" as const, label: "GST Breakdown" },
    { name: "totalAmount" as const, label: "Total Amount" },
    { name: "bookedDate" as const, label: "Booked Date" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ScrollArea className="h-[calc(100vh-200px)]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pr-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {isEdit ? "Edit Template" : "New Template"}
              </h3>
              <div className="flex gap-2">
                {isEdit && template && !template.isDefault && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDefaultMutation.mutate({ id: template.id })}
                    disabled={setDefaultMutation.isPending}
                  >
                    <Star className="mr-1 h-3 w-3" /> Set Default
                  </Button>
                )}
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEdit ? "Save" : "Create"}
                </Button>
              </div>
            </div>

            <Tabs defaultValue="basic">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="fields">Fields</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl><Input {...field} placeholder="Template name" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Width (mm)</FormLabel>
                        <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (mm)</FormLabel>
                        <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="orientation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orientation</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="padding"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Padding (mm)</FormLabel>
                      <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="showQR"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel>Show QR Code</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {watched.showQR && (
                  <FormField
                    control={form.control}
                    name="qrPosition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>QR Position</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="top-left">Top Left</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              <TabsContent value="style" className="space-y-4 mt-4">
                <p className="text-sm font-medium text-muted-foreground">Colors</p>
                {(
                  [
                    ["colorPrimary", "Primary"],
                    ["colorSecondary", "Secondary"],
                    ["colorBackground", "Background"],
                    ["colorText", "Text"],
                    ["colorBorder", "Border"],
                  ] as const
                ).map(([name, label]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3">
                        <input
                          type="color"
                          value={field.value}
                          onChange={field.onChange}
                          className="h-8 w-8 rounded border cursor-pointer"
                        />
                        <FormLabel className="flex-1">{label}</FormLabel>
                        <FormControl>
                          <Input {...field} className="w-24 font-mono text-xs" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}

                <p className="text-sm font-medium text-muted-foreground mt-6">Typography</p>
                <FormField
                  control={form.control}
                  name="headingFont"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heading Font</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="headingSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heading Size (pt)</FormLabel>
                      <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="baseFont"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Font</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="baseSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Size (pt)</FormLabel>
                      <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="fields" className="space-y-3 mt-4">
                <p className="text-sm text-muted-foreground">Toggle which fields appear on the invoice.</p>
                {fieldToggles.map(({ name, label }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <FormLabel className="cursor-pointer">{label}</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </TabsContent>

              <TabsContent value="content" className="space-y-4 mt-4">
                <p className="text-sm font-medium text-muted-foreground">Header</p>
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="headerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL (optional)</FormLabel>
                      <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                    </FormItem>
                  )}
                />

                <p className="text-sm font-medium text-muted-foreground mt-6">Footer</p>
                <FormField
                  control={form.control}
                  name="termsText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terms Text</FormLabel>
                      <FormControl><Textarea {...field} rows={3} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="disclaimerText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disclaimer Text</FormLabel>
                      <FormControl><Textarea {...field} rows={3} /></FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </ScrollArea>

      <div className="flex flex-col items-center">
        <p className="text-sm text-muted-foreground mb-3">Live Preview</p>
        <InvoicePreview template={previewTemplate} />
      </div>
    </div>
  );
}
