import { NotificationAdapter } from "../../../adapter";
import type {
  SmsPayload,
  NotificationResult,
  ProviderConfig,
} from "../../../types";

export class Msg91SmsAdapter extends NotificationAdapter<SmsPayload> {
  private authKey: string;
  private senderId: string;
  private dltTemplateId: string;

  constructor(config: ProviderConfig) {
    super("sms", "msg91");
    this.authKey = config.credentials.authKey ?? "";
    this.senderId = config.credentials.senderId ?? "TPCIND";
    this.dltTemplateId = config.credentials.dltTemplateId ?? "";
  }

  async send(payload: SmsPayload): Promise<NotificationResult> {
    try {
      const response = await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authkey: this.authKey,
        },
        body: JSON.stringify({
          template_id: payload.templateId ?? this.dltTemplateId,
          sender: payload.senderId ?? this.senderId,
          short_url: "0",
          mobiles: payload.to.replace(/^\+/, ""),
          message: payload.message,
        }),
      });

      const data = (await response.json()) as {
        type?: string;
        request_id?: string;
        message?: string;
      };

      if (data.type === "success") {
        return {
          success: true,
          messageId: data.request_id,
          channel: "sms",
          provider: "msg91",
          timestamp: new Date(),
        };
      }

      return {
        success: false,
        channel: "sms",
        provider: "msg91",
        error: data.message ?? "MSG91 API error",
        timestamp: new Date(),
      };
    } catch (err) {
      return {
        success: false,
        channel: "sms",
        provider: "msg91",
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date(),
      };
    }
  }

  validateRecipient(recipient: string): boolean {
    return /^\+?\d{10,15}$/.test(recipient.replace(/[\s-]/g, ""));
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        "https://control.msg91.com/api/v5/report/all",
        {
          headers: { authkey: this.authKey },
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
