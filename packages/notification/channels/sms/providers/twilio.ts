import { NotificationAdapter } from "../../../adapter";
import type {
  SmsPayload,
  NotificationResult,
  ProviderConfig,
} from "../../../types";

export class TwilioSmsAdapter extends NotificationAdapter<SmsPayload> {
  constructor(_config: ProviderConfig) {
    super("sms", "twilio");
  }

  async send(_payload: SmsPayload): Promise<NotificationResult> {
    return {
      success: false,
      channel: "sms",
      provider: "twilio",
      error:
        "Twilio SMS adapter not configured. Install twilio and implement this adapter.",
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
