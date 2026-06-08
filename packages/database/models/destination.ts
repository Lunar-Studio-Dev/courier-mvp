import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const destinationsTable = pgTable("destinations", {
  id: uuid("id").primaryKey().defaultRandom(),

  state: varchar("state", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  pincode: varchar("pincode", { length: 6 }).notNull().unique(),

  isServiceable: boolean("is_serviceable").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectDestination = typeof destinationsTable.$inferSelect;
export type InsertDestination = typeof destinationsTable.$inferInsert;
