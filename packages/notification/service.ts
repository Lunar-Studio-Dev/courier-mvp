import { db } from "@repo/database";
import { notificationConfigsTable, notificationEventsTable } from "@repo/database/schema";
import { eq } from "drizzle-orm";

import type { NotificationAdapter } from "./adapter";
import type {
  NotificationChannel,
  NotificationResult,
  EmailPayload,
  SmsPayload,
  WhatsAppPayload,
  ProviderConfig,
  ShipmentBookedData,
  StatusUpdateData,
  DeliveryConfirmationData,
} from "./types";

import { EmailNotificationFactory } from "./channels/email/factory";
import { SmsNotificationFactory } from "./channels/sms/factory";
import { WhatsAppNotificationFactory } from "./channels/whatsapp/factory";
import { MockNotificationAdapter } from "./channels/mock/adapter";

import {
  getShipmentBookedEmail,
  getShipmentBookedSms,
  getShipmentBookedWhatsApp,
} from "./templates/shipment-booked";
import {
  getStatusUpdateEmail,
  getStatusUpdateSms,
  getStatusUpdateWhatsApp,
} from "./templates/status-update";
import {
  getDeliveryConfirmationEmail,
  getDeliveryConfirmationSms,
  getDeliveryConfirmationWhatsApp,
} from "./templates/delivery-confirmation";

interface ActiveAdapter {
  channel: NotificationChannel;
  provider: string;
  adapter: NotificationAdapter<EmailPayload | SmsPayload | WhatsAppPayload>;
}

export class NotificationService {
  private async getActiveAdapters(): Promise<ActiveAdapter[]> {
    const configs = await db
      .select()
      .from(notificationConfigsTable)
      .where(eq(notificationConfigsTable.isActive, true));

    const adapters: ActiveAdapter[] = [];

    for (const config of configs) {
      const providerConfig: ProviderConfig = {
        credentials: (config.credentials as Record<string, string>) ?? {},
        settings: (config.settings as Record<string, string>) ?? undefined,
      };

      try {
        let adapter: NotificationAdapter<EmailPayload | SmsPayload | WhatsAppPayload>;
        switch (config.channel) {
          case "email":
            adapter = EmailNotificationFactory.createAdapter(config.provider, providerConfig);
            break;
          case "sms":
            adapter = SmsNotificationFactory.createAdapter(config.provider, providerConfig);
            break;
          case "whatsapp":
            adapter = WhatsAppNotificationFactory.createAdapter(config.provider, providerConfig);
            break;
          default:
            continue;
        }
        adapters.push({
          channel: config.channel as NotificationChannel,
          provider: config.provider,
          adapter,
        });
      } catch {
        // Skip adapters that fail to initialize
      }
    }

    // Fallback to mock SMS adapter when no real providers are configured
    if (adapters.length === 0) {
      adapters.push({
        channel: "sms",
        provider: "mock",
        adapter: new MockNotificationAdapter("sms") as any,
      });
    }

    return adapters;
  }

  private async logEvent(event: {
    eventType: string;
    channel: string;
    provider: string;
    recipient: string;
    status: string;
    messageId?: string;
    error?: string;
  }): Promise<void> {
    try {
      await db.insert(notificationEventsTable).values({
        eventType: event.eventType,
        channel: event.channel,
        provider: event.provider,
        recipient: event.recipient,
        status: event.status,
        messageId: event.messageId ?? null,
        error: event.error ?? null,
      });
    } catch {
      // Don't let logging failures propagate
    }
  }

  private async sendAndLog(
    eventType: string,
    adapters: ActiveAdapter[],
    getPayload: (channel: NotificationChannel) => { payload: EmailPayload | SmsPayload | WhatsAppPayload; recipient: string } | null,
  ): Promise<NotificationResult[]> {
    const tasks = adapters.map(async ({ channel, provider, adapter }) => {
      const payloadInfo = getPayload(channel);
      if (!payloadInfo || !payloadInfo.recipient) {
        return {
          success: false,
          channel,
          provider,
          error: "No recipient for this channel",
          timestamp: new Date(),
        } as NotificationResult;
      }

      const result = await adapter.send(payloadInfo.payload);

      await this.logEvent({
        eventType,
        channel,
        provider,
        recipient: payloadInfo.recipient,
        status: result.success ? "SENT" : "FAILED",
        messageId: result.messageId,
        error: result.error,
      });

      return result;
    });

    const results = await Promise.allSettled(tasks);
    return results.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : {
            success: false,
            channel: "email" as NotificationChannel,
            provider: "unknown",
            error: r.reason instanceof Error ? r.reason.message : "Unknown error",
            timestamp: new Date(),
          },
    );
  }

  async sendShipmentBooked(data: ShipmentBookedData): Promise<NotificationResult[]> {
    const adapters = await this.getActiveAdapters();

    return this.sendAndLog("SHIPMENT_BOOKED", adapters, (channel) => {
      switch (channel) {
        case "email": {
          const payload = getShipmentBookedEmail(data);
          return payload.to ? { payload, recipient: payload.to } : null;
        }
        case "sms": {
          const payload = getShipmentBookedSms(data);
          return payload.to ? { payload, recipient: payload.to } : null;
        }
        case "whatsapp": {
          const payload = getShipmentBookedWhatsApp(data);
          return payload.to ? { payload, recipient: payload.to } : null;
        }
        default:
          return null;
      }
    });
  }

  async sendStatusUpdate(data: StatusUpdateData): Promise<NotificationResult[]> {
    const adapters = await this.getActiveAdapters();

    return this.sendAndLog("STATUS_UPDATE", adapters, (channel) => {
      switch (channel) {
        case "email": {
          const payload = getStatusUpdateEmail(data);
          return payload.to ? { payload, recipient: payload.to } : null;
        }
        case "sms": {
          const payload = getStatusUpdateSms(data);
          return payload.to ? { payload, recipient: payload.to } : null;
        }
        case "whatsapp": {
          const payload = getStatusUpdateWhatsApp(data);
          return payload.to ? { payload, recipient: payload.to } : null;
        }
        default:
          return null;
      }
    });
  }

  async sendDeliveryConfirmation(data: DeliveryConfirmationData): Promise<NotificationResult[]> {
    const adapters = await this.getActiveAdapters();

    return this.sendAndLog("DELIVERED", adapters, (channel) => {
      switch (channel) {
        case "email": {
          const payload = getDeliveryConfirmationEmail(data);
          return payload.to ? { payload, recipient: payload.to } : null;
        }
        case "sms": {
          const payload = getDeliveryConfirmationSms(data);
          return payload.to ? { payload, recipient: payload.to } : null;
        }
        case "whatsapp": {
          const payload = getDeliveryConfirmationWhatsApp(data);
          return payload.to ? { payload, recipient: payload.to } : null;
        }
        default:
          return null;
      }
    });
  }
}
