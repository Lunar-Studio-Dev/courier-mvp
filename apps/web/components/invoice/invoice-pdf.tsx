"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

type Address = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

type InvoicePDFProps = {
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
    visibleFields: {
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
    headerConfig?: { companyName: string; address: string; logoUrl?: string } | null;
    footerConfig?: { termsText: string; disclaimerText: string } | null;
  };
  shipment: {
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
  qrDataUrl?: string;
};

function formatINR(value: string) {
  return `₹${parseFloat(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function formatDate(date: Date | string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

export function InvoicePDF({ template, shipment, qrDataUrl }: InvoicePDFProps) {
  const { colors, typography, visibleFields, headerConfig, footerConfig, layout } = template;
  const mm = (v: number) => v * 2.835;

  const styles = StyleSheet.create({
    page: {
      width: mm(template.width),
      height: mm(template.height),
      padding: mm(layout.padding),
      backgroundColor: colors.background,
      fontFamily: "Helvetica",
      fontSize: typography.baseSize,
      color: colors.text,
      position: "relative",
    },
    heading: {
      fontFamily: "Helvetica-Bold",
      fontSize: typography.headingSize,
      color: colors.primary,
    },
    subHeading: {
      fontFamily: "Helvetica-Bold",
      fontSize: typography.headingSize - 4,
      color: colors.primary,
      marginBottom: 4,
    },
    headerBar: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
      paddingBottom: 8,
      marginBottom: 12,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 2,
    },
    label: { color: colors.secondary },
    section: {
      borderWidth: 1,
      borderColor: colors.border,
      padding: 6,
      marginBottom: 10,
    },
    twoCol: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },
    col: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 6,
    },
    colTitle: {
      fontFamily: "Helvetica-Bold",
      color: colors.primary,
      marginBottom: 4,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      fontFamily: "Helvetica-Bold",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 4,
      marginTop: 4,
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 6,
      marginTop: "auto",
      fontSize: typography.baseSize - 2,
      color: colors.secondary,
    },
    qr: { width: 60, height: 60 },
  });

  const qrPositionStyle: Record<string, number | string> = { position: "absolute" as const };
  if (template.qrPosition?.includes("top")) qrPositionStyle.top = mm(layout.padding);
  else qrPositionStyle.bottom = mm(layout.padding);
  if (template.qrPosition?.includes("left")) qrPositionStyle.left = mm(layout.padding);
  else qrPositionStyle.right = mm(layout.padding);

  return (
    <Document>
      <Page size={{ width: mm(template.width), height: mm(template.height) }} style={styles.page}>
        {/* Header */}
        {headerConfig && (
          <View style={styles.headerBar}>
            <Text style={styles.heading}>{headerConfig.companyName}</Text>
            {headerConfig.address ? (
              <Text style={{ fontSize: typography.baseSize - 1, color: colors.secondary }}>
                {headerConfig.address}
              </Text>
            ) : null}
          </View>
        )}

        {/* Invoice title + shipment info */}
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.subHeading}>Invoice</Text>
          {visibleFields.trackingNumber && (
            <View style={styles.row}>
              <Text style={styles.label}>Tracking #</Text>
              <Text>{shipment.trackingNumber}</Text>
            </View>
          )}
          {visibleFields.bookedDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Booked</Text>
              <Text>{formatDate(shipment.bookedAt)}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Branch</Text>
            <Text>{shipment.branchName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text>{shipment.status}</Text>
          </View>
        </View>

        {/* Sender / Receiver */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.colTitle}>Sender</Text>
            {visibleFields.senderName && <Text>{shipment.senderAddress.fullName}</Text>}
            {visibleFields.senderPhone && (
              <Text style={styles.label}>{shipment.senderAddress.phone}</Text>
            )}
            {visibleFields.senderAddress && (
              <Text style={styles.label}>
                {shipment.senderAddress.address}, {shipment.senderAddress.city},{" "}
                {shipment.senderAddress.state} - {shipment.senderAddress.pincode}
              </Text>
            )}
          </View>
          <View style={styles.col}>
            <Text style={styles.colTitle}>Receiver</Text>
            {visibleFields.receiverName && <Text>{shipment.receiverAddress.fullName}</Text>}
            {visibleFields.receiverPhone && (
              <Text style={styles.label}>{shipment.receiverAddress.phone}</Text>
            )}
            {visibleFields.receiverAddress && (
              <Text style={styles.label}>
                {shipment.receiverAddress.address}, {shipment.receiverAddress.city},{" "}
                {shipment.receiverAddress.state} - {shipment.receiverAddress.pincode}
              </Text>
            )}
          </View>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.colTitle}>Shipment Details</Text>
          {visibleFields.productType && (
            <View style={styles.row}>
              <Text style={styles.label}>Product</Text>
              <Text>{shipment.productTypeName}</Text>
            </View>
          )}
          {visibleFields.serviceType && (
            <View style={styles.row}>
              <Text style={styles.label}>Service</Text>
              <Text>{shipment.serviceTypeName}</Text>
            </View>
          )}
          {visibleFields.modeType && (
            <View style={styles.row}>
              <Text style={styles.label}>Mode</Text>
              <Text>{shipment.modeTypeName}</Text>
            </View>
          )}
          {visibleFields.weight && (
            <View style={styles.row}>
              <Text style={styles.label}>Weight</Text>
              <Text>{shipment.weight} kg</Text>
            </View>
          )}
          {visibleFields.declaredValue && (
            <View style={styles.row}>
              <Text style={styles.label}>Declared Value</Text>
              <Text>{formatINR(shipment.declaredValue)}</Text>
            </View>
          )}
        </View>

        {/* Billing */}
        <View style={styles.section}>
          <Text style={styles.colTitle}>Billing</Text>
          {visibleFields.basePrice && (
            <View style={styles.row}>
              <Text style={styles.label}>Base Price</Text>
              <Text>{formatINR(shipment.basePrice)}</Text>
            </View>
          )}
          {visibleFields.gstBreakdown && shipment.gstEnabled && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>GST Type</Text>
                <Text>{shipment.gstType ?? "-"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>GST Rate</Text>
                <Text>{shipment.gstRate}%</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>GST Amount</Text>
                <Text>{formatINR(shipment.gstAmount ?? "0")}</Text>
              </View>
            </>
          )}
          {visibleFields.totalAmount && (
            <View style={styles.totalRow}>
              <Text>Total</Text>
              <Text>{formatINR(shipment.totalAmount)}</Text>
            </View>
          )}
        </View>

        {/* QR Code */}
        {template.showQR && qrDataUrl && (
          <View style={qrPositionStyle as never}>
            <Image src={qrDataUrl} style={styles.qr} />
          </View>
        )}

        {/* Footer */}
        {footerConfig && (footerConfig.termsText || footerConfig.disclaimerText) && (
          <View style={styles.footer}>
            {footerConfig.termsText ? <Text>{footerConfig.termsText}</Text> : null}
            {footerConfig.disclaimerText ? (
              <Text style={{ fontStyle: "italic", marginTop: 2 }}>
                {footerConfig.disclaimerText}
              </Text>
            ) : null}
          </View>
        )}
      </Page>
    </Document>
  );
}
