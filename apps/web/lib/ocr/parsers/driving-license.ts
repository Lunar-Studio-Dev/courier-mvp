import type { ParsedIDResult } from "../types";

export function parseDL(text: string): ParsedIDResult | null {
  const numberMatch = text.match(/[A-Z]{2}[-\s]?\d{2}[-\s]?\d{4}[-\s]?\d{7}/);
  if (!numberMatch) return null;

  const idNumber = numberMatch[0].replace(/\s/g, "");
  let confidence = 0.4;
  const fields: ParsedIDResult["fields"] = { idProofNumber: idNumber };

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Extract name
  const nameIdx = lines.findIndex((l) => /^\s*name\s*$/i.test(l));
  const dlNameLine = nameIdx >= 0 ? lines[nameIdx + 1] : undefined;
  if (dlNameLine) {
    const nameLine = dlNameLine.replace(/[^a-zA-Z\s]/g, "").trim();
    if (nameLine.length > 2) {
      fields.fullName = nameLine;
      confidence += 0.2;
    }
  }

  // Extract DOB
  const dobMatch = text.match(/(\d{2}[-/]\d{2}[-/]\d{4})/);
  if (dobMatch) {
    fields.dateOfBirth = dobMatch[1];
    confidence += 0.1;
  }

  // Extract address
  const addressIdx = lines.findIndex((l) => /address|add/i.test(l));
  if (addressIdx >= 0) {
    const addressLines = lines.slice(addressIdx + 1, addressIdx + 4);
    fields.address = addressLines.join(", ");
    confidence += 0.1;

    const pincodeMatch = fields.address.match(/\d{6}/);
    if (pincodeMatch) {
      fields.pincode = pincodeMatch[0];
    }
  }

  return {
    detectedType: "DRIVING_LICENSE",
    confidence: Math.min(confidence, 1),
    fields,
  };
}
