import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
} from "drizzle-orm/pg-core";

export const modeTypesTable = pgTable("mode_types", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),

  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectModeType = typeof modeTypesTable.$inferSelect;
export type InsertModeType = typeof modeTypesTable.$inferInsert;
