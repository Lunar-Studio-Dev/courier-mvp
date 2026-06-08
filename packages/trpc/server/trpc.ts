import { initTRPC } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import { eq } from "drizzle-orm";
import { db } from "@repo/database";
import { usersTable } from "@repo/database/schema";
import { verifyToken } from "@repo/services/auth";

import type { Context } from "./context";
import { unauthorized, forbidden } from "./utils/errors";

export const tRPCContext = initTRPC
  .meta<OpenApiMeta>()
  .context<Context>()
  .create({});

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure;

export const protectedProcedure = tRPCContext.procedure.use(
  async ({ ctx, next }) => {
    const token = ctx.getAuthentication();
    if (!token) throw unauthorized("Not authenticated");

    let payload: { id: string };
    try {
      payload = verifyToken(token);
    } catch {
      throw unauthorized("Invalid or expired token");
    }

    const [user] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        fullName: usersTable.fullName,
        role: usersTable.role,
        passwordChangedAt: usersTable.passwordChangedAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, payload.id))
      .limit(1);

    if (!user) throw unauthorized("User not found");

    if (user.passwordChangedAt) {
      const changedAtMs = user.passwordChangedAt.getTime();
      const tokenIssuedAt = (payload as { iat?: number }).iat;
      if (tokenIssuedAt && changedAtMs > tokenIssuedAt * 1000) {
        throw unauthorized("Password changed. Please log in again.");
      }
    }

    return next({ ctx: { ...ctx, user } });
  }
);

export const adminProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    if (ctx.user?.role !== "admin") {
      throw forbidden("Admin access required");
    }
    return next({ ctx });
  }
);

export const customerProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    if (ctx.user?.role !== "customer") {
      throw forbidden("Customer access required");
    }
    return next({ ctx });
  }
);
