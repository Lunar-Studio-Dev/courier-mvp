import type { Request, Response } from "express";
import {
  setAuthentication,
  getAuthentication,
  clearAuthentication,
} from "./utils/cookie";

export interface TRPCCtxUser {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "customer";
  passwordChangedAt: Date | null;
}

export async function createContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}) {
  return {
    req,
    res,
    user: null as TRPCCtxUser | null,
    setAuthentication: (token: string) => setAuthentication(res, token),
    getAuthentication: () => getAuthentication(req),
    clearAuthentication: () => clearAuthentication(res),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
