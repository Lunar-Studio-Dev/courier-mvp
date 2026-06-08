import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
} from "drizzle-orm/pg-core";

export const branchesTable = pgTable("branches", {
  id: uuid("id").primaryKey().defaultRandom(),

  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 30 }).notNull(),

  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  address: text("address"),
  pincode: varchar("pincode", { length: 6 }),

  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),

  contactPhone: varchar("contact_phone", { length: 15 }),
  contactEmail: varchar("contact_email", { length: 255 }),

  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectBranch = typeof branchesTable.$inferSelect;
export type InsertBranch = typeof branchesTable.$inferInsert;
