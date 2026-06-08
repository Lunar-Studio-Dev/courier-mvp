import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const otpTable = pgTable("otps", {
  id: uuid("id").primaryKey().defaultRandom(),

  phone: varchar("phone", { length: 15 }).notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  attempts: integer("attempts").default(0),

  createdAt: timestamp("created_at").defaultNow(),
});

export type SelectOtp = typeof otpTable.$inferSelect;
export type InsertOtp = typeof otpTable.$inferInsert;
