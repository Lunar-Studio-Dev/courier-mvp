import { NotificationAdapter } from "../../../adapter";
import type {
  SmsPayload,
  NotificationResult,
  ProviderConfig,
} from "../../../types";

export class TextlocalSmsAdapter extends NotificationAdapter<SmsPayload> {
  constructor(_config: ProviderConfig) {
    super("sms", "textlocal");
  }

  async send(_payload: SmsPayload): Promise<NotificationResult> {
    return {
      success: false,
      channel: "sms",
      provider: "textlocal",
      error:
        "Textlocal adapter not configured. Implement this adapter with Textlocal HTTP API.",
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
