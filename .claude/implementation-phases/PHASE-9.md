# Phase 9: Customer Portal

## Status: DONE

## Prerequisites
- **All Phases 1-8 must be completed first.** Customer portal depends on:
  - Phase Auth: `customerProcedure` middleware, JWT auth
  - Phase 4: Shipments, tracking
  - Phase 6: Public tracking page (reuse patterns)
  - Phase 7: Notification system (OTP delivery via SMS)

## Goal
Build the customer-facing portal with phone+OTP authentication, self-service shipment tracking, shipment history, and profile management. Customers log in via their registered phone number (from the admin-onboarded `customers` table), receive an OTP via SMS, and access a scoped view of their shipments.

---

## Current State Analysis

### Already Implemented
- **Customer portal layout** (`(customer)/layout.tsx`) — Uses `CustomerNav` component
- **CustomerNav** (`components/customer/customer-nav.tsx`) — Sticky header with Track/Shipments/Profile links, mobile hamburger menu
- **Placeholder pages** — 3 empty stub pages exist:
  - `(customer)/portal/track/page.tsx`
  - `(customer)/portal/shipments/page.tsx`
  - `(customer)/portal/profile/page.tsx`
- **`customerProcedure`** — Defined in `packages/trpc/server/trpc.ts`, extends `protectedProcedure`, checks `ctx.user.role === "customer"`
- **`input-otp` component** — Already installed (`input-otp: ^1.4.2`) with shadcn wrapper at `components/ui/input-otp.tsx`
- **Notification system** — Multi-channel SMS delivery available via `NotificationService`
- **Public tracking** — `shipments.track` public procedure and `(public)/track/[trackingNumber]` page
- **Users table** — Has `role` enum (`admin` | `customer`), email/password auth
- **Customers table** — Has phone, fullName, address, ID proof fields. **No `userId` FK** — customers and users are separate tables

### Key Design Decision: Linking Customers to Users
The `customersTable` (business entity with phone, address, ID proof) is separate from `usersTable` (auth entity with email, password, role). For OTP login:
1. Customer enters their phone number (from `customersTable`)
2. System finds the customer record, sends OTP via SMS
3. On verification, system creates/finds a `usersTable` record with `role: "customer"` and a new `customerId` reference
4. JWT token is issued for the user record
5. `customerProcedure` uses `ctx.user.id` (user ID) to find the linked customer

**This requires adding a `customerId` column to `usersTable`** to link authenticated users to their customer profile, or adding a `userId` column to `customersTable`. We'll add `userId` to `customersTable` (nullable) since it's less disruptive.

---

## Step 9.1 - Database Schema Update

### Update: `packages/database/models/customer.ts`
Add an optional `userId` column to link customer records to user accounts:

```typescript
userId: uuid("user_id").references(() => usersTable.id),
```

This is nullable — existing customers onboarded by admin won't have a user account until they first log in via OTP.

### Generate & Apply Migration
```bash
pnpm db:generate
pnpm db:migrate
```

---

## Step 9.2 - OTP Storage & Customer Auth Service

### Create: `packages/database/models/otp.ts`

A simple OTP table for phone-based verification:

```typescript
otpTable = pgTable("otps", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: varchar("phone", { length: 15 }).notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  attempts: integer("attempts").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Update: `packages/database/schema.ts`
Add `export * from "./models/otp";`

### Generate & Apply Migration
```bash
pnpm db:generate
pnpm db:migrate
```

### Create: `packages/services/customer-auth/model.ts`

Zod schemas:

```typescript
requestOtpInputSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
})

verifyOtpInputSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(6),
})

