import type {
  EmailPayload,
  SmsPayload,
  WhatsAppPayload,
  ShipmentBookedData,
} from "../types";

export function getShipmentBookedEmail(data: ShipmentBookedData): EmailPayload {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">TPC India</h1>
        <p style="margin: 4px 0 0; opacity: 0.8;">Shipment Booking Confirmation</p>
      </div>
      <div style="padding: 24px; background: #f9f9f9;">
        <p>Dear Customer,</p>
        <p>Your shipment has been booked successfully. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Tracking Number</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 16px;">${data.trackingNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">From</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.senderName} (${data.originCity})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">To</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.receiverName} (${data.destinationCity})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Weight</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.weight} kg</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Total Amount</td>
            <td style="padding: 8px; font-size: 16px; font-weight: bold;">&#8377;${data.totalAmount}</td>
          </tr>
        </table>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${data.trackingUrl}" style="background: #1a1a2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Track Your Shipment
          </a>
        </div>
        <p style="color: #666; font-size: 12px;">You can also track by visiting ${data.trackingUrl}</p>
      </div>
      <div style="padding: 16px; text-align: center; color: #999; font-size: 11px;">
        &copy; TPC India. All rights reserved.
      </div>
    </div>
  `.trim();

  return {
    to: data.senderEmail ?? data.receiverEmail ?? "",
    subject: `Shipment Booked - ${data.trackingNumber} | TPC India`,
    body: html,
    textBody: `Your shipment ${data.trackingNumber} from ${data.originCity} to ${data.destinationCity} has been booked. Track at: ${data.trackingUrl}`,
  };
}

export function getShipmentBookedSms(data: ShipmentBookedData): SmsPayload {
  return {
    to: data.receiverPhone ?? data.senderPhone ?? "",
    message: `TPC India: Shipment ${data.trackingNumber} booked. ${data.originCity} to ${data.destinationCity}. Track: ${data.trackingUrl}`,
  };
}

export function getShipmentBookedWhatsApp(
  data: ShipmentBookedData,
): WhatsAppPayload {
  return {
    to: data.receiverPhone ?? data.senderPhone ?? "",
    templateName: "shipment_booked",
    templateLanguage: "en",
    templateParams: [
      data.trackingNumber,
      data.originCity,
      data.destinationCity,
      data.weight,
      data.totalAmount,
      data.trackingUrl,
    ],
  };
}
