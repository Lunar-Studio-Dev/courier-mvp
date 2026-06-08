export type IDProofType =
  | "AADHAAR"
  | "PAN"
  | "VOTER_ID"
  | "DRIVING_LICENSE"
  | "PASSPORT";

export interface ParsedIDResult {
  detectedType: IDProofType;
  confidence: number;
  fields: {
    fullName?: string;
    idProofNumber: string;
    dateOfBirth?: string;
    gender?: string;
    fatherName?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}
