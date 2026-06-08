"use client";

import { useEffect, useState } from "react";
import { generateQRDataUrl } from "~/lib/invoice/qr";

type Address = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

type VisibleFields = {
  trackingNumber: boolean;
  senderName: boolean;
  senderAddress: boolean;
  senderPhone: boolean;
  receiverName: boolean;
  receiverAddress: boolean;
  receiverPhone: boolean;
  productType: boolean;
  serviceType: boolean;
  modeType: boolean;
  weight: boolean;
  declaredValue: boolean;
  basePrice: boolean;
  gstBreakdown: boolean;
  totalAmount: boolean;
  bookedDate: boolean;
};

type InvoicePreviewProps = {
  template: {
    width: number;
    height: number;
    showQR?: boolean | null;
    qrPosition?: string | null;
    layout: { orientation: string; padding: number };
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
      border: string;
    };
    typography: {
      headingFont: string;
      headingSize: number;
      baseFont: string;
      baseSize: number;
    };
    visibleFields: VisibleFields;
    headerConfig?: { companyName: string; address: string; logoUrl?: string } | null;
    footerConfig?: { termsText: string; disclaimerText: string } | null;
  };
  shipment?: {
    trackingNumber: string;
    status: string;
    bookedAt: Date | string | null;
    senderAddress: Address;
    receiverAddress: Address;
    productTypeName: string;
    serviceTypeName: string;
    modeTypeName: string;
    weight: string;
    declaredValue: string;
    basePrice: string;
    gstEnabled: boolean | null;
    gstType: string | null;
    gstRate: string | null;
    gstAmount: string | null;
    totalAmount: string;
    branchName: string;
  };
  qrContent?: string;
};

const SAMPLE_SHIPMENT = {
  trackingNumber: "TPC20260101-00001",
  status: "BOOKED",
  bookedAt: new Date().toISOString(),
  senderAddress: {
    fullName: "John Doe",
    phone: "9876543210",
    address: "123 MG Road",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
  },
  receiverAddress: {
    fullName: "Jane Smith",
    phone: "9876543211",
    address: "456 CP Road",
    city: "Delhi",
    state: "Delhi",
    pincode: "110001",
  },
  productTypeName: "Document",
  serviceTypeName: "Express",
  modeTypeName: "Air",
  weight: "2.5",
  declaredValue: "5000.00",
  basePrice: "250.00",
  gstEnabled: true,
  gstType: "IGST",
  gstRate: "18.00",
  gstAmount: "45.00",
  totalAmount: "295.00",
  branchName: "Mumbai HQ",
};

