import crypto from "crypto";
import { db } from "../index";
import { usersTable } from "../schema";
import { eq } from "drizzle-orm";

function hashPassword(password: string, salt: string): string {
  return crypto.createHmac("sha256", salt).update(password).digest("hex");
}

async function seedAdmin() {
  const email = "admin@tpcindia.com";

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.log("Admin user already exists, skipping.");
    process.exit(0);
  }

  const salt = crypto.randomBytes(32).toString("hex");
  const password = hashPassword("admin123", salt);

  await db.insert(usersTable).values({
    fullName: "Admin",
    email,
    password,
    salt,
    role: "admin",
  });

  console.log("Admin user created:");
  console.log("  Email: admin@tpcindia.com");
  console.log("  Password: admin123");
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});
