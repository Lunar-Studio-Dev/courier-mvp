import type {
  EmailPayload,
  SmsPayload,
  WhatsAppPayload,
  DeliveryConfirmationData,
} from "../types";

function formatDate(date: Date): string {
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function getDeliveryConfirmationEmail(
  data: DeliveryConfirmationData,
): EmailPayload {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">TPC India</h1>
        <p style="margin: 4px 0 0; opacity: 0.9;">Delivery Confirmation</p>
      </div>
      <div style="padding: 24px; background: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: #dcfce7; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">
            &#10003;
          </div>
        </div>
        <h2 style="text-align: center; color: #16a34a; margin: 0 0 16px;">Shipment Delivered!</h2>
        <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Tracking Number</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace;">${data.trackingNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Delivered To</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.receiverName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Delivered At</td>
              <td style="padding: 8px;">${formatDate(data.deliveredAt)}</td>
            </tr>
          </table>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${data.trackingUrl}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Delivery Details
          </a>
        </div>
        <p style="color: #666; font-size: 13px; text-align: center;">
          Thank you for choosing TPC India for your courier needs.
        </p>
      </div>
      <div style="padding: 16px; text-align: center; color: #999; font-size: 11px;">
        &copy; TPC India. All rights reserved.
      </div>
    </div>
  `.trim();

  return {
    to: data.senderEmail ?? data.receiverEmail ?? "",
    subject: `Shipment ${data.trackingNumber} Delivered | TPC India`,
    body: html,
    textBody: `TPC India: Shipment ${data.trackingNumber} has been delivered to ${data.receiverName} on ${formatDate(data.deliveredAt)}. Details: ${data.trackingUrl}`,
  };
}

export function getDeliveryConfirmationSms(
  data: DeliveryConfirmationData,
): SmsPayload {
  return {
    to: data.senderPhone ?? data.receiverPhone ?? "",
    message: `TPC India: Shipment ${data.trackingNumber} delivered to ${data.receiverName} on ${formatDate(data.deliveredAt)}. Details: ${data.trackingUrl}`,
  };
}

export function getDeliveryConfirmationWhatsApp(
  data: DeliveryConfirmationData,
): WhatsAppPayload {
  return {
    to: data.senderPhone ?? data.receiverPhone ?? "",
    templateName: "delivery_confirmation",
    templateLanguage: "en",
    templateParams: [
      data.trackingNumber,
      data.receiverName,
      formatDate(data.deliveredAt),
      data.trackingUrl,
    ],
  };
}
