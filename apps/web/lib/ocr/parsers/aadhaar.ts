import type { ParsedIDResult } from "../types";

export function parseAadhaar(text: string): ParsedIDResult | null {
  const numberMatch = text.match(/\d{4}\s?\d{4}\s?\d{4}/);
  if (!numberMatch) return null;

  const idNumber = numberMatch[0].replace(/\s/g, "");
  if (idNumber.length !== 12) return null;

  let confidence = 0.4;
  const fields: ParsedIDResult["fields"] = { idProofNumber: idNumber };

  // Extract name - look for line after common headers
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const nameIdx = lines.findIndex((l) =>
    /name/i.test(l) || /नाम/i.test(l),
  );
  const nextLine = nameIdx >= 0 ? lines[nameIdx + 1] : undefined;
  if (nextLine) {
    const nameLine = nextLine.replace(/[^a-zA-Z\s]/g, "").trim();
    if (nameLine.length > 2) {
      fields.fullName = nameLine;
      confidence += 0.2;
    }
  }

  // Extract DOB
  const dobMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (dobMatch) {
    fields.dateOfBirth = dobMatch[1];
    confidence += 0.1;
  }

  // Extract gender
  const genderMatch = text.match(/\b(Male|Female|Transgender|पुरुष|महिला)\b/i);
  if (genderMatch) {
    fields.gender = genderMatch[1];
    confidence += 0.1;
  }

  // Extract address and pincode
  const addressIdx = lines.findIndex((l) => /address|पता/i.test(l));
  if (addressIdx >= 0) {
    const addressLines = lines.slice(addressIdx + 1, addressIdx + 5);
    const address = addressLines.join(", ");
    fields.address = address;
    confidence += 0.1;

    const pincodeMatch = address.match(/\d{6}/);
    if (pincodeMatch) {
      fields.pincode = pincodeMatch[0];
      confidence += 0.1;
    }
  }

  return {
    detectedType: "AADHAAR",
    confidence: Math.min(confidence, 1),
    fields,
  };
}
