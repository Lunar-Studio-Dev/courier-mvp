import { Resend } from "resend";
import { NotificationAdapter } from "../../../adapter";
import type {
  EmailPayload,
  NotificationResult,
  ProviderConfig,
} from "../../../types";

export class ResendEmailAdapter extends NotificationAdapter<EmailPayload> {
  private client: Resend;
  private defaultFrom: string;

  constructor(config: ProviderConfig) {
    super("email", "resend");
    this.client = new Resend(config.credentials.apiKey);
    this.defaultFrom =
      config.settings?.from ?? "TPC India <noreply@tpcindia.com>";
  }

  async send(payload: EmailPayload): Promise<NotificationResult> {
    try {
      const result = await this.client.emails.send({
        from: payload.from ?? this.defaultFrom,
        to: payload.to,
        subject: payload.subject,
        html: payload.body,
        text: payload.textBody,
        replyTo: payload.replyTo,
      });

      if (result.error) {
        return {
          success: false,
          channel: "email",
          provider: "resend",
          error: result.error.message,
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        messageId: result.data?.id,
        channel: "email",
        provider: "resend",
        timestamp: new Date(),
      };
    } catch (err) {
      return {
        success: false,
        channel: "email",
        provider: "resend",
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date(),
      };
    }
  }

  validateRecipient(recipient: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.domains.list();
      return true;
    } catch {
      return false;
    }
  }
}
