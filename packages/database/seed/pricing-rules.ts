import { db } from "../index";
import {
  pricingRulesTable,
  productTypesTable,
  serviceTypesTable,
  modeTypesTable,
} from "../schema";
import { count, eq } from "drizzle-orm";

async function getIdByName(
  table: typeof productTypesTable | typeof serviceTypesTable | typeof modeTypesTable,
  name: string,
): Promise<string> {
  const [record] = await db
    .select({ id: table.id })
    .from(table)
    .where(eq(table.name, name))
    .limit(1);
  if (!record) throw new Error(`Not found: ${name}`);
  return record.id;
}

async function seed() {
  console.log("Seeding pricing rules...");

  const [existing] = await db.select({ count: count() }).from(pricingRulesTable);
  if ((existing?.count ?? 0) > 0) {
    console.log(`  Pricing rules already seeded (${existing?.count} records)`);
    process.exit(0);
  }

  const parcelId = await getIdByName(productTypesTable, "Parcel");
  const documentsId = await getIdByName(productTypesTable, "Documents");
  const standardId = await getIdByName(serviceTypesTable, "Standard");
  const expressId = await getIdByName(serviceTypesTable, "Express");
  const roadId = await getIdByName(modeTypesTable, "Road");
  const airId = await getIdByName(modeTypesTable, "Air");
  const railId = await getIdByName(modeTypesTable, "Rail");

  const rules = [
    // Maharashtra -> Delhi
    { originState: "Maharashtra", destinationState: "Delhi", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "45.00", minimumCharge: "100.00" },
    { originState: "Maharashtra", destinationState: "Delhi", productTypeId: parcelId, serviceTypeId: expressId, modeTypeId: airId, unitPrice: "85.00", minimumCharge: "200.00" },
    { originState: "Maharashtra", destinationState: "Delhi", productTypeId: documentsId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "30.00", minimumCharge: "50.00" },
    // Maharashtra -> Karnataka
    { originState: "Maharashtra", destinationState: "Karnataka", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "35.00", minimumCharge: "80.00" },
    { originState: "Maharashtra", destinationState: "Karnataka", productTypeId: parcelId, serviceTypeId: expressId, modeTypeId: airId, unitPrice: "70.00", minimumCharge: "150.00" },
    // Maharashtra -> Tamil Nadu
    { originState: "Maharashtra", destinationState: "Tamil Nadu", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "50.00", minimumCharge: "120.00" },
    { originState: "Maharashtra", destinationState: "Tamil Nadu", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: railId, unitPrice: "40.00", minimumCharge: "100.00" },
    // Maharashtra -> Gujarat
    { originState: "Maharashtra", destinationState: "Gujarat", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "25.00", minimumCharge: "60.00" },
    // Delhi -> Maharashtra
    { originState: "Delhi", destinationState: "Maharashtra", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "45.00", minimumCharge: "100.00" },
    { originState: "Delhi", destinationState: "Maharashtra", productTypeId: documentsId, serviceTypeId: expressId, modeTypeId: airId, unitPrice: "60.00", minimumCharge: "100.00" },
    // Delhi -> Karnataka
    { originState: "Delhi", destinationState: "Karnataka", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "55.00", minimumCharge: "130.00" },
    // Delhi -> UP
    { originState: "Delhi", destinationState: "Uttar Pradesh", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "20.00", minimumCharge: "50.00" },
    { originState: "Delhi", destinationState: "Uttar Pradesh", productTypeId: documentsId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "15.00", minimumCharge: "30.00" },
    // Delhi -> Rajasthan
    { originState: "Delhi", destinationState: "Rajasthan", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "22.00", minimumCharge: "55.00" },
    // Karnataka -> Maharashtra
    { originState: "Karnataka", destinationState: "Maharashtra", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "35.00", minimumCharge: "80.00" },
    // Karnataka -> Delhi
    { originState: "Karnataka", destinationState: "Delhi", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: airId, unitPrice: "80.00", minimumCharge: "180.00" },
    // Karnataka -> Tamil Nadu
    { originState: "Karnataka", destinationState: "Tamil Nadu", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "28.00", minimumCharge: "65.00" },
    // Karnataka -> Telangana
    { originState: "Karnataka", destinationState: "Telangana", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "25.00", minimumCharge: "60.00" },
    // Gujarat -> Maharashtra
    { originState: "Gujarat", destinationState: "Maharashtra", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "25.00", minimumCharge: "60.00" },
    // Gujarat -> Delhi
    { originState: "Gujarat", destinationState: "Delhi", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "40.00", minimumCharge: "90.00" },
    // Tamil Nadu -> Maharashtra
    { originState: "Tamil Nadu", destinationState: "Maharashtra", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "50.00", minimumCharge: "120.00" },
    // Tamil Nadu -> Karnataka
    { originState: "Tamil Nadu", destinationState: "Karnataka", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "28.00", minimumCharge: "65.00" },
    // Intra-state rules
    { originState: "Maharashtra", destinationState: "Maharashtra", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "15.00", minimumCharge: "40.00" },
    { originState: "Delhi", destinationState: "Delhi", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "12.00", minimumCharge: "30.00" },
    { originState: "Karnataka", destinationState: "Karnataka", productTypeId: parcelId, serviceTypeId: standardId, modeTypeId: roadId, unitPrice: "15.00", minimumCharge: "40.00" },
  ];

  await db.insert(pricingRulesTable).values(rules);
  console.log(`  Inserted ${rules.length} pricing rules`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Failed to seed pricing rules:", err);
  process.exit(1);
});
