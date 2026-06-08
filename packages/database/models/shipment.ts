import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";
import { branchesTable } from "./branch";
import { customersTable } from "./customer";
import { productTypesTable } from "./product-type";
import { serviceTypesTable } from "./service-type";
import { modeTypesTable } from "./mode-type";
import { invoiceTemplatesTable } from "./invoice";

export const shipmentsTable = pgTable("shipments", {
  id: uuid("id").primaryKey().defaultRandom(),

  trackingNumber: varchar("tracking_number", { length: 30 })
    .notNull()
    .unique(),

  branchId: uuid("branch_id")
    .notNull()
    .references(() => branchesTable.id),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => customersTable.id),
  receiverId: uuid("receiver_id")
    .notNull()
    .references(() => customersTable.id),

  senderAddress: jsonb("sender_address").notNull(),
  receiverAddress: jsonb("receiver_address").notNull(),

  productTypeId: uuid("product_type_id")
    .notNull()
    .references(() => productTypesTable.id),
  serviceTypeId: uuid("service_type_id")
    .notNull()
    .references(() => serviceTypesTable.id),
  modeTypeId: uuid("mode_type_id")
    .notNull()
    .references(() => modeTypesTable.id),

  weight: numeric("weight", { precision: 10, scale: 3 }).notNull(),
  declaredValue: numeric("declared_value", { precision: 12, scale: 2 }).notNull(),

  basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
  gstEnabled: boolean("gst_enabled").default(true),
  gstType: varchar("gst_type", { length: 10 }),
  gstRate: numeric("gst_rate", { precision: 5, scale: 2 }),
  gstAmount: numeric("gst_amount", { precision: 12, scale: 2 }),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),

  status: varchar("status", { length: 20 }).notNull().default("BOOKED"),

  invoiceTemplateId: uuid("invoice_template_id").references(
    () => invoiceTemplatesTable.id,
  ),

  bookedAt: timestamp("booked_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectShipment = typeof shipmentsTable.$inferSelect;
export type InsertShipment = typeof shipmentsTable.$inferInsert;

export const shipmentTrackingHistoryTable = pgTable(
  "shipment_tracking_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    shipmentId: uuid("shipment_id")
      .notNull()
      .references(() => shipmentsTable.id),

    status: varchar("status", { length: 20 }).notNull(),
    location: varchar("location", { length: 200 }),
    remarks: text("remarks"),

    timestamp: timestamp("timestamp").defaultNow(),
  },
);

export type SelectShipmentTrackingHistory =
  typeof shipmentTrackingHistoryTable.$inferSelect;
export type InsertShipmentTrackingHistory =
  typeof shipmentTrackingHistoryTable.$inferInsert;
