-- Step 1: Add columns as nullable first (for backfill)
ALTER TABLE "shipments" ADD COLUMN "origin_destination_id" uuid;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "delivery_destination_id" uuid;--> statement-breakpoint

-- Step 2: Insert any missing destinations from existing shipment JSONB data
INSERT INTO "destinations" ("id", "state", "city", "pincode", "is_serviceable")
SELECT gen_random_uuid(), sub."state", sub."city", sub."pincode", true
FROM (
  SELECT DISTINCT sender_address->>'state' AS "state", sender_address->>'city' AS "city", sender_address->>'pincode' AS "pincode"
  FROM "shipments"
  WHERE sender_address->>'pincode' IS NOT NULL
  UNION
  SELECT DISTINCT receiver_address->>'state', receiver_address->>'city', receiver_address->>'pincode'
  FROM "shipments"
  WHERE receiver_address->>'pincode' IS NOT NULL
) sub
WHERE sub."pincode" NOT IN (SELECT "pincode" FROM "destinations");--> statement-breakpoint

-- Step 3: Backfill origin_destination_id from sender_address pincode
UPDATE "shipments" s
SET "origin_destination_id" = d."id"
FROM "destinations" d
WHERE d."pincode" = s."sender_address"->>'pincode';--> statement-breakpoint

-- Step 4: Backfill delivery_destination_id from receiver_address pincode
UPDATE "shipments" s
SET "delivery_destination_id" = d."id"
FROM "destinations" d
WHERE d."pincode" = s."receiver_address"->>'pincode';--> statement-breakpoint

-- Step 5: Make columns NOT NULL
ALTER TABLE "shipments" ALTER COLUMN "origin_destination_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shipments" ALTER COLUMN "delivery_destination_id" SET NOT NULL;--> statement-breakpoint

-- Step 6: Add foreign key constraints
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_origin_destination_id_destinations_id_fk" FOREIGN KEY ("origin_destination_id") REFERENCES "public"."destinations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_delivery_destination_id_destinations_id_fk" FOREIGN KEY ("delivery_destination_id") REFERENCES "public"."destinations"("id") ON DELETE no action ON UPDATE no action;
