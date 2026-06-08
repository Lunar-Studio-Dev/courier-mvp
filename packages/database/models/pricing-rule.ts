import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";
import { productTypesTable } from "./product-type";
import { serviceTypesTable } from "./service-type";
import { modeTypesTable } from "./mode-type";

export const pricingRulesTable = pgTable("pricing_rules", {
  id: uuid("id").primaryKey().defaultRandom(),

  originState: varchar("origin_state", { length: 100 }).notNull(),
  originCity: varchar("origin_city", { length: 100 }),
  destinationState: varchar("destination_state", { length: 100 }).notNull(),
  destinationCity: varchar("destination_city", { length: 100 }),

  productTypeId: uuid("product_type_id")
    .notNull()
    .references(() => productTypesTable.id),
  serviceTypeId: uuid("service_type_id")
    .notNull()
    .references(() => serviceTypesTable.id),
  modeTypeId: uuid("mode_type_id")
    .notNull()
    .references(() => modeTypesTable.id),

  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  minimumCharge: numeric("minimum_charge", { precision: 10, scale: 2 }).default(
    "0",
  ),

  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectPricingRule = typeof pricingRulesTable.$inferSelect;
export type InsertPricingRule = typeof pricingRulesTable.$inferInsert;
