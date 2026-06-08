# Phase Auth: Authentication & Role-Based Access Control

## Status: COMPLETE

## Goal
Implement JWT-based authentication with HTTP-only cookies, `protectedProcedure` and role-based `adminProcedure` / `customerProcedure` middleware in the tRPC layer. This follows the same pattern used in the typeform project (`/home/localhost/Desktop/web-dev-cohort-2026/hackathon/typeform`).

**Reference implementation:** typeform project's `packages/trpc/server/trpc.ts`, `context.ts`, `utils/cookie.ts`, `utils/errors.ts`, `packages/services/auth/index.ts`, `packages/services/user/index.ts`.

---

## Step A.1 - Update User Database Model
**Status: PENDING**

### File: `packages/database/models/user.ts` - UPDATE

Add missing auth columns and role enum:

```typescript
import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "customer"]);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("full_name", { length: 80 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  profileImageUrl: text("profile_image_url"),

  // New auth columns
  salt: text("salt"),
  password: text("password"),                // HMAC-SHA256 hash
  role: userRoleEnum("role").notNull().default("customer"),
  passwordChangedAt: timestamp("password_changed_at").notNull().defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});
```

### Run migration
```bash
pnpm db:generate && pnpm db:migrate
```

---

## Step A.2 - Auth Token Service
**Status: PENDING**

### File: `packages/services/auth/index.ts` - CREATE

Pattern copied from typeform's `packages/services/auth/index.ts`:

```typescript
import * as JWT from "jsonwebtoken";
import { env } from "../env";

export interface TokenPayload {
  id: string;
  iat?: number;
}

export function signToken(payload: Pick<TokenPayload, "id">): string {
  return JWT.sign(payload, env.JWT_SECRET);
}

export function verifyToken(token: string): TokenPayload {
  return JWT.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function currentTokenSecond(): Date {
  return new Date(Math.floor(Date.now() / 1000) * 1000);
}
```

### Update `packages/services/env.ts` - UPDATE
Add `JWT_SECRET` to the env schema (required string).

### Install dependency
```bash
cd packages/services && pnpm add jsonwebtoken
cd packages/services && pnpm add -D @types/jsonwebtoken
```

---

## Step A.3 - Cookie Utilities
**Status: PENDING**

### File: `packages/trpc/server/utils/cookie.ts` - CREATE

Pattern copied from typeform's `packages/trpc/server/utils/cookie.ts`:

```typescript
import type { CookieOptions, Request, Response } from "express";
import { TRPCContext } from "../context";

const AUTHENTICATION_COOKIE_NAME = "authentication-token";

const defaultCookieOption: CookieOptions = {
  path: "/",
  httpOnly: true,
  secure: false,        // Set to true in production
  sameSite: "strict",
  maxAge: 365 * 24 * 60 * 60 * 1000,  // 1 year
};

export function createCookieFactory(res: Response) { ... }
export function getCookieFactory(req: Request) { ... }
export function clearCookieFactory(res: Response) { ... }

export function setAuthentication(ctx: TRPCContext, accessToken: string) { ... }
export function getAuthentication(ctx: TRPCContext) { ... }
export function clearAuthentication(ctx: TRPCContext) { ... }
```

---

## Step A.4 - Error Utilities
**Status: PENDING**

### File: `packages/trpc/server/utils/errors.ts` - CREATE

Pattern copied from typeform's `packages/trpc/server/utils/errors.ts`:

```typescript
import { TRPCError } from "@trpc/server";

export const unauthorized = (message = "Not authenticated") =>
  new TRPCError({ code: "UNAUTHORIZED", message });

export const forbidden = (message = "You don't have access to this resource") =>
  new TRPCError({ code: "FORBIDDEN", message });

export const notFound = (message = "Resource not found") =>
  new TRPCError({ code: "NOT_FOUND", message });

export const badRequest = (message = "Bad request") =>
  new TRPCError({ code: "BAD_REQUEST", message });

export const conflict = (message = "Resource conflict") =>
  new TRPCError({ code: "CONFLICT", message });

export const internalError = (message = "Internal server error") =>
  new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
```

