import type { Request, Response } from "express";

const AUTH_COOKIE_NAME = "token";

export function createCookieFactory(res: Response) {
  return (name: string, value: string, options?: { maxAge?: number }) => {
    res.cookie(name, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: options?.maxAge ?? 7 * 24 * 60 * 60 * 1000,
    });
  };
}

export function getCookieFactory(req: Request) {
  return (name: string): string | undefined => {
    return req.cookies?.[name];
  };
}

export function clearCookieFactory(res: Response) {
  return (name: string) => {
    res.clearCookie(name, { path: "/" });
  };
}

export function setAuthentication(res: Response, token: string) {
  createCookieFactory(res)(AUTH_COOKIE_NAME, token);
}

export function getAuthentication(req: Request): string | undefined {
  return getCookieFactory(req)(AUTH_COOKIE_NAME);
}

export function clearAuthentication(res: Response) {
  clearCookieFactory(res)(AUTH_COOKIE_NAME);
}
