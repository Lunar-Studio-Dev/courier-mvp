import { NotificationAdapter } from "../../../adapter";
import type {
  WhatsAppPayload,
  NotificationResult,
  ProviderConfig,
} from "../../../types";

export class TwilioWhatsAppAdapter extends NotificationAdapter<WhatsAppPayload> {
  constructor(_config: ProviderConfig) {
    super("whatsapp", "twilio");
  }

  async send(_payload: WhatsAppPayload): Promise<NotificationResult> {
    return {
      success: false,
      channel: "whatsapp",
      provider: "twilio",
      error:
        "Twilio WhatsApp adapter not configured. Install twilio and implement this adapter.",
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
