import type {
  EmailPayload,
  SmsPayload,
  WhatsAppPayload,
  StatusUpdateData,
} from "../types";

function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export function getStatusUpdateEmail(data: StatusUpdateData): EmailPayload {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">TPC India</h1>
        <p style="margin: 4px 0 0; opacity: 0.8;">Shipment Status Update</p>
      </div>
      <div style="padding: 24px; background: #f9f9f9;">
        <p>Your shipment status has been updated:</p>
        <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #1a1a2e;">
          <p style="margin: 0 0 8px; font-family: monospace; font-size: 14px; color: #666;">
            ${data.trackingNumber}
          </p>
          <p style="margin: 0; font-size: 20px; font-weight: bold;">
            ${statusLabel(data.status)}
          </p>
          ${data.location ? `<p style="margin: 8px 0 0; color: #666;">Location: ${data.location}</p>` : ""}
          ${data.remarks ? `<p style="margin: 4px 0 0; color: #666;">Remarks: ${data.remarks}</p>` : ""}
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${data.trackingUrl}" style="background: #1a1a2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Full Tracking
          </a>
        </div>
      </div>
      <div style="padding: 16px; text-align: center; color: #999; font-size: 11px;">
        &copy; TPC India. All rights reserved.
      </div>
    </div>
  `.trim();

  return {
    to: data.receiverEmail ?? "",
    subject: `Shipment ${data.trackingNumber} - ${statusLabel(data.status)} | TPC India`,
    body: html,
    textBody: `TPC India: Shipment ${data.trackingNumber} is now ${statusLabel(data.status)}.${data.location ? ` Location: ${data.location}.` : ""} Track: ${data.trackingUrl}`,
  };
}

export function getStatusUpdateSms(data: StatusUpdateData): SmsPayload {
  return {
    to: data.receiverPhone ?? "",
    message: `TPC India: Shipment ${data.trackingNumber} is now ${statusLabel(data.status)}.${data.location ? ` Location: ${data.location}.` : ""} Track: ${data.trackingUrl}`,
  };
}

export function getStatusUpdateWhatsApp(
  data: StatusUpdateData,
): WhatsAppPayload {
  return {
    to: data.receiverPhone ?? "",
    templateName: "status_update",
    templateLanguage: "en",
    templateParams: [
      data.trackingNumber,
      statusLabel(data.status),
      data.location || "N/A",
      data.trackingUrl,
    ],
  };
}
