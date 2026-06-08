import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  jsonb,
} from "drizzle-orm/pg-core";

export const notificationConfigsTable = pgTable("notification_configs", {
  id: uuid("id").primaryKey().defaultRandom(),

  channel: varchar("channel", { length: 20 }).notNull(),
  provider: varchar("provider", { length: 30 }).notNull(),
  isActive: boolean("is_active").default(false),

  credentials: jsonb("credentials").notNull(),
  settings: jsonb("settings"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectNotificationConfig =
  typeof notificationConfigsTable.$inferSelect;
export type InsertNotificationConfig =
  typeof notificationConfigsTable.$inferInsert;

export const notificationEventsTable = pgTable("notification_events", {
  id: uuid("id").primaryKey().defaultRandom(),

  eventType: varchar("event_type", { length: 30 }).notNull(),
  channel: varchar("channel", { length: 20 }).notNull(),
  provider: varchar("provider", { length: 30 }).notNull(),
  recipient: varchar("recipient", { length: 255 }).notNull(),

  status: varchar("status", { length: 20 }).notNull(),
  messageId: varchar("message_id", { length: 255 }),
  error: text("error"),

  sentAt: timestamp("sent_at").defaultNow(),
});

export type SelectNotificationEvent =
  typeof notificationEventsTable.$inferSelect;
export type InsertNotificationEvent =
  typeof notificationEventsTable.$inferInsert;
