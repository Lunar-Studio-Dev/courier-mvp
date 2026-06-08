import type { NotificationAdapter } from "../../adapter";
import type { WhatsAppPayload, ProviderConfig } from "../../types";
import { GupshupWhatsAppAdapter } from "./providers/gupshup";
import { TwilioWhatsAppAdapter } from "./providers/twilio";
import { MetaWhatsAppAdapter } from "./providers/meta";

export class WhatsAppNotificationFactory {
  static createAdapter(
    provider: string,
    config: ProviderConfig,
  ): NotificationAdapter<WhatsAppPayload> {
    switch (provider) {
      case "gupshup":
        return new GupshupWhatsAppAdapter(config);
      case "twilio":
        return new TwilioWhatsAppAdapter(config);
      case "meta":
        return new MetaWhatsAppAdapter(config);
      default:
        throw new Error(`Unknown WhatsApp provider: ${provider}`);
    }
  }
}
