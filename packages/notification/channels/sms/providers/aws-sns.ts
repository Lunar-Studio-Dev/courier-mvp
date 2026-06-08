import { NotificationAdapter } from "../../../adapter";
import type {
  SmsPayload,
  NotificationResult,
  ProviderConfig,
} from "../../../types";

export class AwsSnsSmsAdapter extends NotificationAdapter<SmsPayload> {
  constructor(_config: ProviderConfig) {
    super("sms", "aws_sns");
  }

  async send(_payload: SmsPayload): Promise<NotificationResult> {
    return {
      success: false,
      channel: "sms",
      provider: "aws_sns",
      error:
        "AWS SNS adapter not configured. Install @aws-sdk/client-sns and implement this adapter.",
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
