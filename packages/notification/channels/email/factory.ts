import type { NotificationAdapter } from "../../adapter";
import type {
  EmailPayload,
  ProviderConfig,
} from "../../types";
import { ResendEmailAdapter } from "./providers/resend";
import { SmtpEmailAdapter } from "./providers/smtp";
import { SendGridEmailAdapter } from "./providers/sendgrid";
import { AwsSesEmailAdapter } from "./providers/aws-ses";

export class EmailNotificationFactory {
  static createAdapter(
    provider: string,
    config: ProviderConfig,
  ): NotificationAdapter<EmailPayload> {
    switch (provider) {
      case "resend":
        return new ResendEmailAdapter(config);
      case "smtp":
        return new SmtpEmailAdapter(config);
      case "sendgrid":
        return new SendGridEmailAdapter(config);
      case "aws_ses":
        return new AwsSesEmailAdapter(config);
      default:
        throw new Error(`Unknown email provider: ${provider}`);
    }
  }
}
