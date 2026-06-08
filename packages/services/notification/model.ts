import { z } from "zod";

export const notificationChannelEnum = z.enum(["email", "sms", "whatsapp"]);
export type NotificationChannelType = z.infer<typeof notificationChannelEnum>;

export const updateNotificationConfigInputSchema = z.object({
  channel: notificationChannelEnum,
  provider: z.string().min(1).max(30),
  isActive: z.boolean(),
  credentials: z.record(z.string(), z.string()),
  settings: z.record(z.string(), z.string()).optional(),
});
export type UpdateNotificationConfigInput = z.infer<
  typeof updateNotificationConfigInputSchema
>;

export const notificationConfigOutputSchema = z.object({
  id: z.string(),
  channel: z.string(),
  provider: z.string(),
  isActive: z.boolean().nullable(),
  credentials: z.record(z.string(), z.string()),
  settings: z.record(z.string(), z.string()).nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});
export type NotificationConfigOutput = z.infer<
  typeof notificationConfigOutputSchema
>;

export const notificationConfigListOutputSchema = z.array(
  notificationConfigOutputSchema,
);

export const testChannelInputSchema = z.object({
  channel: notificationChannelEnum,
  testRecipient: z.string().min(1),
});
export type TestChannelInput = z.infer<typeof testChannelInputSchema>;

export const testChannelOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const notificationEventListInputSchema = z.object({
  channel: notificationChannelEnum.optional(),
  status: z.enum(["SENT", "FAILED"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});
export type NotificationEventListInput = z.infer<
  typeof notificationEventListInputSchema
>;

export const notificationEventOutputSchema = z.object({
  id: z.string(),
  eventType: z.string(),
  channel: z.string(),
  provider: z.string(),
  recipient: z.string(),
  status: z.string(),
  messageId: z.string().nullable(),
  error: z.string().nullable(),
  sentAt: z.date().nullable(),
});

export const notificationEventListOutputSchema = z.object({
  data: z.array(notificationEventOutputSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type NotificationEventListOutput = z.infer<
  typeof notificationEventListOutputSchema
>;
