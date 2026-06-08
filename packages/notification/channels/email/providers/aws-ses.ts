import { NotificationAdapter } from "../../../adapter";
import type {
  EmailPayload,
  NotificationResult,
  ProviderConfig,
} from "../../../types";

export class AwsSesEmailAdapter extends NotificationAdapter<EmailPayload> {
  constructor(_config: ProviderConfig) {
    super("email", "aws_ses");
  }

  async send(_payload: EmailPayload): Promise<NotificationResult> {
    return {
      success: false,
      channel: "email",
      provider: "aws_ses",
      error:
        "AWS SES adapter not configured. Install @aws-sdk/client-ses and implement this adapter.",
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
