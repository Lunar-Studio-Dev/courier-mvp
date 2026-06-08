import type { ParsedIDResult } from "../types";

export function parsePassport(text: string): ParsedIDResult | null {
  const numberMatch = text.match(/[A-Z]\d{7}/);
  if (!numberMatch) return null;

  let confidence = 0.4;
  const fields: ParsedIDResult["fields"] = { idProofNumber: numberMatch[0] };

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Try MRZ parsing (bottom two lines of passport)
  const mrzLines = lines.filter((l) => /^[A-Z0-9<]{30,}$/.test(l));
  if (mrzLines.length >= 2) {
    // MRZ line 2 contains surname and given names separated by <<
    const namePart = mrzLines[0]?.substring(5)?.split("<<") ?? [];
    const mrzSurname = namePart[0];
    const mrzGiven = namePart[1];
    if (mrzSurname && mrzGiven) {
      const surname = mrzSurname.replace(/</g, " ").trim();
      const givenNames = mrzGiven.replace(/</g, " ").trim();
      fields.fullName = `${givenNames} ${surname}`
        .split(" ")
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(" ");
      confidence += 0.3;
    }
  } else {
    // Fallback: look for name field
    const nameIdx = lines.findIndex((l) => /surname|given name|name/i.test(l));
    const passportNameLine = nameIdx >= 0 ? lines[nameIdx + 1] : undefined;
    if (passportNameLine) {
      const nameLine = passportNameLine.replace(/[^a-zA-Z\s]/g, "").trim();
      if (nameLine.length > 2) {
        fields.fullName = nameLine;
        confidence += 0.2;
      }
    }
  }

  // Extract DOB
  const dobMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (dobMatch) {
    fields.dateOfBirth = dobMatch[1];
    confidence += 0.1;
  }

  return {
    detectedType: "PASSPORT",
    confidence: Math.min(confidence, 1),
    fields,
  };
}