---

## Step A.5 - Update tRPC Context
**Status: PENDING**

### File: `packages/trpc/server/context.ts` - REWRITE

Pattern from typeform's `packages/trpc/server/context.ts`. Must accept Express req/res and set up cookie factories:

```typescript
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createCookieFactory, getCookieFactory, clearCookieFactory } from "./utils/cookie";

export interface TRPCCtxUser {
  id: string;
  role: "admin" | "customer";
}

export interface TRPCContext {
  createCookie: ReturnType<typeof createCookieFactory>;
  getCookie: ReturnType<typeof getCookieFactory>;
  clearCookie: ReturnType<typeof clearCookieFactory>;
  req: { headers: Record<string, string | string[] | undefined> };
  user?: TRPCCtxUser;
}

export async function createContext({
  req,
  res,
}: CreateExpressContextOptions): Promise<TRPCContext> {
  return {
    createCookie: createCookieFactory(res),
    getCookie: getCookieFactory(req),
    clearCookie: clearCookieFactory(res),
    req: { headers: req.headers as Record<string, string | string[] | undefined> },
    user: undefined,
  };
}
```

---

## Step A.6 - Define protectedProcedure, adminProcedure, customerProcedure
**Status: PENDING**

### File: `packages/trpc/server/trpc.ts` - UPDATE

Add three new procedure types following the typeform pattern:

```typescript
import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import { createContext } from "./context";
import { verifyToken } from "@repo/services/auth";
import { userService } from "./services";
import { unauthorized, forbidden } from "./utils/errors";

export const tRPCContext = initTRPC
  .meta<OpenApiMeta>()
  .context<typeof createContext>()
  .create({});

export const router = tRPCContext.router;
export const publicProcedure = tRPCContext.procedure;

// --- protectedProcedure ---
// Requires valid JWT token. Extracts user from token, validates against DB.
// Checks passwordChangedAt to invalidate sessions on password change.
export const protectedProcedure = tRPCContext.procedure.use(
  async ({ ctx, next }) => {
    const token = getAuthentication(ctx);
    if (!token) throw unauthorized();

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw unauthorized("Invalid or expired session");
    }

    if (!payload?.id) throw unauthorized("Invalid session payload");

    const user = await userService.getUserById(payload.id);
    if (!user) throw unauthorized("Session is no longer valid");

    // Invalidate tokens issued before last password change
    if (payload.iat !== undefined) {
      const pwdChangedAtSec = Math.floor(
        user.passwordChangedAt.getTime() / 1000,
      );
      if (payload.iat < pwdChangedAtSec) {
        throw unauthorized("Session was revoked. Please sign in again.");
      }
    }

    return next({
      ctx: {
        ...ctx,
        user: { id: user.id, role: user.role },
      },
    });
  },
);

// --- adminProcedure ---
// Extends protectedProcedure. Requires role === "admin".
export const adminProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    if (ctx.user.role !== "admin") {
      throw forbidden("Admin access required");
    }
    return next({ ctx });
  },
);

// --- customerProcedure ---
// Extends protectedProcedure. Requires role === "customer".
export const customerProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    if (ctx.user.role !== "customer") {
      throw forbidden("Customer access required");
    }
    return next({ ctx });
  },
);
```

---

## Step A.7 - Update UserService with Auth Methods
**Status: PENDING**

### File: `packages/services/user/index.ts` - UPDATE

Add these methods to the existing UserService class:

```typescript
class UserService {
  // Existing: getAuthenticationMethods()

  // New methods:
  async getUserById(id: string) { ... }
    // Query user by ID, return full record including role, passwordChangedAt

  async createUserEmailAndPassword({ fullName, email, password }) { ... }
    // Generate random salt, hash password with HMAC-SHA256
    // Insert user with role="admin" (first admin seeded, subsequent via invite)
    // Return { id, token: signToken({ id }) }

  async loginUserWithEmailAndPassword({ email, password }) { ... }
    // Find user by email
    // Rehash provided password with stored salt, compare
    // Return { id, token: signToken({ id }) }

  async changePassword({ id, currentPassword, newPassword }) { ... }
    // Verify current password
    // Generate new salt, hash new password
    // Update passwordChangedAt to currentTokenSecond() (invalidates old tokens)
    // Return { token: signToken({ id }) }
}
```

