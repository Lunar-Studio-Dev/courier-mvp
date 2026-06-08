import { notificationConfigService } from "../../services";
import {
  updateNotificationConfigInputSchema,
  notificationConfigListOutputSchema,
  notificationConfigOutputSchema,
  testChannelInputSchema,
  testChannelOutputSchema,
  notificationEventListInputSchema,
  notificationEventListOutputSchema,
  recentEventsInputSchema,
  recentEventsOutputSchema,
} from "@repo/services/notification/model";
import { zodUndefinedModel } from "../../schema";
import { adminProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Notifications"];
const getPath = generatePath("/notifications");

export const notificationRouter = router({
  getConfigs: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/configs"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(notificationConfigListOutputSchema)
    .query(() => notificationConfigService.getAll()),

  updateConfig: adminProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/configs"), tags: TAGS } })
    .input(updateNotificationConfigInputSchema)
    .output(notificationConfigOutputSchema)
    .mutation(({ input }) => notificationConfigService.update(input)),

  testChannel: adminProcedure
    .meta({
      openapi: { method: "POST", path: getPath("/test"), tags: TAGS },
    })
    .input(testChannelInputSchema)
    .output(testChannelOutputSchema)
    .mutation(({ input }) => notificationConfigService.testChannel(input)),

  getEventLog: adminProcedure
    .meta({
      openapi: { method: "GET", path: getPath("/events"), tags: TAGS },
    })
    .input(notificationEventListInputSchema)
    .output(notificationEventListOutputSchema)
    .query(({ input }) => notificationConfigService.getEventLog(input)),

  recentEvents: adminProcedure
    .meta({
      openapi: { method: "GET", path: getPath("/events/recent"), tags: TAGS },
    })
    .input(recentEventsInputSchema)
    .output(recentEventsOutputSchema)
    .query(({ input }) => notificationConfigService.getRecentEvents(input.since)),
});
