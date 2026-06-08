import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const invoiceCategoriesTable = pgTable("invoice_categories", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),

  createdAt: timestamp("created_at").defaultNow(),
});

export type SelectInvoiceCategory =
  typeof invoiceCategoriesTable.$inferSelect;
export type InsertInvoiceCategory =
  typeof invoiceCategoriesTable.$inferInsert;

export const invoiceTemplatesTable = pgTable("invoice_templates", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: varchar("name", { length: 100 }).notNull(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => invoiceCategoriesTable.id),

  width: integer("width").notNull(),
  height: integer("height").notNull(),

  showQR: boolean("show_qr").default(true),
  qrPosition: varchar("qr_position", { length: 20 }),

  layout: jsonb("layout").notNull(),
  colors: jsonb("colors").notNull(),
  typography: jsonb("typography").notNull(),
  visibleFields: jsonb("visible_fields").notNull(),
  headerConfig: jsonb("header_config"),
  footerConfig: jsonb("footer_config"),

  isDefault: boolean("is_default").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectInvoiceTemplate =
  typeof invoiceTemplatesTable.$inferSelect;
export type InsertInvoiceTemplate =
  typeof invoiceTemplatesTable.$inferInsert;
