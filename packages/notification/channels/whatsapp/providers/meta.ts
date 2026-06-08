import { NotificationAdapter } from "../../../adapter";
import type {
  WhatsAppPayload,
  NotificationResult,
  ProviderConfig,
} from "../../../types";

export class MetaWhatsAppAdapter extends NotificationAdapter<WhatsAppPayload> {
  constructor(_config: ProviderConfig) {
    super("whatsapp", "meta");
  }

  async send(_payload: WhatsAppPayload): Promise<NotificationResult> {
    return {
      success: false,
      channel: "whatsapp",
      provider: "meta",
      error:
        "Meta WhatsApp adapter not configured. Implement this adapter with Meta Graph API.",
      timestamp: new Date(),
    };
  }

  validateRecipient(recipient: string): boolean {
    return /^\+?\d{10,15}$/.test(recipient.replace(/[\s-]/g, ""));
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }
}