function formatINR(value: string) {
  return `₹${parseFloat(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function formatDate(date: Date | string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

export function InvoicePreview({ template, shipment, qrContent }: InvoicePreviewProps) {
  const data = shipment ?? SAMPLE_SHIPMENT;
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const { colors, typography, visibleFields, headerConfig, footerConfig, layout } = template;

  useEffect(() => {
    if (template.showQR) {
      const content = qrContent ?? `http://localhost:3000/track/${data.trackingNumber}`;
      generateQRDataUrl(content).then(setQrDataUrl);
    }
  }, [template.showQR, qrContent, data.trackingNumber]);

  const scale = Math.min(1, 400 / template.width);

  return (
    <div
      style={{
        width: template.width * scale,
        minHeight: template.height * scale * 0.5,
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: typography.baseFont,
        fontSize: typography.baseSize * scale,
        padding: layout.padding * scale,
        border: `1px solid ${colors.border}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      {headerConfig && (
        <div
          style={{
            borderBottom: `2px solid ${colors.primary}`,
            paddingBottom: 8 * scale,
            marginBottom: 12 * scale,
          }}
        >
          <div
            style={{
              fontFamily: typography.headingFont,
              fontSize: typography.headingSize * scale,
              fontWeight: "bold",
              color: colors.primary,
            }}
          >
            {headerConfig.companyName}
          </div>
          {headerConfig.address && (
            <div style={{ fontSize: (typography.baseSize - 1) * scale, color: colors.secondary }}>
              {headerConfig.address}
            </div>
          )}
        </div>
      )}

      {/* Shipment Info */}
      <div style={{ marginBottom: 10 * scale }}>
        <div
          style={{
            fontFamily: typography.headingFont,
            fontSize: (typography.headingSize - 4) * scale,
            fontWeight: "bold",
            marginBottom: 4 * scale,
            color: colors.primary,
          }}
        >
          Invoice
        </div>
        {visibleFields.trackingNumber && (
          <Row label="Tracking #" value={data.trackingNumber} scale={scale} colors={colors} />
        )}
        {visibleFields.bookedDate && (
          <Row label="Booked" value={formatDate(data.bookedAt)} scale={scale} colors={colors} />
        )}
        <Row label="Branch" value={data.branchName} scale={scale} colors={colors} />
        <Row label="Status" value={data.status} scale={scale} colors={colors} />
      </div>

      {/* Sender / Receiver */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8 * scale,
          marginBottom: 10 * scale,
        }}
      >
        <div style={{ border: `1px solid ${colors.border}`, padding: 6 * scale }}>
          <div style={{ fontWeight: "bold", marginBottom: 4 * scale, color: colors.primary }}>
            Sender
          </div>
          {visibleFields.senderName && <div>{data.senderAddress.fullName}</div>}
          {visibleFields.senderPhone && (
            <div style={{ color: colors.secondary }}>{data.senderAddress.phone}</div>
          )}
          {visibleFields.senderAddress && (
            <div style={{ color: colors.secondary }}>
              {data.senderAddress.address}, {data.senderAddress.city},{" "}
              {data.senderAddress.state} - {data.senderAddress.pincode}
            </div>
          )}
        </div>
        <div style={{ border: `1px solid ${colors.border}`, padding: 6 * scale }}>
          <div style={{ fontWeight: "bold", marginBottom: 4 * scale, color: colors.primary }}>
            Receiver
          </div>
          {visibleFields.receiverName && <div>{data.receiverAddress.fullName}</div>}
          {visibleFields.receiverPhone && (
            <div style={{ color: colors.secondary }}>{data.receiverAddress.phone}</div>
          )}
          {visibleFields.receiverAddress && (
            <div style={{ color: colors.secondary }}>
              {data.receiverAddress.address}, {data.receiverAddress.city},{" "}
              {data.receiverAddress.state} - {data.receiverAddress.pincode}
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div
        style={{
          border: `1px solid ${colors.border}`,
          padding: 6 * scale,
          marginBottom: 10 * scale,
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 4 * scale, color: colors.primary }}>
          Shipment Details
        </div>
        {visibleFields.productType && (
          <Row label="Product" value={data.productTypeName} scale={scale} colors={colors} />
        )}
        {visibleFields.serviceType && (
          <Row label="Service" value={data.serviceTypeName} scale={scale} colors={colors} />
        )}
        {visibleFields.modeType && (
          <Row label="Mode" value={data.modeTypeName} scale={scale} colors={colors} />
        )}
        {visibleFields.weight && (
          <Row label="Weight" value={`${data.weight} kg`} scale={scale} colors={colors} />
        )}
        {visibleFields.declaredValue && (
          <Row
            label="Declared Value"
            value={formatINR(data.declaredValue)}
            scale={scale}
            colors={colors}
          />
        )}
      </div>

      {/* Billing */}
      <div
        style={{
          border: `1px solid ${colors.border}`,
          padding: 6 * scale,
          marginBottom: 10 * scale,
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 4 * scale, color: colors.primary }}>
          Billing
        </div>
        {visibleFields.basePrice && (
          <Row label="Base Price" value={formatINR(data.basePrice)} scale={scale} colors={colors} />
        )}
        {visibleFields.gstBreakdown && data.gstEnabled && (
          <>
            <Row label="GST Type" value={data.gstType ?? "-"} scale={scale} colors={colors} />
            <Row label="GST Rate" value={`${data.gstRate}%`} scale={scale} colors={colors} />
            <Row
              label="GST Amount"
              value={formatINR(data.gstAmount ?? "0")}
              scale={scale}
              colors={colors}
            />
          </>
        )}
        {visibleFields.totalAmount && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              borderTop: `1px solid ${colors.border}`,
              paddingTop: 4 * scale,
              marginTop: 4 * scale,
            }}
          >
            <span>Total</span>
            <span>{formatINR(data.totalAmount)}</span>
          </div>
        )}
      </div>

      {/* QR Code */}
      {template.showQR && qrDataUrl && (
        <div
          style={{
            position: "absolute",
            ...(template.qrPosition?.includes("top") ? { top: layout.padding * scale } : { bottom: layout.padding * scale }),
            ...(template.qrPosition?.includes("left") ? { left: layout.padding * scale } : { right: layout.padding * scale }),
          }}
        >
          <img src={qrDataUrl} alt="QR" style={{ width: 60 * scale, height: 60 * scale }} />
        </div>
      )}

      {/* Footer */}
      {footerConfig && (footerConfig.termsText || footerConfig.disclaimerText) && (
        <div
          style={{
            borderTop: `1px solid ${colors.border}`,
            paddingTop: 6 * scale,
            marginTop: 8 * scale,
            fontSize: (typography.baseSize - 2) * scale,
            color: colors.secondary,
          }}
        >
          {footerConfig.termsText && <div>{footerConfig.termsText}</div>}
          {footerConfig.disclaimerText && (
            <div style={{ fontStyle: "italic", marginTop: 2 * scale }}>
              {footerConfig.disclaimerText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  scale,
  colors,
}: {
  label: string;
  value: string;
  scale: number;
  colors: { secondary: string };
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: `${2 * scale}px 0`,
      }}
    >
      <span style={{ color: colors.secondary }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