### File: `packages/services/user/model.ts` - UPDATE

Add Zod schemas for auth inputs/outputs:
- `signupInputSchema`: { fullName, email, password }
- `loginInputSchema`: { email, password }
- `changePasswordInputSchema`: { currentPassword, newPassword }
- `userProfileOutputSchema`: { id, fullName, email, emailVerified, profileImageUrl, role }

---

## Step A.8 - Update Auth Routes
**Status: PENDING**

### File: `packages/trpc/server/routes/auth/route.ts` - UPDATE

Add login/signup/logout/profile endpoints:

```typescript
authRouter = router({
  // Existing
  getSupportedAuthenticationProviders: publicProcedure.query(...)

  // New
  signup: publicProcedure
    .input(signupInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, token } = await userService.createUserEmailAndPassword(input);
      setAuthentication(ctx, token);
      return { id };
    }),

  login: publicProcedure
    .input(loginInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, token } = await userService.loginUserWithEmailAndPassword(input);
      setAuthentication(ctx, token);
      return { id };
    }),

  me: protectedProcedure
    .query(async ({ ctx }) => {
      return userService.getUserById(ctx.user.id);
    }),

  changePassword: protectedProcedure
    .input(changePasswordInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { token } = await userService.changePassword({
        id: ctx.user.id,
        ...input,
      });
      setAuthentication(ctx, token);
      return { ok: true };
    }),

  signOut: protectedProcedure
    .mutation(async ({ ctx }) => {
      clearAuthentication(ctx);
      return { ok: true };
    }),
});
```

---

## Step A.9 - Update Express Server
**Status: PENDING**

### File: `apps/api/src/server.ts` - UPDATE

Add `cookie-parser` middleware so cookies are parsed before tRPC context:

```bash
cd apps/api && pnpm add cookie-parser
cd apps/api && pnpm add -D @types/cookie-parser
```

```typescript
import cookieParser from "cookie-parser";

app.use(cookieParser());
app.use(express.json());
// ... rest of middleware
```

Also update CORS config for production to include `credentials: true` and specific origin.

---

## Step A.10 - Admin Login Page (Frontend)
**Status: PENDING**

### File: `apps/web/app/(public)/login/page.tsx` - CREATE

Simple login page:
- Email input
- Password input
- "Sign In" button
- Calls `trpc.auth.login.useMutation()`
- On success: redirect to `/dashboard`
- Error: show toast

### File: `apps/web/app/(admin)/layout.tsx` - UPDATE

Add auth check:
- Call `trpc.auth.me.useQuery()` on mount
- If unauthorized (401): redirect to `/login`
- Show loading skeleton while checking auth
- Pass user info to sidebar (show name/email in footer)

### File: `apps/web/components/admin/app-sidebar.tsx` - UPDATE

Add user section in sidebar footer:
- User avatar/initials + name
- Sign Out button (calls `trpc.auth.signOut.useMutation()`)

---

## Step A.11 - Migrate Existing Routes to adminProcedure
**Status: PENDING**

Update all existing route files from Phase 2 and Phase 3 to use `adminProcedure` instead of `publicProcedure`:

### Files to update (import `adminProcedure` from `../../trpc`, replace `publicProcedure`):

- `packages/trpc/server/routes/product-type/route.ts` — all 5 procedures → `adminProcedure`
- `packages/trpc/server/routes/service-type/route.ts` — all 5 procedures → `adminProcedure`
- `packages/trpc/server/routes/mode-type/route.ts` — all 5 procedures → `adminProcedure`
- `packages/trpc/server/routes/branch/route.ts` — all 5 procedures → `adminProcedure`
- `packages/trpc/server/routes/destination/route.ts` — all procedures → `adminProcedure`, **except** `checkServiceability` stays `publicProcedure`
- `packages/trpc/server/routes/customer/route.ts` — all 6 procedures → `adminProcedure`

