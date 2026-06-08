CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(30) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"address" text,
	"pincode" varchar(6),
	"latitude" varchar(20),
	"longitude" varchar(20),
	"contact_phone" varchar(15),
	"contact_email" varchar(255),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "branches_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"phone" varchar(15) NOT NULL,
	"email" varchar(255),
	"address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"pincode" varchar(6) NOT NULL,
	"id_proof_type" varchar(20) NOT NULL,
	"id_proof_number" varchar(50) NOT NULL,
	"id_proof_image_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "destinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"pincode" varchar(6) NOT NULL,
	"is_serviceable" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "destinations_pincode_unique" UNIQUE("pincode")
);
--> statement-breakpoint
CREATE TABLE "product_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "product_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "service_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "service_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "mode_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "mode_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"origin_state" varchar(100) NOT NULL,
	"origin_city" varchar(100),
	"destination_state" varchar(100) NOT NULL,
	"destination_city" varchar(100),
	"product_type_id" uuid NOT NULL,
	"service_type_id" uuid NOT NULL,
	"mode_type_id" uuid NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"minimum_charge" numeric(10, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "shipment_tracking_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"status" varchar(20) NOT NULL,
	"location" varchar(200),
	"remarks" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracking_number" varchar(30) NOT NULL,
	"branch_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"sender_address" jsonb NOT NULL,
	"receiver_address" jsonb NOT NULL,
	"product_type_id" uuid NOT NULL,
	"service_type_id" uuid NOT NULL,
	"mode_type_id" uuid NOT NULL,
	"weight" numeric(10, 3) NOT NULL,
	"declared_value" numeric(12, 2) NOT NULL,
	"base_price" numeric(12, 2) NOT NULL,
	"gst_enabled" boolean DEFAULT true,
	"gst_type" varchar(10),
	"gst_rate" numeric(5, 2),
	"gst_amount" numeric(12, 2),
	"total_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'BOOKED' NOT NULL,
	"invoice_template_id" uuid,
	"booked_at" timestamp DEFAULT now(),
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "shipments_tracking_number_unique" UNIQUE("tracking_number")
);
--> statement-breakpoint
CREATE TABLE "invoice_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "invoice_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "invoice_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"category_id" uuid NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"show_qr" boolean DEFAULT true,
	"qr_position" varchar(20),
	"layout" jsonb NOT NULL,
	"colors" jsonb NOT NULL,
	"typography" jsonb NOT NULL,
	"visible_fields" jsonb NOT NULL,
	"header_config" jsonb,
	"footer_config" jsonb,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notification_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel" varchar(20) NOT NULL,
	"provider" varchar(30) NOT NULL,
	"is_active" boolean DEFAULT false,
	"credentials" jsonb NOT NULL,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notification_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(30) NOT NULL,
	"channel" varchar(20) NOT NULL,
	"provider" varchar(30) NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"status" varchar(20) NOT NULL,
	"message_id" varchar(255),
	"error" text,
	"sent_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_product_type_id_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."product_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_mode_type_id_mode_types_id_fk" FOREIGN KEY ("mode_type_id") REFERENCES "public"."mode_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_tracking_history" ADD CONSTRAINT "shipment_tracking_history_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_sender_id_customers_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_receiver_id_customers_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_product_type_id_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."product_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_mode_type_id_mode_types_id_fk" FOREIGN KEY ("mode_type_id") REFERENCES "public"."mode_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_invoice_template_id_invoice_templates_id_fk" FOREIGN KEY ("invoice_template_id") REFERENCES "public"."invoice_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_templates" ADD CONSTRAINT "invoice_templates_category_id_invoice_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."invoice_categories"("id") ON DELETE no action ON UPDATE no action;