import { db } from "../index";
import { destinationsTable } from "../schema";
import { count } from "drizzle-orm";

const destinations = [
  // Maharashtra
  { state: "Maharashtra", city: "Mumbai", pincode: "400001" },
  { state: "Maharashtra", city: "Mumbai", pincode: "400050" },
  { state: "Maharashtra", city: "Mumbai", pincode: "400070" },
  { state: "Maharashtra", city: "Pune", pincode: "411001" },
  { state: "Maharashtra", city: "Pune", pincode: "411038" },
  { state: "Maharashtra", city: "Nagpur", pincode: "440001" },
  { state: "Maharashtra", city: "Nashik", pincode: "422001" },
  { state: "Maharashtra", city: "Thane", pincode: "400601" },
  { state: "Maharashtra", city: "Aurangabad", pincode: "431001" },
  // Delhi NCR
  { state: "Delhi", city: "New Delhi", pincode: "110001" },
  { state: "Delhi", city: "New Delhi", pincode: "110020" },
  { state: "Delhi", city: "New Delhi", pincode: "110055" },
  { state: "Delhi", city: "New Delhi", pincode: "110092" },
  // Haryana (NCR)
  { state: "Haryana", city: "Gurugram", pincode: "122001" },
  { state: "Haryana", city: "Faridabad", pincode: "121001" },
  { state: "Haryana", city: "Panipat", pincode: "132103" },
  // Uttar Pradesh
  { state: "Uttar Pradesh", city: "Noida", pincode: "201301" },
  { state: "Uttar Pradesh", city: "Lucknow", pincode: "226001" },
  { state: "Uttar Pradesh", city: "Varanasi", pincode: "221001" },
  { state: "Uttar Pradesh", city: "Agra", pincode: "282001" },
  { state: "Uttar Pradesh", city: "Kanpur", pincode: "208001" },
  { state: "Uttar Pradesh", city: "Ghaziabad", pincode: "201001" },
  // Karnataka
  { state: "Karnataka", city: "Bangalore", pincode: "560001" },
  { state: "Karnataka", city: "Bangalore", pincode: "560034" },
  { state: "Karnataka", city: "Mysore", pincode: "570001" },
  { state: "Karnataka", city: "Mangalore", pincode: "575001" },
  { state: "Karnataka", city: "Hubli", pincode: "580020" },
  // Tamil Nadu
  { state: "Tamil Nadu", city: "Chennai", pincode: "600001" },
  { state: "Tamil Nadu", city: "Chennai", pincode: "600040" },
  { state: "Tamil Nadu", city: "Coimbatore", pincode: "641001" },
  { state: "Tamil Nadu", city: "Madurai", pincode: "625001" },
  { state: "Tamil Nadu", city: "Salem", pincode: "636001" },
  // Telangana
  { state: "Telangana", city: "Hyderabad", pincode: "500001" },
  { state: "Telangana", city: "Hyderabad", pincode: "500034" },
  { state: "Telangana", city: "Warangal", pincode: "506001" },
  { state: "Telangana", city: "Secunderabad", pincode: "500003" },
  // Gujarat
  { state: "Gujarat", city: "Ahmedabad", pincode: "380001" },
  { state: "Gujarat", city: "Surat", pincode: "395001" },
  { state: "Gujarat", city: "Vadodara", pincode: "390001" },
  { state: "Gujarat", city: "Rajkot", pincode: "360001" },
  // Rajasthan
  { state: "Rajasthan", city: "Jaipur", pincode: "302001" },
  { state: "Rajasthan", city: "Jodhpur", pincode: "342001" },
  { state: "Rajasthan", city: "Udaipur", pincode: "313001" },
  { state: "Rajasthan", city: "Kota", pincode: "324001" },
  // West Bengal
  { state: "West Bengal", city: "Kolkata", pincode: "700001" },
  { state: "West Bengal", city: "Kolkata", pincode: "700020" },
  { state: "West Bengal", city: "Howrah", pincode: "711101" },
  { state: "West Bengal", city: "Siliguri", pincode: "734001" },
  // Kerala
  { state: "Kerala", city: "Kochi", pincode: "682001" },
  { state: "Kerala", city: "Thiruvananthapuram", pincode: "695001" },
  { state: "Kerala", city: "Kozhikode", pincode: "673001" },
  // Madhya Pradesh
  { state: "Madhya Pradesh", city: "Bhopal", pincode: "462001" },
  { state: "Madhya Pradesh", city: "Indore", pincode: "452001" },
  { state: "Madhya Pradesh", city: "Jabalpur", pincode: "482001" },
  // Punjab
  { state: "Punjab", city: "Chandigarh", pincode: "160001" },
  { state: "Punjab", city: "Ludhiana", pincode: "141001" },
  { state: "Punjab", city: "Amritsar", pincode: "143001" },
  // Bihar
  { state: "Bihar", city: "Patna", pincode: "800001" },
  { state: "Bihar", city: "Gaya", pincode: "823001" },
  // Odisha
  { state: "Odisha", city: "Bhubaneswar", pincode: "751001" },
  { state: "Odisha", city: "Cuttack", pincode: "753001" },
  // Assam
  { state: "Assam", city: "Guwahati", pincode: "781001" },
  // Jharkhand
  { state: "Jharkhand", city: "Ranchi", pincode: "834001" },
  { state: "Jharkhand", city: "Jamshedpur", pincode: "831001" },
  // Chhattisgarh
  { state: "Chhattisgarh", city: "Raipur", pincode: "492001" },
  // Uttarakhand
  { state: "Uttarakhand", city: "Dehradun", pincode: "248001" },
  // Goa
  { state: "Goa", city: "Panaji", pincode: "403001" },
];

async function seed() {
  console.log("Seeding destinations...");

  const [existing] = await db
    .select({ count: count() })
    .from(destinationsTable);

  if (existing?.count === 0) {
    await db.insert(destinationsTable).values(destinations);
    console.log(`  Inserted ${destinations.length} destinations`);
  } else {
    console.log(
      `  Destinations already seeded (${existing.count} records)`,
    );
  }

  console.log("Destinations seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
