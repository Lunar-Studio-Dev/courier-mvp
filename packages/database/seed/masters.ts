import { db } from "../index";
import {
  productTypesTable,
  serviceTypesTable,
  modeTypesTable,
} from "../schema";
import { count } from "drizzle-orm";

const productTypes = [
  { name: "Documents", description: "Important documents and papers" },
  { name: "Parcel", description: "General parcels and packages" },
  { name: "Fragile", description: "Fragile items requiring careful handling" },
  { name: "Electronics", description: "Electronic items and gadgets" },
  { name: "Liquid", description: "Liquid goods in sealed containers" },
  { name: "Perishable", description: "Time-sensitive perishable goods" },
  { name: "Heavy Goods", description: "Items exceeding 50kg weight" },
  { name: "Bulk Cargo", description: "Large volume bulk shipments" },
];

const serviceTypes = [
  { name: "Standard", description: "Regular delivery within 5-7 business days" },
  { name: "Express", description: "Fast delivery within 2-3 business days" },
  { name: "Same-Day", description: "Delivery on the same day of booking" },
  { name: "Next-Day", description: "Guaranteed next business day delivery" },
  { name: "Economy", description: "Budget-friendly option with 7-10 day delivery" },
  { name: "Priority", description: "High priority delivery within 24 hours" },
];

const modeTypes = [
  { name: "Air", description: "Air freight transportation" },
  { name: "Rail", description: "Rail cargo transportation" },
  { name: "Road", description: "Surface road transportation" },
  { name: "Multimodal", description: "Combination of multiple transport modes" },
];

async function seed() {
  console.log("Seeding master data...");

  const [ptCount] = await db.select({ count: count() }).from(productTypesTable);
  if (ptCount?.count === 0) {
    await db.insert(productTypesTable).values(productTypes);
    console.log(`  Inserted ${productTypes.length} product types`);
  } else {
    console.log(`  Product types already seeded (${ptCount.count} records)`);
  }

  const [stCount] = await db.select({ count: count() }).from(serviceTypesTable);
  if (stCount?.count === 0) {
    await db.insert(serviceTypesTable).values(serviceTypes);
    console.log(`  Inserted ${serviceTypes.length} service types`);
  } else {
    console.log(`  Service types already seeded (${stCount.count} records)`);
  }

  const [mtCount] = await db.select({ count: count() }).from(modeTypesTable);
  if (mtCount?.count === 0) {
    await db.insert(modeTypesTable).values(modeTypes);
    console.log(`  Inserted ${modeTypes.length} mode types`);
  } else {
    console.log(`  Mode types already seeded (${mtCount.count} records)`);
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
