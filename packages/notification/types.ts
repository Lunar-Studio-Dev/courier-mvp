export type NotificationChannel = "email" | "sms" | "whatsapp";

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  channel: NotificationChannel;
  provider: string;
  error?: string;
  timestamp: Date;
}

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  textBody?: string;
  from?: string;
  replyTo?: string;
}

export interface SmsPayload {
  to: string;
  message: string;
  templateId?: string;
  senderId?: string;
}

export interface WhatsAppPayload {
  to: string;
  templateName: string;
  templateLanguage: string;
  templateParams: string[];
  mediaUrl?: string;
}

export interface ProviderConfig {
  credentials: Record<string, string>;
  settings?: Record<string, string>;
}

export interface ShipmentBookedData {
  trackingNumber: string;
  senderName: string;
  receiverName: string;
  originCity: string;
  destinationCity: string;
  weight: string;
  totalAmount: string;
  trackingUrl: string;
  senderPhone?: string;
  receiverPhone?: string;
  senderEmail?: string;
  receiverEmail?: string;
}

export interface StatusUpdateData {
  trackingNumber: string;
  status: string;
  location: string;
  remarks: string;
  trackingUrl: string;
  receiverPhone?: string;
  receiverEmail?: string;
}

export interface DeliveryConfirmationData {
  trackingNumber: string;
  deliveredAt: Date;
  receiverName: string;
  trackingUrl: string;
  senderPhone?: string;
  receiverPhone?: string;
  senderEmail?: string;
  receiverEmail?: string;
}
