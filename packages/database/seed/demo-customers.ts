import { db } from "../index";
import { customersTable } from "../schema";
import { count } from "drizzle-orm";

const demoCustomers = [
  {
    fullName: "Rajesh Kumar",
    phone: "9876501001",
    email: "rajesh.kumar@gmail.com",
    address: "42, Linking Road, Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400050",
    idProofType: "AADHAAR",
    idProofNumber: "234567891234",
  },
  {
    fullName: "Priya Sharma",
    phone: "9876501002",
    email: "priya.sharma@gmail.com",
    address: "15, Sector 18, Noida",
    city: "Noida",
    state: "Uttar Pradesh",
    pincode: "201301",
    idProofType: "PAN",
    idProofNumber: "ABCDE1234F",
  },
  {
    fullName: "Amit Patel",
    phone: "9876501003",
    email: "amit.patel@yahoo.com",
    address: "88, CG Road, Navrangpura",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380001",
    idProofType: "AADHAAR",
    idProofNumber: "345678912345",
  },
  {
    fullName: "Sneha Reddy",
    phone: "9876501004",
    email: "sneha.reddy@outlook.com",
    address: "Plot 23, Jubilee Hills",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500034",
    idProofType: "DRIVING_LICENSE",
    idProofNumber: "TS0920210012345",
  },
  {
    fullName: "Mohammed Irfan",
    phone: "9876501005",
    address: "67, Commercial Street",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001",
    idProofType: "VOTER_ID",
    idProofNumber: "KA1234567",
  },
  {
    fullName: "Deepa Nair",
    phone: "9876501006",
    email: "deepa.nair@gmail.com",
    address: "12, MG Road, Ernakulam",
    city: "Kochi",
    state: "Kerala",
    pincode: "682001",
    idProofType: "AADHAAR",
    idProofNumber: "456789123456",
  },
  {
    fullName: "Suresh Menon",
    phone: "9876501007",
    address: "99, Anna Nagar East",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600040",
    idProofType: "PAN",
    idProofNumber: "FGHIJ5678K",
  },
  {
    fullName: "Ananya Ghosh",
    phone: "9876501008",
    email: "ananya.ghosh@gmail.com",
    address: "34, Salt Lake, Sector V",
    city: "Kolkata",
    state: "West Bengal",
    pincode: "700001",
    idProofType: "AADHAAR",
    idProofNumber: "567891234567",
  },
  {
    fullName: "Vikram Singh",
    phone: "9876501009",
    address: "56, MI Road, C-Scheme",
    city: "Jaipur",
    state: "Rajasthan",
    pincode: "302001",
    idProofType: "PASSPORT",
    idProofNumber: "J8765432",
  },
  {
    fullName: "Kavitha Iyer",
    phone: "9876501010",
    email: "kavitha.iyer@yahoo.com",
    address: "21, FC Road, Shivajinagar",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    idProofType: "PAN",
    idProofNumber: "KLMNO9012P",
  },
  {
    fullName: "Arjun Das",
    phone: "9876501011",
    address: "78, Chandni Chowk",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110001",
    idProofType: "AADHAAR",
    idProofNumber: "678912345678",
  },
  {
    fullName: "Meera Joshi",
    phone: "9876501012",
    email: "meera.joshi@gmail.com",
    address: "45, MG Marg, Hazratganj",
    city: "Lucknow",
    state: "Uttar Pradesh",
    pincode: "226001",
    idProofType: "DRIVING_LICENSE",
    idProofNumber: "UP5020210054321",
  },
];

async function seed() {
  console.log("Seeding demo customers...");

  const [existing] = await db.select({ count: count() }).from(customersTable);

  if (existing && existing.count > 0) {
    console.log(`  Customers already exist (${existing.count} records). Skipping.`);
    process.exit(0);
  }

  await db.insert(customersTable).values(demoCustomers);
  console.log(`  Inserted ${demoCustomers.length} demo customers.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Demo customers seed failed:", err);
  process.exit(1);
});
