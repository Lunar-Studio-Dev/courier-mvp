import { db } from "../index";
import {
  pricingRulesTable,
  productTypesTable,
  serviceTypesTable,
  modeTypesTable,
  destinationsTable,
} from "../schema";
import { count, asc } from "drizzle-orm";

// ── Multiplier tables ──────────────────────────────────────────────────

const PRODUCT_MULTIPLIERS: Record<string, number> = {
  Documents: 0.7,
  Parcel: 1.0,
  "Bulk Cargo": 0.85,
  Textiles: 0.9,
  Fragile: 1.5,
  Electronics: 1.6,
  Liquid: 1.8,
  Perishable: 2.0,
  "Heavy Goods": 2.5,
};

const SERVICE_MULTIPLIERS: Record<string, number> = {
  Economy: 0.8,
  Standard: 1.0,
  Express: 1.5,
  "Next-Day": 1.8,
  Priority: 2.0,
  "Same-Day": 2.5,
};

const MODE_MULTIPLIERS: Record<string, number> = {
  Road: 1.0,
  Rail: 0.9,
  Multimodal: 1.3,
  Air: 2.0,
};

// ── Distance tiers by region ───────────────────────────────────────────

const REGIONS: Record<string, string[]> = {
  north: ["Delhi", "Haryana", "Punjab", "Uttarakhand", "Rajasthan"],
  central: ["Uttar Pradesh", "Madhya Pradesh"],
  west: ["Maharashtra", "Gujarat", "Goa"],
  south: ["Karnataka", "Tamil Nadu", "Telangana", "Kerala"],
  east: ["West Bengal", "Bihar", "Odisha", "Jharkhand", "Assam", "Chhattisgarh"],
};

function getRegion(state: string): string {
  for (const [region, states] of Object.entries(REGIONS)) {
    if (states.includes(state)) return region;
  }
  return "other";
}

// Base rate per kg for state-to-state (Road, Standard, Parcel)
function getBaseRate(originState: string, destState: string): number {
  if (originState === destState) return 15;

  const oRegion = getRegion(originState);
  const dRegion = getRegion(destState);

  if (oRegion === dRegion) return 25; // same region
  // Adjacent regions
  const adjacent: Record<string, string[]> = {
    north: ["central", "west"],
    central: ["north", "west", "east", "south"],
    west: ["north", "central", "south"],
    south: ["west", "central", "east"],
    east: ["central", "south"],
  };
  if (adjacent[oRegion]?.includes(dRegion)) return 40;
  return 55; // far away
}

// Minimum charge = base_rate × factor
function getMinCharge(baseRate: number): number {
  return Math.round(baseRate * 2.5);
}

// ── Seed ───────────────────────────────────────────────────────────────

async function seed() {
  console.log("Seeding pricing rules...");

  const [existing] = await db.select({ count: count() }).from(pricingRulesTable);
  if ((existing?.count ?? 0) > 0) {
    console.log(`  Pricing rules already seeded (${existing?.count} records). Deleting and re-seeding...`);
    await db.delete(pricingRulesTable);
  }

  // Fetch all types
  const productTypes = await db
    .select({ id: productTypesTable.id, name: productTypesTable.name })
    .from(productTypesTable)
    .orderBy(asc(productTypesTable.name));

  const serviceTypes = await db
    .select({ id: serviceTypesTable.id, name: serviceTypesTable.name })
    .from(serviceTypesTable)
    .orderBy(asc(serviceTypesTable.name));

  const modeTypes = await db
    .select({ id: modeTypesTable.id, name: modeTypesTable.name })
    .from(modeTypesTable)
    .orderBy(asc(modeTypesTable.name));

  // Get unique states from destinations
  const stateRows = await db
    .selectDistinct({ state: destinationsTable.state })
    .from(destinationsTable)
    .orderBy(asc(destinationsTable.state));
  const states = stateRows.map((r) => r.state);

  console.log(`  ${productTypes.length} product types, ${serviceTypes.length} service types, ${modeTypes.length} mode types`);
  console.log(`  ${states.length} states → ${states.length * states.length} state pairs`);

  const typeCombos = productTypes.length * serviceTypes.length * modeTypes.length;
  const totalRules = states.length * states.length * typeCombos;
  console.log(`  ${typeCombos} type combos per route → ${totalRules} total rules`);

  // Generate all rules
  const BATCH_SIZE = 2000;
  let batch: Array<{
    originState: string;
    destinationState: string;
    productTypeId: string;
    serviceTypeId: string;
    modeTypeId: string;
    unitPrice: string;
    minimumCharge: string;
  }> = [];
  let inserted = 0;

  for (const originState of states) {
    for (const destState of states) {
      const baseRate = getBaseRate(originState, destState);

      for (const pt of productTypes) {
        const pMul = PRODUCT_MULTIPLIERS[pt.name] ?? 1.0;

        for (const st of serviceTypes) {
          const sMul = SERVICE_MULTIPLIERS[st.name] ?? 1.0;

          for (const mt of modeTypes) {
            const mMul = MODE_MULTIPLIERS[mt.name] ?? 1.0;

            const unitPrice = baseRate * pMul * sMul * mMul;
            const minCharge = getMinCharge(baseRate) * pMul * sMul * mMul;

            batch.push({
              originState,
              destinationState: destState,
              productTypeId: pt.id,
              serviceTypeId: st.id,
              modeTypeId: mt.id,
              unitPrice: unitPrice.toFixed(2),
              minimumCharge: minCharge.toFixed(2),
            });

            if (batch.length >= BATCH_SIZE) {
              await db.insert(pricingRulesTable).values(batch);
              inserted += batch.length;
              batch = [];
            }
          }
        }
      }
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    await db.insert(pricingRulesTable).values(batch);
    inserted += batch.length;
  }

  console.log(`  Inserted ${inserted} pricing rules`);
  console.log("Pricing rules seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Failed to seed pricing rules:", err);
  process.exit(1);
});