customerAuthOutputSchema = z.object({
  customerId: z.string(),
  user: userOutputSchema,
})
```

### Create: `packages/services/customer-auth/index.ts`

Class `CustomerAuthService`:

- **`requestOtp(phone)`**:
  1. Find customer in `customersTable` WHERE phone = input, isActive = true
  2. If not found, throw "Phone number not registered. Contact admin."
  3. Generate 6-digit random OTP: `Math.floor(100000 + Math.random() * 900000).toString()`
  4. Delete any existing unexpired OTPs for this phone
  5. Insert new OTP record with `expiresAt = now + 5 minutes`
  6. Send OTP via `NotificationService` SMS channel (fire-and-forget)
  7. Return `{ success: true, message: "OTP sent" }`

- **`verifyOtp(phone, otp)`**:
  1. Find OTP record WHERE phone = input, verified = false, expiresAt > now
  2. If not found, throw "Invalid or expired OTP"
  3. Increment attempts. If attempts > 5, throw "Too many attempts"
  4. If otp doesn't match, throw "Invalid OTP"
  5. Mark OTP as verified
  6. Find customer by phone
  7. Check if customer already has a `userId`:
     - If yes, fetch the user
     - If no, create a new user in `usersTable` with:
       - `email`: `{phone}@customer.tpcindia.com` (synthetic, for uniqueness)
       - `password`: random 64-char string (customer uses OTP, never password)
       - `salt`: random
       - `role`: "customer"
       - `fullName`: customer.fullName
     - Update `customersTable` set `userId = newUser.id`
  8. Generate JWT via `signToken({ id: userId })`
  9. Return `{ customerId, user }` and set authentication cookie

- **`getCustomerByUserId(userId)`**:
  1. Find customer WHERE userId = input
  2. Return customer record or null

**OTP SMS template** — simple inline message: `"Your TPC India login OTP is {otp}. Valid for 5 minutes."`

---

## Step 9.3 - Customer Auth tRPC Routes

### Create: `packages/trpc/server/routes/customer-auth/route.ts`

| Procedure | Method | Auth | Description |
|-----------|--------|------|-------------|
| requestOtp | POST | public | Send OTP to registered phone |
| verifyOtp | POST | public | Verify OTP, issue JWT |
| getProfile | GET | customerProcedure | Get linked customer profile |
| signOut | POST | customerProcedure | Clear authentication cookie |

**Important**: `requestOtp` and `verifyOtp` use `publicProcedure` (customer isn't authenticated yet). `getProfile` and `signOut` use `customerProcedure`.

### Update: `packages/trpc/server/services/index.ts`
Add `CustomerAuthService` instantiation.

### Update: `packages/trpc/server/index.ts`
Add `customerAuth: customerAuthRouter` to the server router.

---

## Step 9.4 - Customer Portal Auth Guard

### Create: `apps/web/components/customer/customer-auth-guard.tsx`

Similar to admin `AuthGuard` but for customer role:

```typescript
"use client";
// Uses trpc.auth.me to check if user is authenticated
// If not authenticated or role !== "customer", redirect to /portal/login
// While loading, show centered spinner
// On success, render children
```

### Update: `apps/web/app/(customer)/layout.tsx`

Wrap children with the customer auth guard. The layout should NOT guard the login page — only the portal pages:

```
(customer)/
├── layout.tsx            ← CustomerNav only (no auth guard here)
├── portal/
│   ├── layout.tsx        ← NEW: CustomerAuthGuard wrapper
│   ├── track/page.tsx
│   ├── shipments/page.tsx
│   └── profile/page.tsx
└── login/page.tsx        ← NEW: No auth guard
```

### Create: `apps/web/app/(customer)/portal/layout.tsx`

Portal-specific layout that wraps children with `CustomerAuthGuard`.

### Update: `apps/web/components/customer/customer-nav.tsx`

Add a Logout button that calls `customerAuth.signOut` and redirects to `/portal/login`. Show customer name from auth context.

---

## Step 9.5 - Customer Login Page (OTP Flow)

### Create: `apps/web/app/(customer)/login/page.tsx`

Two-step OTP login form:

**Step 1: Phone Input**
- Centered card (similar to admin login)
- TPC India logo + "Customer Login" title
- Phone number input with +91 prefix display
- "Send OTP" button
- On submit: calls `customerAuth.requestOtp`
- On success: transitions to Step 2
- On error: toast error ("Phone not registered")

**Step 2: OTP Verification**
- Shows "Enter the 6-digit code sent to +91 XXXXX XXXXX"
- Uses `InputOTP` component (from `components/ui/input-otp.tsx`) with 6 slots
- "Verify & Login" button
- Resend OTP link with countdown timer (60 seconds)
- On submit: calls `customerAuth.verifyOtp`
- On success: redirect to `/portal/shipments`
- On error: toast error, stay on same screen

**Design**: Match the admin login page aesthetics — centered card on muted background, TPC logo, clean typography.

---

## Step 9.6 - Customer Portal Service (Scoped Queries)

### Create: `packages/services/customer-portal/model.ts`

Zod schemas:

```typescript
// My Shipments
myShipmentsInputSchema = z.object({
  role: z.enum(["sender", "receiver", "all"]).default("all"),
  status: shipmentStatusEnum.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

myShipmentOutputSchema = z.object({
  id: z.string(),
  trackingNumber: z.string(),
  status: z.string(),
  bookedAt: z.date().nullable(),
  senderCity: z.string(),
  senderState: z.string(),
  receiverCity: z.string(),
  receiverState: z.string(),
  totalAmount: z.string(),
  isSender: z.boolean(),
})

myShipmentsOutputSchema = z.object({
  data: z.array(myShipmentOutputSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

// Profile update (limited fields)
updateProfileInputSchema = z.object({
  email: z.string().email().max(255).optional(),
  address: z.string().min(1).max(500).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
})

// Profile output
customerProfileOutputSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  idProofType: z.string(),
  idProofNumber: z.string(),
  isActive: z.boolean().nullable(),
  createdAt: z.date().nullable(),
  totalShipmentsSent: z.number(),
  totalShipmentsReceived: z.number(),
})
```

### Create: `packages/services/customer-portal/index.ts`

Class `CustomerPortalService`:

- **`getMyShipments(customerId, input)`**:
  - Query shipmentsTable WHERE senderId = customerId OR receiverId = customerId
  - Apply role filter: if "sender" only senderId, if "receiver" only receiverId
  - Apply status, dateFrom, dateTo filters
  - JOIN for sender/receiver address city/state
  - Add computed `isSender` boolean
  - Paginate and return

- **`getShipmentDetail(customerId, shipmentId)`**:
  - Get full shipment (like admin `getById`) BUT only if senderId or receiverId matches customerId
  - Include tracking history
  - Throw NOT_FOUND if customer doesn't own the shipment

- **`getProfile(customerId)`**:
  - Get customer record
  - Include aggregate counts: total shipments sent, total received

- **`updateProfile(customerId, input)`**:
  - Update only allowed fields: email, address, city, state, pincode
  - Phone, fullName, ID proof are read-only (admin manages those)
  - Return updated customer

---

## Step 9.7 - Customer Portal tRPC Routes

### Create: `packages/trpc/server/routes/customer-portal/route.ts`

All procedures use `customerProcedure`:

| Procedure | Method | Description |
|-----------|--------|-------------|
| myShipments | GET | Paginated list of customer's shipments |
| shipmentDetail | GET | Single shipment with tracking (scoped) |
| profile | GET | Customer profile with stats |
| updateProfile | PUT | Update limited profile fields |

**Key pattern**: Each procedure resolves `customerId` from `ctx.user.id` by calling `customerAuthService.getCustomerByUserId(ctx.user.id)`. This ensures the customer can only access their own data.

### Update: `packages/trpc/server/services/index.ts`
Add `CustomerPortalService` instantiation.

### Update: `packages/trpc/server/index.ts`
Add `customerPortal: customerPortalRouter` to server router.

---

## Step 9.8 - Customer Track Shipment Page

### Rewrite: `apps/web/app/(customer)/portal/track/page.tsx`

Similar to the public tracking page but within the portal layout:

- Large tracking number input field with "Track" button
- On submit: call the existing `shipments.track` public procedure
- Display tracking result:
  - Shipment summary card (origin/destination, status, booked date)
  - Tracking timeline (reuse the timeline component pattern from public page)
- If the tracking number belongs to this customer's shipment, show additional billing details (total amount, GST)

**Reuse**: The `shipments.track` procedure is already public, so we can call it directly. For the billing info, check against the customer portal routes.

---

## Step 9.9 - Customer My Shipments Page

### Rewrite: `apps/web/app/(customer)/portal/shipments/page.tsx`

Full shipments list page:

**Layout:**
- Page title: "My Shipments"
- Filter bar:
  - Role filter: All / Sent / Received (Select)
  - Status filter: All / Booked / In Transit / Delivered / etc. (Select)
  - Date range: optional date inputs or preset buttons
- Shipments table using reusable `DataTable` component
- Columns: Tracking # | Date | Route (From -> To) | Status (Badge) | Amount
- Row expansion: clicking a row expands to show inline tracking timeline
- Pagination: server-side

**Row expansion pattern:**
- Track `expandedRow` state
- When row is clicked, fetch tracking history via `shipments.track`
- Show a mini-timeline below the row with status steps and timestamps
- Uses the tracking history entry pattern from the public tracking page

### Create: `apps/web/app/(customer)/portal/shipments/_components/shipment-row-detail.tsx`

Expandable row component:
- Takes `trackingNumber` prop
- Calls `shipments.track` to get history
- Renders a horizontal step timeline (BOOKED -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED)
- Completed steps show green checkmark + timestamp
- Future steps show gray circle

---

## Step 9.10 - Customer Profile Page

### Rewrite: `apps/web/app/(customer)/portal/profile/page.tsx`

Two-column layout:

**Left Column: Personal Information Card**
- Display: Full Name (read-only), Phone (read-only, "Verified" badge), Email, Address, City, State, Pincode
- "Edit" button opens edit mode for editable fields (email, address, city, state, pincode)
- Save button calls `customerPortal.updateProfile`

**Right Column:**
- **Account Stats Card**: Member since date, Total Shipments Sent, Total Shipments Received, Active shipments count
- **ID Verification Card**: ID type, ID number (masked: show last 4 chars), "Verified" badge

---

## Step 9.11 - Update Login Page Routing

### Update: `apps/web/app/(public)/login/page.tsx`

The existing admin login page already routes customers to `/portal` on login. Update it to show a link to the customer login:
- Add a "Customer? Login here" link below the admin login form that navigates to `/portal/login`

### Redirect logic
- If authenticated user visits `/portal/login` and is already a customer, redirect to `/portal/shipments`
- If non-customer user (admin) visits `/portal/login`, show error or redirect to `/dashboard`

---

## Step 9.12 - Build Verification

- Run `pnpm turbo build` to verify full compilation
- All new tRPC routes accessible
- Customer login flow: phone -> OTP -> verify -> redirect to portal
- My Shipments page shows scoped data with filters and pagination
- Track page works within portal layout
- Profile page shows customer info with edit capability
- Auth guard redirects unauthenticated users to login
- Logout clears session and redirects to login

---

## Implementation Notes

### OTP for Development/Testing
For development without a real SMS provider, add a fallback:
- Log the OTP to console: `console.log("[DEV OTP]", phone, otp)`
- Optionally accept a hardcoded OTP (e.g., "123456") when `NODE_ENV !== "production"`
- This allows testing without configuring SMS credentials

### User-Customer Linking Pattern
The linking pattern (`customersTable.userId`) ensures:
- Admin can onboard customers without creating user accounts
- Customer user accounts are created lazily on first OTP login
- One customer = one user account (enforced by unique constraint)
- `customerProcedure` -> `ctx.user.id` -> lookup `customersTable.userId` -> customer data

### Security Considerations
- OTP rate limiting: max 3 OTP requests per phone per 10 minutes (check in `requestOtp`)
- OTP attempt limiting: max 5 verification attempts per OTP (check in `verifyOtp`)
- OTP expiry: 5 minutes
- Synthetic email for customer users prevents email conflicts with admin accounts
- Customer can only access their own shipments (enforced at service layer)

### Reuse from Existing Code
- `DataTable` component for shipments list
- `Badge` component for status badges
- `StatCard` component for profile stats
- `StatusBadge` pattern from admin shipment pages
- Public tracking timeline pattern for inline expansion
- `PageHeader` component for page titles

---

## Deliverables Checklist

| # | Item | Status |
|---|------|--------|
| 1 | Add `userId` column to `customersTable` + migration | PENDING |
| 2 | Create `otpTable` model + migration | PENDING |
| 3 | CustomerAuthService (requestOtp, verifyOtp, getCustomerByUserId) | PENDING |
| 4 | Customer auth Zod schemas (requestOtp, verifyOtp inputs/outputs) | PENDING |
| 5 | Customer auth tRPC routes (requestOtp, verifyOtp, getProfile, signOut) | PENDING |
| 6 | CustomerPortalService (myShipments, shipmentDetail, profile, updateProfile) | PENDING |
| 7 | Customer portal Zod schemas | PENDING |
| 8 | Customer portal tRPC routes (myShipments, shipmentDetail, profile, updateProfile) | PENDING |
| 9 | CustomerAuthGuard component | PENDING |
| 10 | Portal layout with auth guard wrapper | PENDING |
| 11 | Updated CustomerNav with logout + customer name | PENDING |
| 12 | Customer login page (phone input + OTP verification) | PENDING |
| 13 | Customer track shipment page (within portal) | PENDING |
| 14 | Customer my shipments page with filters + expandable rows | PENDING |
| 15 | Shipment row detail component (inline tracking timeline) | PENDING |
| 16 | Customer profile page (view + edit + stats) | PENDING |
| 17 | Admin login page link to customer login | PENDING |
| 18 | Services registered in tRPC services/index.ts | PENDING |
| 19 | Routes registered in tRPC index.ts (customerAuth + customerPortal) | PENDING |
| 20 | Dev OTP fallback for testing without SMS | PENDING |
| 21 | Full build passes | PENDING |
