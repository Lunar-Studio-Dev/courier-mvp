import { NotificationAdapter } from "../../../adapter";
import type {
  EmailPayload,
  NotificationResult,
  ProviderConfig,
} from "../../../types";

export class SendGridEmailAdapter extends NotificationAdapter<EmailPayload> {
  constructor(_config: ProviderConfig) {
    super("email", "sendgrid");
  }

  async send(_payload: EmailPayload): Promise<NotificationResult> {
    return {
      success: false,
      channel: "email",
      provider: "sendgrid",
      error:
        "SendGrid adapter not configured. Install @sendgrid/mail and implement this adapter.",
      timestamp: new Date(),
    };
  }

  validateRecipient(recipient: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient);
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }
}