This is a simple find-and-replace in each file: change the import and swap `publicProcedure` → `adminProcedure` on each procedure definition.

---

## Step A.12 - Seed Admin User
**Status: PENDING**

### File: `packages/database/seed/admin.ts` - CREATE

Seed a default admin user:
```typescript
// Idempotent: skip if admin user exists
// Email: admin@tpcindia.com
// Password: admin123 (for dev only, change on first login)
// Role: admin
```

### Update `packages/database/package.json`
Add script: `"db:seed:admin": "dotenv -- tsx seed/admin.ts"`

---

## Step A.13 - Build Verification
**Status: PENDING**

- Run `pnpm turbo build` to verify compilation
- Run `pnpm db:generate && pnpm db:migrate` for schema changes
- Run `pnpm db:seed:admin` to create default admin
- Test login flow end-to-end
- Test protectedProcedure rejects unauthenticated requests
- Test adminProcedure rejects non-admin users
- Test that migrated routes (product-types, branches, etc.) return 401 when not authenticated
- Test that `destinations.checkServiceability` still works without auth

---

## Route Procedure Assignment (What Uses What)

### publicProcedure (no auth required)
- `auth.getSupportedAuthenticationProviders`
- `auth.signup`
- `auth.login`
- `shipments.track` (public tracking)
- `destinations.checkServiceability` (public pincode check)

### protectedProcedure (any authenticated user)
- `auth.me`
- `auth.changePassword`
- `auth.signOut`

### adminProcedure (admin role only)
- All master data CRUD: `productTypes.*`, `serviceTypes.*`, `modeTypes.*`
- `branches.*` (all operations)
- `destinations.list`, `destinations.update`, `destinations.bulkUpdateByState`, `destinations.getStates`, `destinations.getCitiesByState`
- `customers.*` (all operations)
- `pricingRules.*` (all operations)
- `shipments.list`, `shipments.getById`, `shipments.create`, `shipments.updateStatus`
- `invoices.*` (all operations)
- `dashboard.*` (all analytics)
- `notifications.*` (all config)

### customerProcedure (customer role only)
- `customerPortal.myShipments` (scoped to authenticated customer)
- `customerPortal.myProfile`
- `customerPortal.updateProfile`

---

## Deliverables Checklist

| # | Item | Status |
|---|------|--------|
| 1 | User model updated (salt, password, role, passwordChangedAt) | PENDING |
| 2 | Migration generated and applied | PENDING |
| 3 | `services/auth/index.ts` (signToken, verifyToken) | PENDING |
| 4 | `trpc/server/utils/cookie.ts` (cookie factories) | PENDING |
| 5 | `trpc/server/utils/errors.ts` (error helpers) | PENDING |
| 6 | `trpc/server/context.ts` rewritten (Express req/res, cookies) | PENDING |
| 7 | `trpc/server/trpc.ts` updated (protectedProcedure, adminProcedure, customerProcedure) | PENDING |
| 8 | UserService updated (getUserById, create, login, changePassword) | PENDING |
| 9 | Auth routes updated (signup, login, me, signOut, changePassword) | PENDING |
| 10 | `cookie-parser` added to Express server | PENDING |
| 11 | Admin login page (`/login`) | PENDING |
| 12 | Admin layout auth guard (redirect to `/login` if unauthenticated) | PENDING |
| 13 | Sidebar user section + sign out | PENDING |
| 14 | Existing Phase 2 routes migrated to `adminProcedure` | PENDING |
| 15 | Existing Phase 3 routes migrated to `adminProcedure` | PENDING |
| 16 | Admin seed user script | PENDING |
| 17 | `JWT_SECRET` added to env schema | PENDING |
| 18 | Full build passes | PENDING |
