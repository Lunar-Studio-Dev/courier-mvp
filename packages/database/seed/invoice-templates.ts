import { db } from "../index";
import { invoiceCategoriesTable, invoiceTemplatesTable } from "../schema";
import { count } from "drizzle-orm";

async function seed() {
  console.log("Seeding invoice templates...");

  const [existing] = await db
    .select({ count: count() })
    .from(invoiceCategoriesTable);
  if ((existing?.count ?? 0) > 0) {
    console.log(
      `  Invoice categories already seeded (${existing?.count} records)`,
    );
    process.exit(0);
  }

  const [category] = await db
    .insert(invoiceCategoriesTable)
    .values({
      name: "Standard",
      description: "Standard invoice templates",
    })
    .returning({ id: invoiceCategoriesTable.id });

  console.log(`  Created category: Standard (${category!.id})`);

  await db.insert(invoiceTemplatesTable).values({
    name: "Standard Invoice",
    categoryId: category!.id,
    width: 210,
    height: 297,
    showQR: true,
    qrPosition: "bottom-right",
    layout: {
      orientation: "portrait",
      padding: 20,
    },
    colors: {
      primary: "#000000",
      secondary: "#666666",
      background: "#ffffff",
      text: "#000000",
      border: "#e5e7eb",
    },
    typography: {
      headingFont: "Helvetica",
      headingSize: 16,
      baseFont: "Helvetica",
      baseSize: 10,
    },
    visibleFields: {
      trackingNumber: true,
      senderName: true,
      senderAddress: true,
      senderPhone: true,
      receiverName: true,
      receiverAddress: true,
      receiverPhone: true,
      productType: true,
      serviceType: true,
      modeType: true,
      weight: true,
      declaredValue: true,
      basePrice: true,
      gstBreakdown: true,
      totalAmount: true,
      bookedDate: true,
    },
    headerConfig: {
      companyName: "TPC India",
      address: "India",
    },
    footerConfig: {
      termsText:
        "Terms & Conditions apply. All disputes subject to jurisdiction.",
      disclaimerText:
        "This is a computer-generated invoice and does not require a signature.",
    },
    isDefault: true,
  });

  console.log("  Created template: Standard Invoice (default)");
  console.log("Invoice template seeding complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
