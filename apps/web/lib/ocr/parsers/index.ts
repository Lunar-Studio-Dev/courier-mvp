import type { ParsedIDResult } from "../types";
import { parsePAN } from "./pan";
import { parseAadhaar } from "./aadhaar";
import { parseVoterID } from "./voter-id";
import { parseDL } from "./driving-license";
import { parsePassport } from "./passport";

const parsers = [parsePAN, parseAadhaar, parseVoterID, parseDL, parsePassport];

export function autoDetectAndParse(text: string): ParsedIDResult | null {
  for (const parser of parsers) {
    const result = parser(text);
    if (result && result.confidence >= 0.3) {
      return result;
    }
  }
  return null;
}

export { parsePAN, parseAadhaar, parseVoterID, parseDL, parsePassport };
