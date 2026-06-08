import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { count, sql } from "drizzle-orm";
import {
  customersTable,
  branchesTable,
  productTypesTable,
  serviceTypesTable,
  modeTypesTable,
  shipmentsTable,
  shipmentTrackingHistoryTable,
} from "@repo/database/schema";

const db = drizzle(process.env.DATABASE_URL!);

const DEMO_TRACKING_PREFIX = "TPCDEMO";

const STATUS_REMARKS: Record<string, string> = {
  BOOKED: "Shipment booked",
  PICKED_UP: "Package picked up from sender",
  IN_TRANSIT: "In transit to destination hub",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered to receiver",
  CANCELLED: "Shipment cancelled by sender",
  RETURNED: "Returned to sender",
};

// 150 shipments with realistic distribution
const STATUS_DISTRIBUTION = [
  { status: "DELIVERED", count: 65 },
  { status: "IN_TRANSIT", count: 25 },
  { status: "OUT_FOR_DELIVERY", count: 15 },
  { status: "BOOKED", count: 15 },
  { status: "PICKED_UP", count: 12 },
  { status: "CANCELLED", count: 10 },
  { status: "RETURNED", count: 8 },
];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - randomBetween(1, daysAgo));
  d.setHours(randomBetween(8, 20), randomBetween(0, 59), 0, 0);
  return d;
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// Distribute items across all options for better pie charts
function pickRoundRobin<T>(arr: T[], index: number): T {
  return arr[index % arr.length]!;
}

async function seed() {
  console.log("Seeding demo shipments...");

  const [existing] = await db
    .select({ count: count() })
    .from(shipmentsTable)
    .where(sql`${shipmentsTable.trackingNumber} LIKE ${DEMO_TRACKING_PREFIX + "%"}`);

  if (existing && existing.count > 0) {
    console.log(`  Demo shipments already exist (${existing.count} records). Skipping.`);
    console.log("  To re-seed, delete existing demo shipments first.");
    process.exit(0);
  }

  const customers = await db.select().from(customersTable);
  const branches = await db.select().from(branchesTable);
  const productTypes = await db.select().from(productTypesTable);
  const serviceTypes = await db.select().from(serviceTypesTable);
  const modeTypes = await db.select().from(modeTypesTable);

  if (customers.length < 2) {
    console.error("  Need at least 2 customers. Run: pnpm db:seed:demo-customers");
    process.exit(1);
  }
  if (branches.length === 0) {
    console.error("  No branches found. Run: pnpm db:seed:demo-branches");
    process.exit(1);
  }
  if (productTypes.length === 0 || serviceTypes.length === 0 || modeTypes.length === 0) {
    console.error("  Missing master data. Run: pnpm db:seed");
    process.exit(1);
  }

  console.log(`  Found ${customers.length} customers, ${branches.length} branches`);
  console.log(`  ${productTypes.length} product types, ${serviceTypes.length} service types, ${modeTypes.length} mode types`);

  let seqNum = 1;
  let totalCreated = 0;
  let globalIndex = 0;

  for (const { status: targetStatus, count: shipmentCount } of STATUS_DISTRIBUTION) {
    for (let i = 0; i < shipmentCount; i++) {
      const sender = pickRandom(customers);
      let receiver = pickRandom(customers);
      while (receiver.id === sender.id && customers.length > 1) {
        receiver = pickRandom(customers);
      }

      // Round-robin to ensure all types appear in analytics
      const branch = pickRoundRobin(branches, globalIndex);
      const productType = pickRoundRobin(productTypes, globalIndex);
      const serviceType = pickRoundRobin(serviceTypes, globalIndex);
      const modeType = pickRoundRobin(modeTypes, globalIndex);
      globalIndex++;

      const weight = (Math.random() * 15 + 0.5).toFixed(3);
      const declaredValue = randomBetween(500, 50000).toFixed(2);
      const basePrice = randomBetween(200, 3000).toFixed(2);
      const gstEnabled = Math.random() > 0.1;
      const gstType = sender.state === receiver.state ? "CGST+SGST" : "IGST";
      const gstRate = "18.00";
      const gstAmount = gstEnabled
        ? (parseFloat(basePrice) * 0.18).toFixed(2)
        : "0.00";
      const totalAmount = (
        parseFloat(basePrice) + parseFloat(gstAmount)
      ).toFixed(2);

      const trackingNumber = `${DEMO_TRACKING_PREFIX}${seqNum.toString().padStart(5, "0")}`;
      seqNum++;

      // Spread shipments across 90 days
      const bookedAt = randomDate(90);

      const senderAddress = {
        fullName: sender.fullName,
        phone: sender.phone,
        address: sender.address,
        city: sender.city,
        state: sender.state,
        pincode: sender.pincode,
      };

      const receiverAddress = {
        fullName: receiver.fullName,
        phone: receiver.phone,
        address: receiver.address,
        city: receiver.city,
        state: receiver.state,
        pincode: receiver.pincode,
      };

      const deliveredAt =
        targetStatus === "DELIVERED"
          ? addHours(bookedAt, randomBetween(24, 168))
          : null;

      const [shipment] = await db
        .insert(shipmentsTable)
        .values({
          trackingNumber,
          branchId: branch.id,
          senderId: sender.id,
          receiverId: receiver.id,
          senderAddress,
          receiverAddress,
          productTypeId: productType.id,
          serviceTypeId: serviceType.id,
          modeTypeId: modeType.id,
          weight,
          declaredValue,
          basePrice,
          gstEnabled,
          gstType: gstEnabled ? gstType : null,
          gstRate: gstEnabled ? gstRate : null,
          gstAmount,
          totalAmount,
          status: targetStatus,
          bookedAt,
          deliveredAt,
        })
        .returning({ id: shipmentsTable.id });

      const normalFlow = ["BOOKED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];
      const isTerminal = targetStatus === "CANCELLED" || targetStatus === "RETURNED";

      let statusIndex = normalFlow.indexOf(targetStatus);
      if (isTerminal) {
        statusIndex = randomBetween(0, 2);
      }

      let historyTime = bookedAt;
      const historyEntries = [];

      for (let si = 0; si <= statusIndex; si++) {
        historyEntries.push({
          shipmentId: shipment!.id,
          status: normalFlow[si]!,
          location: si === 0 ? sender.city : si >= 3 ? receiver.city : branch.city,
          remarks: STATUS_REMARKS[normalFlow[si]!],
          timestamp: historyTime,
        });
        historyTime = addHours(historyTime, randomBetween(4, 48));
      }

      if (isTerminal) {
        historyEntries.push({
          shipmentId: shipment!.id,
          status: targetStatus,
          location: targetStatus === "CANCELLED" ? sender.city : branch.city,
          remarks: STATUS_REMARKS[targetStatus],
          timestamp: historyTime,
        });
      }

      if (historyEntries.length > 0) {
        await db.insert(shipmentTrackingHistoryTable).values(historyEntries);
      }

      totalCreated++;
    }
  }

  console.log(`  Created ${totalCreated} demo shipments with tracking history.`);
  console.log("  Tracking numbers: TPCDEMO00001 - TPCDEMO" + (seqNum - 1).toString().padStart(5, "0"));
  console.log("Demo shipment seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Demo seed failed:", err);
  process.exit(1);
});
