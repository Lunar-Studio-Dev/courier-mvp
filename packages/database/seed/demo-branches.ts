import { db } from "../index";
import { branchesTable } from "../schema";
import { count } from "drizzle-orm";

const demoBranches = [
  {
    code: "MUM-HQ",
    name: "Mumbai Head Office",
    type: "Head Office",
    city: "Mumbai",
    state: "Maharashtra",
    address: "Nariman Point, Fort",
    pincode: "400001",
    contactPhone: "9876543210",
    contactEmail: "mumbai@tpcindia.com",
  },
  {
    code: "DEL-RO",
    name: "Delhi Regional Office",
    type: "Regional Office",
    city: "New Delhi",
    state: "Delhi",
    address: "Connaught Place, Block A",
    pincode: "110001",
    contactPhone: "9876543211",
    contactEmail: "delhi@tpcindia.com",
  },
  {
    code: "BLR-RO",
    name: "Bangalore Regional Office",
    type: "Regional Office",
    city: "Bangalore",
    state: "Karnataka",
    address: "MG Road, Brigade Gateway",
    pincode: "560001",
    contactPhone: "9876543212",
    contactEmail: "bangalore@tpcindia.com",
  },
  {
    code: "CHN-HUB",
    name: "Chennai Hub",
    type: "Hub",
    city: "Chennai",
    state: "Tamil Nadu",
    address: "Anna Salai, Teynampet",
    pincode: "600001",
    contactPhone: "9876543213",
    contactEmail: "chennai@tpcindia.com",
  },
  {
    code: "KOL-HUB",
    name: "Kolkata Hub",
    type: "Hub",
    city: "Kolkata",
    state: "West Bengal",
    address: "Park Street, Esplanade",
    pincode: "700001",
    contactPhone: "9876543214",
    contactEmail: "kolkata@tpcindia.com",
  },
  {
    code: "HYD-CC",
    name: "Hyderabad Collection Center",
    type: "Collection Center",
    city: "Hyderabad",
    state: "Telangana",
    address: "Banjara Hills, Road No 12",
    pincode: "500034",
    contactPhone: "9876543215",
    contactEmail: "hyderabad@tpcindia.com",
  },
];

async function seed() {
  console.log("Seeding demo branches...");

  const [existing] = await db.select({ count: count() }).from(branchesTable);

  if (existing && existing.count > 0) {
    console.log(`  Branches already exist (${existing.count} records). Skipping.`);
    process.exit(0);
  }

  await db.insert(branchesTable).values(demoBranches);
  console.log(`  Inserted ${demoBranches.length} demo branches.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Demo branches seed failed:", err);
  process.exit(1);
});
