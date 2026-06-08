export { NotificationService } from "./service";
export { NotificationAdapter } from "./adapter";

export { EmailNotificationFactory } from "./channels/email/factory";
export { SmsNotificationFactory } from "./channels/sms/factory";
export { WhatsAppNotificationFactory } from "./channels/whatsapp/factory";

export type {
  NotificationChannel,
  NotificationResult,
  EmailPayload,
  SmsPayload,
  WhatsAppPayload,
  ProviderConfig,
  ShipmentBookedData,
  StatusUpdateData,
  DeliveryConfirmationData,
} from "./types";
