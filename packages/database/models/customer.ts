import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const customersTable = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),

  fullName: varchar("full_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  email: varchar("email", { length: 255 }),

  userId: uuid("user_id").references(() => usersTable.id),

  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  pincode: varchar("pincode", { length: 6 }).notNull(),

  idProofType: varchar("id_proof_type", { length: 20 }).notNull(),
  idProofNumber: varchar("id_proof_number", { length: 50 }).notNull(),
  idProofImageUrl: text("id_proof_image_url"),

  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectCustomer = typeof customersTable.$inferSelect;
export type InsertCustomer = typeof customersTable.$inferInsert;
