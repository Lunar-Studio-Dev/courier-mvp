import { NotificationAdapter } from "../../../adapter";
import type {
  WhatsAppPayload,
  NotificationResult,
  ProviderConfig,
} from "../../../types";

export class GupshupWhatsAppAdapter extends NotificationAdapter<WhatsAppPayload> {
  private apiKey: string;
  private appName: string;
  private sourceNumber: string;

  constructor(config: ProviderConfig) {
    super("whatsapp", "gupshup");
    this.apiKey = config.credentials.apiKey ?? "";
    this.appName = config.credentials.appName ?? "";
    this.sourceNumber = config.credentials.sourceNumber ?? "";
  }

  async send(payload: WhatsAppPayload): Promise<NotificationResult> {
    try {
      const body = new URLSearchParams({
        channel: "whatsapp",
        source: this.sourceNumber,
        destination: payload.to.replace(/^\+/, ""),
        "src.name": this.appName,
        template: JSON.stringify({
          id: payload.templateName,
          params: payload.templateParams,
        }),
      });

      const response = await fetch(
        "https://api.gupshup.io/wa/api/v1/template/msg",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            apikey: this.apiKey,
          },
          body: body.toString(),
        },
      );

      const data = (await response.json()) as {
        status?: string;
        messageId?: string;
        message?: string;
      };

      if (response.ok && data.status === "submitted") {
        return {
          success: true,
          messageId: data.messageId,
          channel: "whatsapp",
          provider: "gupshup",
          timestamp: new Date(),
        };
      }

      return {
        success: false,
        channel: "whatsapp",
        provider: "gupshup",
        error: data.message ?? "Gupshup API error",
        timestamp: new Date(),
      };
    } catch (err) {
      return {
        success: false,
        channel: "whatsapp",
        provider: "gupshup",
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
        "https://api.gupshup.io/wa/api/v1/wallet/balance",
        { headers: { apikey: this.apiKey } },
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
