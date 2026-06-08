import type { ParsedIDResult } from "../types";

export function parsePAN(text: string): ParsedIDResult | null {
  const numberMatch = text.match(/[A-Z]{5}[0-9]{4}[A-Z]/);
  if (!numberMatch) return null;

  let confidence = 0.5;
  const fields: ParsedIDResult["fields"] = { idProofNumber: numberMatch[0] };

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Extract name - look for line labeled "Name" or standalone name line
  const nameIdx = lines.findIndex((l) => /^\s*name\s*$/i.test(l));
  const panNameLine = nameIdx >= 0 ? lines[nameIdx + 1] : undefined;
  if (panNameLine) {
    const nameLine = panNameLine.replace(/[^a-zA-Z\s]/g, "").trim();
    if (nameLine.length > 2) {
      fields.fullName = nameLine;
      confidence += 0.2;
    }
  } else {
    // Heuristic: find a line with only uppercase letters that isn't a header
    const skipWords = ["INCOME", "TAX", "DEPARTMENT", "GOVT", "INDIA", "PERMANENT", "ACCOUNT", "NUMBER", "CARD"];
    for (const line of lines) {
      const cleaned = line.replace(/[^A-Z\s]/g, "").trim();
      if (
        cleaned.length > 3 &&
        cleaned.split(" ").length >= 2 &&
        !skipWords.some((w) => cleaned.includes(w))
      ) {
        fields.fullName = cleaned
          .split(" ")
          .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
          .join(" ");
        confidence += 0.15;
        break;
      }
    }
  }

  // Extract father's name
  const fatherIdx = lines.findIndex((l) => /father/i.test(l));
  const panFatherLine = fatherIdx >= 0 ? lines[fatherIdx + 1] : undefined;
  if (panFatherLine) {
    const fatherLine = panFatherLine.replace(/[^a-zA-Z\s]/g, "").trim();
    if (fatherLine.length > 2) {
      fields.fatherName = fatherLine;
      confidence += 0.1;
    }
  }

  // Extract DOB
  const dobMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (dobMatch) {
    fields.dateOfBirth = dobMatch[1];
    confidence += 0.1;
  }

  return {
    detectedType: "PAN",
    confidence: Math.min(confidence, 1),
    fields,
  };
}
