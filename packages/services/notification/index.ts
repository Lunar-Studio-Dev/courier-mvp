import { db } from "@repo/database";
import {
  notificationConfigsTable,
  notificationEventsTable,
} from "@repo/database/schema";
import { eq, and, count, desc, gte, lte, SQL } from "drizzle-orm";
import {
  EmailNotificationFactory,
  SmsNotificationFactory,
  WhatsAppNotificationFactory,
} from "@repo/notification";
import type { ProviderConfig } from "@repo/notification";
import type {
  UpdateNotificationConfigInput,
  NotificationConfigOutput,
  TestChannelInput,
  NotificationEventListInput,
  NotificationEventListOutput,
} from "./model";

function maskCredentials(
  creds: Record<string, string>,
): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(creds)) {
    if (typeof value === "string" && value.length > 4) {
      masked[key] = "*".repeat(value.length - 4) + value.slice(-4);
    } else {
      masked[key] = "****";
    }
  }
  return masked;
}

class NotificationConfigService {
  async getAll(): Promise<NotificationConfigOutput[]> {
    const configs = await db.select().from(notificationConfigsTable);
    return configs.map((c) => ({
      id: c.id,
      channel: c.channel,
      provider: c.provider,
      isActive: c.isActive,
      credentials: maskCredentials(
        (c.credentials as Record<string, string>) ?? {},
      ),
      settings: (c.settings as Record<string, string>) ?? null,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  async update(
    input: UpdateNotificationConfigInput,
  ): Promise<NotificationConfigOutput> {
    const [existing] = await db
      .select()
      .from(notificationConfigsTable)
      .where(eq(notificationConfigsTable.channel, input.channel));

    let id: string;

    if (existing) {
      await db
        .update(notificationConfigsTable)
        .set({
          provider: input.provider,
          isActive: input.isActive,
          credentials: input.credentials,
          settings: input.settings ?? null,
        })
        .where(eq(notificationConfigsTable.id, existing.id));
      id = existing.id;
    } else {
      const [row] = await db
        .insert(notificationConfigsTable)
        .values({
          channel: input.channel,
          provider: input.provider,
          isActive: input.isActive,
          credentials: input.credentials,
          settings: input.settings ?? null,
        })
        .returning({ id: notificationConfigsTable.id });
      id = row!.id;
    }

    const [config] = await db
      .select()
      .from(notificationConfigsTable)
      .where(eq(notificationConfigsTable.id, id));

    return {
      id: config!.id,
      channel: config!.channel,
      provider: config!.provider,
      isActive: config!.isActive,
      credentials: maskCredentials(
        (config!.credentials as Record<string, string>) ?? {},
      ),
      settings: (config!.settings as Record<string, string>) ?? null,
      createdAt: config!.createdAt,
      updatedAt: config!.updatedAt,
    };
  }

  async testChannel(
    input: TestChannelInput,
  ): Promise<{ success: boolean; message: string }> {
    const [config] = await db
      .select()
      .from(notificationConfigsTable)
      .where(eq(notificationConfigsTable.channel, input.channel));

    if (!config) {
      return {
        success: false,
        message: `No configuration found for ${input.channel}. Save a configuration first.`,
      };
    }

    const providerConfig: ProviderConfig = {
      credentials: (config.credentials as Record<string, string>) ?? {},
      settings: (config.settings as Record<string, string>) ?? undefined,
    };

    try {
      let result;
      switch (input.channel) {
        case "email": {
          const adapter = EmailNotificationFactory.createAdapter(
            config.provider,
            providerConfig,
          );
          result = await adapter.send({
            to: input.testRecipient,
            subject: "TPC India - Test Notification",
            body: "<h2>Test Email</h2><p>This is a test email from TPC India notification system.</p>",
            textBody:
              "This is a test email from TPC India notification system.",
          });
          break;
        }
        case "sms": {
          const adapter = SmsNotificationFactory.createAdapter(
            config.provider,
            providerConfig,
          );
          result = await adapter.send({
            to: input.testRecipient,
            message:
              "TPC India: This is a test SMS from the notification system.",
          });
          break;
        }
        case "whatsapp": {
          const adapter = WhatsAppNotificationFactory.createAdapter(
            config.provider,
            providerConfig,
          );
          result = await adapter.send({
            to: input.testRecipient,
            templateName: "test_notification",
            templateLanguage: "en",
            templateParams: ["TPC India", "Test"],
          });
          break;
        }
      }

      if (result?.success) {
        return {
          success: true,
          message: `Test ${input.channel} sent successfully via ${config.provider}`,
        };
      }
      return {
        success: false,
        message: result?.error ?? "Failed to send test notification",
      };
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error ? err.message : "Unknown error during test",
      };
    }
  }

  async getEventLog(
    input: NotificationEventListInput,
  ): Promise<NotificationEventListOutput> {
    const { channel, status, dateFrom, dateTo, page, limit } = input;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (channel) {
      conditions.push(eq(notificationEventsTable.channel, channel));
    }
    if (status) {
      conditions.push(eq(notificationEventsTable.status, status));
    }
    if (dateFrom) {
      conditions.push(gte(notificationEventsTable.sentAt, new Date(dateFrom)));
    }
    if (dateTo) {
      conditions.push(lte(notificationEventsTable.sentAt, new Date(dateTo)));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(notificationEventsTable)
        .where(where)
        .orderBy(desc(notificationEventsTable.sentAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(notificationEventsTable).where(where),
    ]);

    return {
      data: data.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        channel: e.channel,
        provider: e.provider,
        recipient: e.recipient,
        status: e.status,
        messageId: e.messageId,
        error: e.error,
        sentAt: e.sentAt,
      })),
      total: totalResult[0]?.count ?? 0,
      page,
      limit,
    };
  }
}

export default NotificationConfigService;
