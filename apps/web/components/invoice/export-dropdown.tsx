"use client";

import { useState } from "react";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateQRDataUrl } from "~/lib/invoice/qr";

interface ExportDropdownProps {
  shipmentId?: string;
  shipmentIds?: string[];
}

export function ExportDropdown({ shipmentId, shipmentIds }: ExportDropdownProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const generateData = trpc.invoices.generateInvoiceData.useQuery(
    { shipmentId: shipmentId ?? "" },
    { enabled: false },
  );

  const csvMutation = trpc.invoices.exportCsv.useMutation();
  const excelMutation = trpc.invoices.exportExcel.useMutation();

  const ids = shipmentIds ?? (shipmentId ? [shipmentId] : []);

  async function handlePdfDownload() {
    if (!shipmentId) return;
    setLoading("pdf");
    try {
      const { data } = await generateData.refetch();
      if (!data) throw new Error("Failed to generate invoice data");

      const qrDataUrl = await generateQRDataUrl(data.qrContent);

      const { pdf } = await import("@react-pdf/renderer");
      const { InvoicePDF } = await import("~/components/invoice/invoice-pdf");

      const doc = <InvoicePDF template={data.template} shipment={data.shipment} qrDataUrl={qrDataUrl} />;
      const blob = await pdf(doc).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${data.shipment.trackingNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("PDF downloaded");
    } catch (err) {
      toast.error("Failed to generate PDF");
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  async function handleCsvExport() {
    if (ids.length === 0) return;
    setLoading("csv");
    try {
      const result = await csvMutation.mutateAsync({ shipmentIds: ids });
      const blob = new Blob([result.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch {
      toast.error("Failed to export CSV");
    } finally {
      setLoading(null);
    }
  }

  async function handleExcelExport() {
    if (ids.length === 0) return;
    setLoading("excel");
    try {
      const result = await excelMutation.mutateAsync({ shipmentIds: ids });
      const byteChars = atob(result.base64);
      const byteNumbers = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel exported");
    } catch {
      toast.error("Failed to export Excel");
    } finally {
      setLoading(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={!!loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {shipmentId && (
          <DropdownMenuItem onClick={handlePdfDownload}>
            <FileText className="mr-2 h-4 w-4" />
            Download PDF
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCsvExport}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExcelExport}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
