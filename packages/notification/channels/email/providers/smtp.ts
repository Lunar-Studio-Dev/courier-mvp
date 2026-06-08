import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { NotificationAdapter } from "../../../adapter";
import type {
  EmailPayload,
  NotificationResult,
  ProviderConfig,
} from "../../../types";

export class SmtpEmailAdapter extends NotificationAdapter<EmailPayload> {
  private transporter: Transporter;
  private defaultFrom: string;

  constructor(config: ProviderConfig) {
    super("email", "smtp");
    this.transporter = nodemailer.createTransport({
      host: config.credentials.host,
      port: Number(config.credentials.port) || 587,
      secure: config.credentials.secure === "true",
      auth: {
        user: config.credentials.user,
        pass: config.credentials.pass,
      },
    });
    this.defaultFrom =
      config.settings?.from ?? "TPC India <noreply@tpcindia.com>";
  }

  async send(payload: EmailPayload): Promise<NotificationResult> {
    try {
      const info = await this.transporter.sendMail({
        from: payload.from ?? this.defaultFrom,
        to: payload.to,
        subject: payload.subject,
        html: payload.body,
        text: payload.textBody,
        replyTo: payload.replyTo,
      });

      return {
        success: true,
        messageId: info.messageId,
        channel: "email",
        provider: "smtp",
        timestamp: new Date(),
      };
    } catch (err) {
      return {
        success: false,
        channel: "email",
        provider: "smtp",
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
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
