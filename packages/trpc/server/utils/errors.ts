import { TRPCError } from "@trpc/server";

export function unauthorized(message = "Unauthorized") {
  return new TRPCError({ code: "UNAUTHORIZED", message });
}

export function forbidden(message = "Forbidden") {
  return new TRPCError({ code: "FORBIDDEN", message });
}

export function notFound(message = "Not found") {
  return new TRPCError({ code: "NOT_FOUND", message });
}

export function badRequest(message = "Bad request") {
  return new TRPCError({ code: "BAD_REQUEST", message });
}
