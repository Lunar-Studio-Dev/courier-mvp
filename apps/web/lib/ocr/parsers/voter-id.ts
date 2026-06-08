import type { ParsedIDResult } from "../types";

export function parseVoterID(text: string): ParsedIDResult | null {
  const numberMatch = text.match(/[A-Z]{3}[0-9]{7}/);
  if (!numberMatch) return null;

  let confidence = 0.4;
  const fields: ParsedIDResult["fields"] = { idProofNumber: numberMatch[0] };

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Extract name
  const nameIdx = lines.findIndex((l) =>
    /elector.*name|name.*elector|नाम/i.test(l),
  );
  const voterNameLine = nameIdx >= 0 ? lines[nameIdx + 1] : undefined;
  if (voterNameLine) {
    const nameLine = voterNameLine.replace(/[^a-zA-Z\s]/g, "").trim();
    if (nameLine.length > 2) {
      fields.fullName = nameLine;
      confidence += 0.2;
    }
  }

  // Extract father's name
  const fatherIdx = lines.findIndex((l) =>
    /father|husband|पिता/i.test(l),
  );
  const voterFatherLine = fatherIdx >= 0 ? lines[fatherIdx + 1] : undefined;
  if (voterFatherLine) {
    const fatherLine = voterFatherLine.replace(/[^a-zA-Z\s]/g, "").trim();
    if (fatherLine.length > 2) {
      fields.fatherName = fatherLine;
      confidence += 0.1;
    }
  }

  // Extract address
  const addressIdx = lines.findIndex((l) => /address|पता/i.test(l));
  if (addressIdx >= 0) {
    const addressLines = lines.slice(addressIdx + 1, addressIdx + 4);
    fields.address = addressLines.join(", ");
    confidence += 0.1;

    const pincodeMatch = fields.address.match(/\d{6}/);
    if (pincodeMatch) {
      fields.pincode = pincodeMatch[0];
    }
  }

  // Extract DOB or age
  const dobMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (dobMatch) {
    fields.dateOfBirth = dobMatch[1];
    confidence += 0.1;
  }

  // Gender
  const genderMatch = text.match(/\b(Male|Female|पुरुष|महिला)\b/i);
  if (genderMatch) {
    fields.gender = genderMatch[1];
    confidence += 0.1;
  }

  return {
    detectedType: "VOTER_ID",
    confidence: Math.min(confidence, 1),
    fields,
  };
}
