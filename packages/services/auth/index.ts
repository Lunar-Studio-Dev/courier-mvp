import jwt from "jsonwebtoken";
import { env } from "../env";

export function signToken(payload: { id: string }): string {
  return jwt.sign(payload, env.JWT_SECRET);
}

export function verifyToken(token: string): { id: string } {
  return jwt.verify(token, env.JWT_SECRET) as { id: string };
}
