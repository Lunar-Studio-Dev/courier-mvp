# Courier Service Management System - Technical Implementation Plan

> Reference: `.claude/plan/ANALYSIS.md` for full feature analysis, database schemas, and architecture decisions.

---

## Phase Overview

| Phase | Name | Scope | Depends On |
|-------|------|-------|------------|
| 1 | Foundation & Database Schema | All DB models, migrations, layouts, color scheme, shared components | - |
| 2 | Master Data Modules | Product Types, Service Types, Mode Types, Branches (full CRUD stack) | Phase 1 |
| 3 | Customers & Destinations | Customer management with ID proof, Destination serviceability | Phase 1 |
| **Auth** | **Authentication & RBAC** | **JWT auth, protectedProcedure, adminProcedure, customerProcedure, login UI** | **Phase 1** |
| 4 | Pricing & Shipments | Pricing rules CRUD, shipment creation, status management, tracking, live billing | Phase 2, 3, Auth |
| 5 | Invoice System | Template builder, PDF/CSV/Excel generation, QR codes | Phase 4 |
| 6 | Public Pages | Landing page, public QR tracking page | Phase 4 |
| 7 | Notification System | Adapter/factory pattern package, multi-channel multi-provider, admin config | Phase 4 |
| 8 | Analytics & Dashboard | KPI aggregation, charts, activity feed, per-entity analytics | Phase 4 |
| 9 | Customer Portal | Customer auth, self-service tracking, shipment history, profile | Phase 4, 6 |

### Authentication & Role-Based Access Control

All phases from Phase 4 onward use `adminProcedure` (instead of `publicProcedure`) for admin-only routes. The Auth phase must be completed before Phase 4.

**Procedure types (defined in `packages/trpc/server/trpc.ts`):**

| Procedure | Auth Required | Role | Used By |
|-----------|--------------|------|---------|
| `publicProcedure` | No | Any | Auth endpoints, public tracking, landing page data |
| `protectedProcedure` | Yes (JWT) | Any authenticated user | Profile, change password, sign out |
| `adminProcedure` | Yes (JWT) | `admin` only | All admin CRUD, dashboard, settings |
| `customerProcedure` | Yes (JWT) | `customer` only | Customer portal (my shipments, profile) |

**Auth implementation pattern** (from typeform reference project):
- JWT tokens stored in HTTP-only cookies (`authentication-token`)
- `protectedProcedure` middleware: extract token from cookie → verify JWT → fetch user from DB → validate `passwordChangedAt` against token `iat` → inject `ctx.user`
- `adminProcedure` extends `protectedProcedure`: additionally checks `ctx.user.role === "admin"`
- `customerProcedure` extends `protectedProcedure`: additionally checks `ctx.user.role === "customer"`
- Password hashing: HMAC-SHA256 with per-user random salt
- Session invalidation on password change via `passwordChangedAt` column

**Detailed plan:** See `.claude/implementation-phases/PHASE-AUTH.md`

---

## Phase 1: Foundation & Database Schema

### Goal
Set up every database table, generate migrations, establish the admin/customer/public route group layouts, update color scheme, and build shared reusable components that all later phases depend on.

### Step 1.1 - Database Models (packages/database/models/)

Create all Drizzle table definitions. Each file exports the table + inferred Select/Insert types.

**Files to create:**

| File | Tables Defined |
|------|---------------|
| `models/branch.ts` | `branchesTable` |
| `models/customer.ts` | `customersTable` |
| `models/destination.ts` | `destinationsTable` |
| `models/product-type.ts` | `productTypesTable` |
| `models/service-type.ts` | `serviceTypesTable` |
| `models/mode-type.ts` | `modeTypesTable` |
| `models/pricing-rule.ts` | `pricingRulesTable` |
| `models/shipment.ts` | `shipmentsTable`, `shipmentTrackingHistoryTable` |
| `models/invoice.ts` | `invoiceTemplatesTable`, `invoiceCategoriesTable` |
| `models/notification.ts` | `notificationConfigsTable`, `notificationEventsTable` |

**File to update:**
- `schema.ts` - Add barrel exports for all new models (currently only exports `./models/user`)

**Detailed column specifications**: Follow exact schemas from ANALYSIS.md Sections 4.2 through 5.8. All tables use:
- `uuid("id").primaryKey().defaultRandom()`
- `timestamp("created_at").defaultNow()`
- `timestamp("updated_at").$onUpdate(() => new Date())`

**Foreign key relations to define:**
- `shipmentsTable.branchId` -> `branchesTable.id`
- `shipmentsTable.senderId` -> `customersTable.id`
- `shipmentsTable.receiverId` -> `customersTable.id`
- `shipmentsTable.productTypeId` -> `productTypesTable.id`
- `shipmentsTable.serviceTypeId` -> `serviceTypesTable.id`
- `shipmentsTable.modeTypeId` -> `modeTypesTable.id`
- `shipmentsTable.invoiceTemplateId` -> `invoiceTemplatesTable.id` (nullable)
- `shipmentTrackingHistoryTable.shipmentId` -> `shipmentsTable.id`
- `pricingRulesTable.productTypeId` -> `productTypesTable.id`
- `pricingRulesTable.serviceTypeId` -> `serviceTypesTable.id`
- `pricingRulesTable.modeTypeId` -> `modeTypesTable.id`
- `invoiceTemplatesTable.categoryId` -> `invoiceCategoriesTable.id`

### Step 1.2 - Run Database Migration

```bash
pnpm db:generate   # generates SQL migration files in packages/database/drizzle/
pnpm db:migrate    # applies migrations to PostgreSQL
```

Verify all tables are created in the database.

### Step 1.3 - Update Color Scheme

**File**: `apps/web/app/globals.css`

Replace current neutral oklch palette with courier-branded colors (no purple):

**Light mode `:root`:**
- `--primary`: Deep Blue (~oklch 0.40 0.15 250) - main actions, sidebar active
- `--primary-foreground`: White
- `--accent`: Warm Orange (~oklch 0.72 0.18 55) - CTAs, highlights
- `--secondary`, `--muted`: Light grays (keep neutral)
- `--destructive`: Red (keep existing)
- `--chart-1` through `--chart-5`: Blue, Orange, Green, Amber, Teal (no purple)
- `--sidebar-primary`: Deep Blue to match primary

**Dark mode `.dark`:**
- Same hues, adjusted lightness for dark backgrounds
- `--sidebar-primary`: Lighter blue for dark sidebar

### Step 1.4 - Next.js Route Group Structure

**File structure to create under `apps/web/app/`:**

```
app/
├── (public)/
│   ├── layout.tsx              -> Minimal layout (no sidebar, no auth)
│   ├── page.tsx                -> Landing page (move current page.tsx content here)
│   └── track/
│       └── [trackingNumber]/
│           └── page.tsx        -> Public tracking page (placeholder)
├── (admin)/
│   ├── layout.tsx              -> Admin layout with sidebar
│   ├── dashboard/
│   │   └── page.tsx            -> Dashboard (placeholder)
│   ├── shipments/
│   │   ├── page.tsx            -> Shipment list (placeholder)
│   │   └── new/
│   │       └── page.tsx        -> Create shipment (placeholder)
│   ├── customers/
│   │   ├── page.tsx            -> Customer list (placeholder)
│   │   └── [id]/
│   │       └── page.tsx        -> Customer detail (placeholder)
│   ├── branches/
│   │   └── page.tsx            -> Branches (placeholder)
│   ├── destinations/
│   │   └── page.tsx            -> Destinations (placeholder)
│   ├── pricing/
│   │   └── page.tsx            -> Pricing rules (placeholder)
│   ├── invoices/
│   │   └── page.tsx            -> Invoice templates (placeholder)
│   ├── product-types/
│   │   └── page.tsx            -> Product types (placeholder)
│   ├── service-types/
│   │   └── page.tsx            -> Service types (placeholder)
│   ├── mode-types/
│   │   └── page.tsx            -> Mode types (placeholder)
│   └── settings/
│       └── notifications/
│           └── page.tsx        -> Notification settings (placeholder)
└── (customer)/
    ├── layout.tsx              -> Customer portal layout with top nav
    ├── track/
    │   └── page.tsx            -> Track shipment (placeholder)
    ├── shipments/
    │   └── page.tsx            -> My shipments (placeholder)
    └── profile/
        └── page.tsx            -> Profile (placeholder)
```

**Update `app/page.tsx`**: This root page should redirect to `(public)` landing or `(admin)/dashboard` based on auth state. For MVP, redirect to `(admin)/dashboard`.

### Step 1.5 - Admin Sidebar Layout

**File**: `apps/web/app/(admin)/layout.tsx`

Build using existing `sidebar.tsx` shadcn component. Structure:

```
Sidebar:
  Header: Company logo + name ("TPC India")
  Navigation Groups:
    Main:
      - Dashboard (LayoutDashboard icon) -> /dashboard
      - Shipments (Package icon) -> /shipments
        - All Shipments -> /shipments
        - Create New -> /shipments/new
      - Customers (Users icon) -> /customers
    Operations:
      - Branches (Building2 icon) -> /branches
      - Destinations (MapPin icon) -> /destinations
      - Pricing Rules (IndianRupee icon) -> /pricing
      - Invoice Templates (FileText icon) -> /invoices
    Masters:
      - Product Types (Box icon) -> /product-types
      - Service Types (Zap icon) -> /service-types
      - Mode Types (Truck icon) -> /mode-types
    Settings:
      - Notifications (Bell icon) -> /settings/notifications
  Footer: User profile / logout
Content Area:
  Breadcrumb bar at top
  Page content below
```

- Use `lucide-react` icons (already installed)
- Collapsible sidebar for mobile
- Active route highlighting
- Store sidebar collapsed state in localStorage

### Step 1.6 - Customer Portal Layout

**File**: `apps/web/app/(customer)/layout.tsx`

Simple top navigation bar:
```
[TPC Logo]  Track Shipment | My Shipments | Profile    [Logout]
```

- Responsive: collapses to hamburger on mobile
- Use `navigation-menu.tsx` shadcn component

### Step 1.7 - Shared Components

Create reusable components that multiple pages will use:

**File**: `apps/web/components/shared/data-table.tsx`
- Generic data table component wrapping shadcn `table.tsx`
- Props: columns config, data, pagination, sorting, filtering
- Built on TanStack Table (add `@tanstack/react-table` dependency)
- Supports server-side pagination via tRPC

**File**: `apps/web/components/shared/stat-card.tsx`
- KPI stat card: title, value, trend indicator (up/down %), icon
- Used across dashboard and all analytics sections

**File**: `apps/web/components/shared/page-header.tsx`
- Page title + description + action buttons (e.g., "Create New" button)
- Consistent across all admin pages

**File**: `apps/web/components/shared/confirm-dialog.tsx`
- Reusable confirmation dialog for delete actions
- Uses shadcn `alert-dialog.tsx`

**File**: `apps/web/components/shared/status-badge.tsx`
- Color-coded badge for shipment statuses
- BOOKED=blue, PICKED_UP=cyan, IN_TRANSIT=amber, OUT_FOR_DELIVERY=orange, DELIVERED=green, RETURNED=red, CANCELLED=gray

**New dependency to install in apps/web:**
```bash
pnpm add @tanstack/react-table
```

### Step 1.8 - tRPC Context Update

**File**: `packages/trpc/server/context.ts`

Update the empty context to accept request headers (needed later for auth):
```typescript
export async function createContext({ req }: { req?: { headers?: Record<string, string> } }) {
  return { headers: req?.headers };
}
```

### Phase 1 Deliverables Checklist
- [ ] All 10 database model files created
- [ ] schema.ts updated with all exports
- [ ] Migration generated and applied
- [ ] Color scheme updated (blue/orange, no purple)
- [ ] All route group directories created with placeholder pages
- [ ] Admin sidebar layout functional with navigation
- [ ] Customer portal top nav layout functional
- [ ] Public layout created
- [ ] 5 shared components created (data-table, stat-card, page-header, confirm-dialog, status-badge)
- [ ] @tanstack/react-table installed
- [ ] Root page.tsx redirects to admin dashboard

---

## Phase 2: Master Data Modules

### Goal
Implement full CRUD stack (DB model -> service -> Zod schemas -> tRPC route -> UI page) for the four master data entities: Product Types, Service Types, Mode Types, Branches. These have no dependencies on shipments and are consumed by later phases.

### Step 2.1 - Product Types

**Service Layer:**

File: `packages/services/product-type/model.ts`
- `createProductTypeInputSchema` - Zod schema: { name: string, description?: string }
- `updateProductTypeInputSchema` - Zod schema: { id: string, name?: string, description?: string, isActive?: boolean }
- `productTypeOutputSchema` - Zod schema: full product type object
- `listProductTypesInputSchema` - Zod schema: { search?: string, isActive?: boolean, page?: number, limit?: number }

File: `packages/services/product-type/index.ts`
- Class `ProductTypeService` with methods:
  - `list(input)` - paginated list with search filter and active filter
  - `getById(id)` - single record
  - `create(input)` - insert new record
  - `update(input)` - update existing record
  - `delete(id)` - delete record (check for referencing shipments/pricing_rules first, throw if in use)

**tRPC Route:**

File: `packages/trpc/server/routes/product-type/route.ts`
- TAGS = ["Product Types"]
- getPath = generatePath("/product-types")
- Procedures: `list` (GET), `getById` (GET /:id), `create` (POST), `update` (PUT), `delete` (DELETE /:id)

File: `packages/trpc/server/services/index.ts`
- Add `export const productTypeService = new ProductTypeService()`

File: `packages/trpc/server/index.ts`
- Add `productTypes: productTypeRouter` to serverRouter

**Frontend UI:**

File: `apps/web/app/(admin)/product-types/page.tsx`
- Page header: "Product Types" + "Add Product Type" button
- Data table with columns: Name | Description | Status (active badge) | Actions (edit, delete)
- Search bar above table
- Active/Inactive filter toggle
- "Add Product Type" opens a sheet/dialog with form (name, description)
- Edit action opens same form pre-filled
- Delete action shows confirm-dialog, blocks if product type is referenced by shipments

### Step 2.2 - Service Types

Identical structure to Product Types. Copy pattern, rename:

**Files:**
- `packages/services/service-type/model.ts`
- `packages/services/service-type/index.ts`
- `packages/trpc/server/routes/service-type/route.ts`
- `apps/web/app/(admin)/service-types/page.tsx`

Same fields: name, description, isActive. Same CRUD operations. Same UI layout.

### Step 2.3 - Mode Types

Identical structure to Product Types. Copy pattern, rename:

**Files:**
- `packages/services/mode-type/model.ts`
- `packages/services/mode-type/index.ts`
- `packages/trpc/server/routes/mode-type/route.ts`
- `apps/web/app/(admin)/mode-types/page.tsx`

Same fields: name, description, isActive. Same CRUD operations. Same UI layout.

### Step 2.4 - Branches

**Service Layer:**

File: `packages/services/branch/model.ts`
- `createBranchInputSchema` - Zod: { code, name, type, city, state, address?, pincode?, latitude?, longitude?, contactPhone?, contactEmail? }
- `updateBranchInputSchema` - Zod: { id, ...partial of above, isActive? }
- `branchOutputSchema` - full branch object
- `listBranchesInputSchema` - { search?, type?, isActive?, page?, limit? }
- `branchTypeEnum` - z.enum(["Head Office", "Regional Office", "Franchise", "Collection Center", "Hub"])

File: `packages/services/branch/index.ts`
- Class `BranchService`:
  - `list(input)` - paginated, filterable by type, status, searchable by name/code/city
  - `getById(id)`
  - `create(input)` - validate unique code
  - `update(input)`
  - `delete(id)` - block if branch has shipments

**tRPC Route:**

File: `packages/trpc/server/routes/branch/route.ts`
- TAGS = ["Branches"]
- Procedures: `list`, `getById`, `create`, `update`, `delete`

**Frontend UI:**

File: `apps/web/app/(admin)/branches/page.tsx`
- Page header: "Branches" + "Add Branch" button
- Data table columns: Code | Name | Type (badge) | City | State | Status (toggle) | Actions
- Filters: type dropdown, active/inactive filter, search
- Add/Edit via sheet (side panel):
  - Code (text, uppercase, validated unique)
  - Name (text)
  - Type (select dropdown)
  - City, State (text inputs)
  - Address (textarea)
  - Pincode (text, 6 digits)
  - Contact Phone, Contact Email
  - Latitude, Longitude (optional number inputs)
- Active/Inactive toggle directly in table row
- Delete with confirmation

### Step 2.5 - Seed Data Script

File: `packages/database/seed/masters.ts`
- Seed default product types: Documents, Parcel, Fragile, Electronics, Liquid, Perishable, Heavy Goods, Bulk Cargo
- Seed default service types: Standard, Express, Same-Day, Next-Day, Economy, Priority
- Seed default mode types: Air, Rail, Road (Surface), Multimodal
- Idempotent: check if records exist before inserting

Add script to `packages/database/package.json`:
```json
"db:seed": "dotenv -- tsx seed/masters.ts"
```

### Phase 2 Deliverables Checklist
- [ ] Product Types: service + model + tRPC route + UI page (full CRUD)
- [ ] Service Types: service + model + tRPC route + UI page (full CRUD)
- [ ] Mode Types: service + model + tRPC route + UI page (full CRUD)
- [ ] Branches: service + model + tRPC route + UI page (full CRUD)
- [ ] All 4 routers registered in serverRouter (index.ts)
- [ ] All 4 services instantiated in services/index.ts
- [ ] Seed script for default master data
- [ ] Delete protection (prevent deleting records referenced by other tables)

---

## Phase 3: Customers & Destinations

### Goal
Implement customer onboarding with ID proof verification and the destination serviceability master table.

### Step 3.1 - Destinations

**Service Layer:**

File: `packages/services/destination/model.ts`
- `listDestinationsInputSchema` - { state?: string, city?: string, pincode?: string, isServiceable?: boolean, page?: number, limit?: number }
- `updateDestinationInputSchema` - { id: string, isServiceable: boolean }
- `bulkUpdateDestinationsInputSchema` - { state: string, isServiceable: boolean } (toggle all pincodes in a state)
- `destinationOutputSchema`
- `statesListOutputSchema` - for the state filter dropdown

File: `packages/services/destination/index.ts`
- Class `DestinationService`:
  - `list(input)` - paginated, all 4 filters (state, city, pincode, serviceable)
  - `update(input)` - toggle single pincode serviceability
  - `bulkUpdateByState(input)` - toggle all pincodes in a state
  - `getStates()` - distinct states for filter dropdown
  - `getCitiesByState(state)` - distinct cities for filter dropdown
  - `isServiceable(pincode)` - check if a pincode is serviceable (used by shipment creation)

**tRPC Route:**

File: `packages/trpc/server/routes/destination/route.ts`
- Procedures: `list` (GET), `update` (PUT), `bulkUpdateByState` (PUT), `getStates` (GET), `getCitiesByState` (GET)

**Frontend UI:**

File: `apps/web/app/(admin)/destinations/page.tsx`
- Page header: "Destinations" + stats (total locations, serviceable count, non-serviceable count)
- Filter bar:
  - State dropdown (populated from `getStates` query)
  - City search input (auto-suggest from `getCitiesByState`)
  - Pincode input
  - Serviceable filter: All / Serviceable / Not Serviceable
- Data table columns: State | City | Pincode | Serviceable (switch toggle)
- Switch toggle calls `update` mutation inline (optimistic update)
- Bulk action: "Toggle all in [State]" button that calls `bulkUpdateByState`
- Pagination: server-side, 50 rows default (19k records need efficient pagination)

**Seed Data:**

File: `packages/database/seed/destinations.ts`
- Load India PIN code data (state, city/district, pincode)
- Source: Public India Post PIN code dataset (CSV)
- Insert all records with `isServiceable: true` by default
- Add to package.json: `"db:seed:destinations": "dotenv -- tsx seed/destinations.ts"`

### Step 3.2 - Customers

**Service Layer:**

File: `packages/services/customer/model.ts`
- `createCustomerInputSchema` - Zod: { fullName, phone, email?, address, city, state, pincode, idProofType, idProofNumber, idProofImageUrl? }
  - `idProofType`: z.enum(["PAN", "AADHAAR", "VOTER_ID", "DRIVING_LICENSE", "PASSPORT"])
  - Phone validation: Indian phone number format
  - PAN validation: regex `^[A-Z]{5}[0-9]{4}[A-Z]$`
  - Aadhaar validation: 12 digit number
  - Voter ID validation: regex `^[A-Z]{3}[0-9]{7}$`
  - DL validation: regex `^[A-Z]{2}[-\s]?\d{2}[-\s]?\d{4}[-\s]?\d{7}$`
  - Passport validation: regex `^[A-Z]\d{7}$`
- `updateCustomerInputSchema` - { id, ...partial fields }
- `customerOutputSchema` - full customer object
- `listCustomersInputSchema` - { search?, isActive?, page?, limit? }
- `customerAnalyticsOutputSchema` - analytics response shape

File: `packages/services/customer/index.ts`
- Class `CustomerService`:
  - `list(input)` - paginated, searchable by name/phone/email
  - `getById(id)` - single customer with full details
  - `create(input)` - validate unique phone, validate ID proof format
  - `update(input)`
  - `delete(id)` - soft delete (set isActive=false), block if customer has active shipments
  - `search(query)` - fast lookup for shipment creation form (returns id, fullName, phone for combobox)
  - `getShipments(customerId, filters)` - paginated shipments for this customer
  - `getAnalytics(customerId)` - aggregate stats: total shipments, avg delivery time, total spend, success rate

**tRPC Route:**

File: `packages/trpc/server/routes/customer/route.ts`
- Procedures: `list`, `getById`, `create`, `update`, `delete`, `search`, `getShipments`, `getAnalytics`

### Step 3.3 - Smart ID Proof OCR System (Admin Onboarding Flow)

**Context & Why OCR (not Government APIs):**

Indian government verification APIs are NOT free for commercial use:
- **UIDAI Aadhaar eKYC**: Requires AUA (Authorized User Agency) registration, STQC-certified devices, per-txn fees (INR 0.50-20)
- **NSDL PAN Verification**: Requires licensed access + per-call fees
- **DigiLocker APIs**: Requires government partnership registration + compliance audits
- **Voter ID / DL Verification**: No public free API exists

For MVP, we use **Tesseract.js** (free, open-source, client-side OCR) with custom parsers.

**New dependency for apps/web:**
```bash
pnpm add tesseract.js
```

**OCR Utility Module:**

File: `apps/web/lib/ocr/index.ts`
- Initializes Tesseract.js worker with `eng+hin` language pack (covers English + Hindi on all Indian IDs)
- Function `extractTextFromImage(imageFile: File): Promise<string>` - runs OCR, returns raw text
- Handles worker lifecycle (create, load, terminate)

File: `apps/web/lib/ocr/parsers/index.ts`
- Barrel export for all ID parsers
- Function `autoDetectAndParse(rawText: string): ParsedIDResult | null`
  - Attempts all parsers, returns first successful match
  - Returns `{ detectedType, confidence, fields }` or null

File: `apps/web/lib/ocr/parsers/aadhaar.ts`
- Function `parseAadhaar(rawText: string): ParsedIDResult | null`
- Regex patterns:
  - Aadhaar number: `/\d{4}\s?\d{4}\s?\d{4}/`
  - Name: line after "Name" label or positional heuristic
  - DOB: `/\d{2}\/\d{2}\/\d{4}/` or `DOB:` prefix
  - Gender: `Male` | `Female` | `Transgender` keyword match
  - Address: lines after "Address" label until next section
- Returns: `{ fullName, idProofNumber, dateOfBirth?, gender?, address? }`

File: `apps/web/lib/ocr/parsers/pan.ts`
- Function `parsePAN(rawText: string): ParsedIDResult | null`
- Regex patterns:
  - PAN number: `/[A-Z]{5}[0-9]{4}[A-Z]/`
  - Name: line labeled "Name" or line immediately below PAN header
  - Father's Name: line after "Father's Name" label
  - DOB: date pattern
- Returns: `{ fullName, idProofNumber, fatherName?, dateOfBirth? }`

File: `apps/web/lib/ocr/parsers/voter-id.ts`
- Function `parseVoterID(rawText: string): ParsedIDResult | null`
- Regex: Voter ID number `/[A-Z]{3}[0-9]{7}/`
- Extracts: name, father's name, address, age/DOB

File: `apps/web/lib/ocr/parsers/driving-license.ts`
- Function `parseDL(rawText: string): ParsedIDResult | null`
- Regex: DL number `/[A-Z]{2}[-\s]?\d{2}[-\s]?\d{4}[-\s]?\d{7}/`
- Extracts: name, DOB, address, blood group

File: `apps/web/lib/ocr/parsers/passport.ts`
- Function `parsePassport(rawText: string): ParsedIDResult | null`
- Regex: Passport number `/[A-Z]\d{7}/`
- Extracts: name, DOB, place of issue

**Shared types:**

File: `apps/web/lib/ocr/types.ts`
```typescript
type IDProofType = "AADHAAR" | "PAN" | "VOTER_ID" | "DRIVING_LICENSE" | "PASSPORT";

interface ParsedIDResult {
  detectedType: IDProofType;
  confidence: number;       // 0-1, based on how many fields were extracted
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
```

**OCR Processing Hook:**

File: `apps/web/hooks/use-id-ocr.ts`
- Custom hook `useIdOcr()` returning:
  - `processImage(file: File): Promise<ParsedIDResult | null>`
  - `isProcessing: boolean` (loading state)
  - `progress: number` (0-100, Tesseract progress callback)
  - `error: string | null`
- Internally manages Tesseract worker lifecycle
- Shows progress percentage during OCR

### Step 3.4 - Customer Onboarding UI (Two Flows)

**Frontend UI:**

File: `apps/web/app/(admin)/customers/page.tsx`
- Page header: "Customers" + "Onboard Customer" button
- Data table columns: Name | Phone | Email | City | ID Proof Type | Status | Actions
- Search bar (searches across name, phone, email)
- Active/Inactive filter
- Row click navigates to customer detail page

File: `apps/web/components/customer/onboard-customer-sheet.tsx`
- Sheet/dialog opened by "Onboard Customer" button
- **Two-phase flow for admin:**

**Phase 1: Upload ID Proof (Primary action, top of form)**
```
+-----------------------------------------------+
| STEP 1: Upload ID Proof                       |
|                                               |
| +-------------------------------------------+ |
| |                                           | |
| |     [Drag & drop ID proof image here]     | |
| |          or click to browse               | |
| |                                           | |
| |     Supports: Aadhaar, PAN, Voter ID,    | |
| |     Driving License, Passport             | |
| |                                           | |
| +-------------------------------------------+ |
|                                               |
| [Processing... 67%] <-- Tesseract progress    |
+-----------------------------------------------+
```

After OCR completes:
```
+-----------------------------------------------+
| OCR Result: PAN Card detected (92% conf.)     |
| Extracted fields pre-filled below.            |
| Please review and correct any errors.         |
+-----------------------------------------------+
```

**Phase 2: Review & Complete (form fields pre-filled from OCR)**
- ID Proof Type: auto-selected from OCR detection (editable)
- ID Proof Number: pre-filled from OCR (editable, validated)
- Full Name: pre-filled from OCR (editable)
- **Below fields NOT from OCR (admin fills manually):**
- Phone (required, validated)
- Email (optional)
- Address: pre-filled from OCR if found, else empty (editable)
- City: pre-filled if parsed from address (editable)
- State: pre-filled if parsed from address (editable)
- Pincode: pre-filled if parsed from address (editable)
- ID Proof Image: already uploaded (shown as thumbnail)
- [Create Customer] button

**Fallback:** If OCR fails or confidence is low (<50%), show message: "Could not extract data from image. Please fill the form manually." Form remains empty, admin types all fields.

**Skip OCR option:** "Fill manually" link at top lets admin skip the upload and go straight to the empty form.

File: `apps/web/app/(admin)/customers/[id]/page.tsx`
- **Profile Section** (top):
  - Customer name, phone, email, address
  - ID Proof badge: type + number + image preview (if uploaded)
  - Active/Inactive status toggle
  - Edit button -> opens edit sheet
- **Analytics Section** (stat cards row):
  - Total Shipments (sent + received)
  - Average Delivery Time
  - Total Spend
  - Success Rate %
- **Active Shipment** (conditional, if exists):
  - Live tracking timeline for current in-progress shipment
  - Status stepper: BOOKED -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED
- **Shipment History** (table):
  - Columns: Tracking # | Date | From/To | Status | Weight | Amount
  - Filters: date range, status
  - Pagination

### Phase 3 Deliverables Checklist
- [ ] Destinations: service + tRPC route + UI with toggle switches
- [ ] Destinations seed data loaded (India PIN codes)
- [ ] Customers: service + tRPC route + UI (list page)
- [ ] Customer detail page with profile, analytics, shipment history
- [ ] ID proof validation (PAN/Aadhaar/VoterID/DL/Passport format rules)
- [ ] Customer search endpoint (for shipment creation combobox)
- [ ] Bulk serviceability toggle for destinations
- [ ] Tesseract.js OCR integration (client-side, eng+hin)
- [ ] 5 ID-type-specific parsers (Aadhaar, PAN, Voter ID, DL, Passport)
- [ ] Auto-detect ID type from OCR text
- [ ] useIdOcr hook with progress tracking
- [ ] Admin onboard sheet: upload ID -> OCR auto-fill -> review -> create
- [ ] "Fill manually" fallback for OCR failure
- [ ] Customer self-registration flow (manual, all fields required) in Phase 10

---

## Phase Auth: Authentication & Role-Based Access Control

### Goal
Implement JWT-based authentication with HTTP-only cookies, role-based procedure middleware (`protectedProcedure`, `adminProcedure`, `customerProcedure`), admin login/signup, and auth guards on the frontend.

**Detailed plan:** See `.claude/implementation-phases/PHASE-AUTH.md`

### Key changes:
1. **User model**: Add `salt`, `password`, `role` (enum: admin/customer), `passwordChangedAt` columns
2. **Auth service**: `signToken()`, `verifyToken()` using `jsonwebtoken` + `JWT_SECRET` env var
3. **Cookie utilities**: `setAuthentication()`, `getAuthentication()`, `clearAuthentication()` using HTTP-only cookies
4. **tRPC context**: Rewrite to accept Express `req`/`res`, set up cookie factories
5. **Procedure middleware**: `protectedProcedure` (JWT verify + user lookup), `adminProcedure` (role check), `customerProcedure` (role check)
6. **Auth routes**: `signup`, `login`, `me`, `signOut`, `changePassword`
7. **Express server**: Add `cookie-parser` middleware
8. **Frontend**: Admin login page, auth guard on `(admin)` layout, sidebar sign-out button
9. **Seed**: Default admin user (`admin@tpcindia.com`)

### Phase Auth Deliverables Checklist
- [ ] User model updated (salt, password, role, passwordChangedAt) + migration
- [ ] Auth token service (sign/verify JWT)
- [ ] Cookie utilities (HTTP-only cookie management)
- [ ] Error utilities (unauthorized, forbidden, etc.)
- [ ] tRPC context rewritten (Express req/res, cookie factories)
- [ ] protectedProcedure, adminProcedure, customerProcedure defined
- [ ] UserService auth methods (create, login, changePassword, getUserById)
- [ ] Auth routes (signup, login, me, signOut, changePassword)
- [ ] cookie-parser added to Express server
- [ ] Admin login page + auth guard on admin layout
- [ ] Admin seed user script
- [ ] Full build passes

---

## Phase 4: Pricing Engine & Shipments

### Goal
Build the dynamic pricing configuration system, the calculation engine, and the full shipment module. All admin routes use `adminProcedure`. Public tracking uses `publicProcedure`.

### Step 4.1 - Pricing Service

**Service Layer:**

File: `packages/services/pricing/model.ts`
- `createPricingRuleInputSchema` - Zod: { originState, originCity?, destinationState, destinationCity?, productTypeId, serviceTypeId, modeTypeId, unitPrice, minimumCharge? }
- `updatePricingRuleInputSchema` - { id, ...partial }
- `pricingRuleOutputSchema` - full rule with joined product/service/mode names
- `listPricingRulesInputSchema` - { originState?, destinationState?, productTypeId?, serviceTypeId?, modeTypeId?, isActive?, page?, limit? }
- `calculatePriceInputSchema` - { originState, originCity, destinationState, destinationCity, productTypeId, serviceTypeId, modeTypeId, weight, gstEnabled }
- `calculatePriceOutputSchema` - { unitPrice, basePrice, gstType, gstRate, cgst?, sgst?, igst?, gstAmount, totalAmount, ruleId }

File: `packages/services/pricing/index.ts`
- Class `PricingService`:
  - `list(input)` - paginated with filters, JOIN product/service/mode names for display
  - `getById(id)`
  - `create(input)` - validate no duplicate rule exists for same combination
  - `update(input)`
  - `delete(id)`
  - `calculate(input)` - **core pricing engine**:
    1. Query pricing_rules matching the combination
    2. Apply priority: city-city > city-state > state-city > state-state
    3. If no rule found, throw "No pricing rule configured for this route"
    4. `basePrice = max(weight * unitPrice, minimumCharge)`
    5. If gstEnabled:
       - If originState === destinationState: CGST 9% + SGST 9%
       - Else: IGST 18%
    6. `totalAmount = basePrice + gstAmount`
    7. Return full breakdown

**tRPC Route:**

File: `packages/trpc/server/routes/pricing/route.ts`
- All procedures use `adminProcedure` (admin-only access)
- Procedures: `list`, `getById`, `create`, `update`, `delete`, `calculate`
- `calculate` is the real-time endpoint called by the shipment form

### Step 4.2 - Pricing Admin UI

File: `apps/web/app/(admin)/pricing/page.tsx`
- Page header: "Pricing Rules" + "Add Pricing Rule" button
- Data table columns: Origin (State/City) | Destination (State/City) | Product Type | Service Type | Mode | Unit Price (INR/kg) | Min Charge | Active | Actions
- Filters (above table):
  - Origin State dropdown
  - Destination State dropdown
  - Product Type dropdown (from productTypes.list)
  - Service Type dropdown (from serviceTypes.list)
  - Mode Type dropdown (from modeTypes.list)
  - Active filter
- Add/Edit via dialog:
  - Origin State (required) + Origin City (optional - leave blank for "all cities")
  - Destination State (required) + Destination City (optional)
  - Product Type (select, required)
  - Service Type (select, required)
  - Mode Type (select, required)
  - Unit Price per kg (number input, INR)
  - Minimum Charge (number input, INR, default 0)
- Duplicate action: pre-fills form with existing rule's values for quick creation
- Delete with confirmation

### Phase 4 Deliverables Checklist
- [ ] PricingService with `calculate()` method implementing priority-based rule matching
- [ ] GST auto-detection (IGST vs CGST+SGST based on state comparison)
- [ ] Pricing rules CRUD (service + tRPC + UI)
- [ ] Duplicate rule protection (no two rules for same combination)
- [ ] Pricing admin page with full filter set
- [ ] `calculate` tRPC endpoint returning real-time price breakdown

---

## Phase 5: Shipments

### Goal
Implement the core shipment module: creation form with live billing, status management, tracking history, and the shipment list page. This is the most complex phase.

### Step 5.1 - Tracking Number Generator

File: `packages/services/shipment/tracking.ts`
- Function `generateTrackingNumber(branchCode: string): string`
- Format: `TPC-{BRANCH_CODE}-{YYMMDD}-{SEQ}`
- SEQ: query max existing tracking number for this branch+date, increment
- Example: `TPC-HO-MUM-001-260608-0001`

### Step 5.2 - Shipment Service

File: `packages/services/shipment/model.ts`
- `createShipmentInputSchema` - Zod: { branchId, senderId, receiverId, productTypeId, serviceTypeId, modeTypeId, weight, declaredValue, gstEnabled, invoiceTemplateId? }
- `updateShipmentStatusInputSchema` - { id, status, location?, remarks? }
- `shipmentOutputSchema` - full shipment with joined sender/receiver/branch/product/service/mode names
- `listShipmentsInputSchema` - { search?, status?, branchId?, dateFrom?, dateTo?, page?, limit? }
- `shipmentTrackingOutputSchema` - tracking history array
- `shipmentBillingOutputSchema` - price breakdown (mirrors calculatePriceOutput)

File: `packages/services/shipment/index.ts`
- Class `ShipmentService`:
  - `list(input)` - paginated, filterable by status/branch/date/search(tracking#)
  - `getById(id)` - full shipment with all joined data
  - `create(input)`:
    1. Validate branch exists and is active
    2. Validate sender and receiver exist
    3. Validate product/service/mode types exist and are active
    4. Validate sender and receiver pincodes are serviceable (via DestinationService)
    5. Call `PricingService.calculate()` to get price breakdown
    6. Generate tracking number via `generateTrackingNumber()`
    7. Snapshot sender/receiver addresses as JSONB
    8. Insert shipment record with status "BOOKED"
    9. Insert initial tracking history entry (status: BOOKED, location: branch name)
    10. Return created shipment with tracking number
  - `updateStatus(input)`:
    1. Validate status transition is valid (BOOKED->PICKED_UP->IN_TRANSIT->OUT_FOR_DELIVERY->DELIVERED, or any->CANCELLED/RETURNED)
    2. Update shipment status
    3. If status is DELIVERED, set `deliveredAt`
    4. Insert tracking history entry
    5. Return updated shipment
  - `getTracking(shipmentId)` - return full tracking history ordered by timestamp
  - `getByTrackingNumber(trackingNumber)` - public lookup (no auth needed)

**Status transition rules:**
```
BOOKED -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED
BOOKED -> CANCELLED (only from BOOKED)
PICKED_UP|IN_TRANSIT|OUT_FOR_DELIVERY -> RETURNED
```

### Step 5.3 - Shipment tRPC Routes

File: `packages/trpc/server/routes/shipment/route.ts`
- Admin routes use `adminProcedure`: `list`, `getById`, `create`, `updateStatus`
- Public route uses `publicProcedure`: `track` (public tracking, no auth)

File: `packages/trpc/server/routes/tracking/route.ts`
- Procedure: `getByTrackingNumber` uses `publicProcedure` (public, no auth)
- This is separate because it's a public endpoint

### Step 5.4 - Shipment List Page

File: `apps/web/app/(admin)/shipments/page.tsx`
- Page header: "Shipments" + "Create Shipment" button (links to /shipments/new)
- Stats row (top): Total | Booked | In Transit | Delivered | Returned
- Data table columns: Tracking # | Date | Sender | Receiver | Route (City->City) | Status (badge) | Amount | Actions
- Filters:
  - Search (tracking number)
  - Status dropdown (multi-select)
  - Branch dropdown
  - Date range picker
- Row click opens shipment detail (could be sheet or separate page)
- Shipment detail shows: full shipment info + billing breakdown + tracking timeline

### Step 5.5 - Shipment Creation Page

File: `apps/web/app/(admin)/shipments/new/page.tsx`

This is the most complex form in the application. Two-column layout:

**Left Column - Shipment Details Form:**

Section 1: Branch Selection
- Branch dropdown (from branches.list, active only)

Section 2: Sender Details
- Customer combobox/search (calls customers.search)
- Shows selected sender's details (name, phone, address) as read-only card
- "New Customer" link to quickly onboard inline

Section 3: Receiver Details
- Same combobox pattern as sender
- Shows selected receiver's details

Section 4: Shipment Specifications
- Product Type (select dropdown)
- Service Type (select dropdown)
- Mode of Transport (select dropdown)
- Weight in kg (number input, step 0.1)
- Declared Value in INR (number input)

Section 5: GST Configuration
- GST Toggle (switch)
- If GST on: auto-determined based on sender/receiver state (display only, not user-selectable)
  - Shows "IGST 18%" or "CGST 9% + SGST 9%"

**Right Column - Live Billing Panel (sticky):**

This panel auto-updates in real-time as user fills the form. It calls `pricing.calculate` via tRPC whenever the relevant inputs change (debounced 300ms).

```
+----------------------------------+
|  Billing Summary                 |
|                                  |
|  Route: Mumbai -> Delhi          |
|  Weight: 2.5 kg                  |
|  Unit Price: INR 50/kg           |
|                                  |
|  Base Price:        INR 125.00   |
|  --------------------------------|
|  GST (IGST 18%):   INR  22.50   |
|  --------------------------------|
|  Total Amount:      INR 147.50   |
|                                  |
|  [Create Shipment]               |
+----------------------------------+
```

- If pricing rule not found, show error: "No pricing rule configured for this route/combination"
- Disable submit button until price is calculated successfully
- On submit: call `shipments.create`, show success with tracking number, offer to print invoice

### Step 5.6 - Shipment Detail View

File: `apps/web/components/shipment/shipment-detail-sheet.tsx`
- Used as a sheet (side panel) opened from shipment list row click
- Sections:
  - Header: Tracking number + status badge + status update dropdown
  - Sender/Receiver info cards side by side
  - Shipment specs: product, service, mode, weight, declared value
  - Billing breakdown: base price, GST details, total
  - Tracking timeline: vertical stepper showing all status history entries
- Status update: dropdown of valid next statuses + location input + remarks input + "Update" button

### Phase 5 Deliverables Checklist
- [ ] Tracking number generator (branch-code + date + sequence)
- [ ] ShipmentService with create, updateStatus, list, getById, getTracking
- [ ] Status transition validation
- [ ] Address snapshot (JSONB) at booking time
- [ ] Serviceability validation (sender/receiver pincodes)
- [ ] Pricing engine integration in shipment creation
- [ ] Shipment list page with filters and status stats
- [ ] Shipment creation page with two-column layout and live billing
- [ ] Shipment detail sheet with tracking timeline
- [ ] Status update flow with tracking history insertion
- [ ] Public tracking endpoint (getByTrackingNumber)

---

## Phase 6: Invoice System

### Goal
Build the invoice template builder, PDF generation, QR code integration, and export functionality.

### Step 6.1 - Invoice Categories Service

File: `packages/services/invoice/model.ts`
- `createInvoiceCategoryInputSchema` - { name, description? }
- `invoiceCategoryOutputSchema`
- `createInvoiceTemplateInputSchema` - { name, categoryId, width, height, showQR, qrPosition?, layout, colors, typography, visibleFields, headerConfig?, footerConfig?, isDefault? }
- `updateInvoiceTemplateInputSchema` - { id, ...partial }
- `invoiceTemplateOutputSchema`

File: `packages/services/invoice/index.ts`
- Class `InvoiceService`:
  - Categories: `listCategories()`, `createCategory(input)`, `deleteCategory(id)` (block if templates exist in category)
  - Templates: `listTemplates(categoryId?)`, `getTemplateById(id)`, `createTemplate(input)`, `updateTemplate(input)`, `deleteTemplate(id)`, `setDefault(id)` (unset previous default)
  - Generation: `generateInvoiceData(shipmentId, templateId?)` - fetch shipment + template, return structured data for rendering
  - Export: `exportShipmentsCsv(shipmentIds)`, `exportShipmentsExcel(shipmentIds)`

### Step 6.2 - PDF & QR Generation

**New dependencies for apps/web:**
```bash
pnpm add @react-pdf/renderer qrcode
pnpm add -D @types/qrcode
```

File: `apps/web/components/invoice/invoice-renderer.tsx`
- React component that renders invoice based on template configuration
- Uses `@react-pdf/renderer` for PDF generation
- QR code generated via `qrcode` library, encodes: `{APP_URL}/track/{trackingNumber}`
- Respects template settings: dimensions, colors, typography, visible fields, QR position
- Renders: header (logo, company info), shipment details (sender, receiver, specs), billing breakdown, QR code, footer

File: `apps/web/components/invoice/invoice-preview.tsx`
- In-browser preview of the invoice (HTML version matching PDF layout)
- Used in invoice template builder for live preview

### Step 6.3 - Invoice tRPC Routes

File: `packages/trpc/server/routes/invoice/route.ts`
- All procedures use `adminProcedure` (admin-only access)
- Sub-routers:
  - categories: `list`, `create`, `delete`
  - templates: `list`, `getById`, `create`, `update`, `delete`, `setDefault`
  - generate: `getInvoiceData` (returns structured data, PDF rendered client-side)

### Step 6.4 - Invoice Template Builder Page

File: `apps/web/app/(admin)/invoices/page.tsx`

Two-section layout:

**Left: Template List**
- Category tabs at top (dynamic, from categories.list + "Add Category" button)
- Template cards within selected category
- Each card: template name, dimensions, default badge
- "Create Template" button

**Right: Template Editor (when template selected)**
- Form sections:
  - Basic: Name, Category (dropdown), Width (mm), Height (mm)
  - QR Code: Show QR (toggle), QR Position (select: 4 corners)
  - Colors: Primary, Secondary, Background, Text, Border (color pickers)
  - Typography: Heading Font (select), Heading Size (number), Base Font (select), Base Size (number)
  - Visible Fields: Checklist of toggles:
    - Tracking Number, Sender Name, Sender Address, Sender Phone
    - Receiver Name, Receiver Address, Receiver Phone
    - Product Type, Service Type, Mode Type
    - Weight, Declared Value
    - Base Price, GST Breakdown, Total Amount
    - Booked Date, Expected Delivery
  - Header Config: Company Name, Address, Logo URL
  - Footer Config: Terms text, Disclaimer text
- "Set as Default" button
- Live preview panel showing the invoice with sample data

### Step 6.5 - Export Functionality

File: `apps/web/components/invoice/export-dropdown.tsx`
- Dropdown button with options: "Export as PDF", "Export as CSV", "Export as Excel"
- PDF: uses `@react-pdf/renderer` to generate and download
- CSV: generates CSV string from shipment data, triggers download
- Excel: use `xlsx` library (add dependency: `pnpm add xlsx`)

This component is used:
1. On shipment detail (export single shipment invoice)
2. On shipment list (export selected/filtered shipments)

### Step 6.6 - Post-Shipment Invoice Flow

After shipment creation (Phase 5 Step 5.5), add:
- Success dialog shows: "Shipment Created! Tracking #: TPC-XXX"
- Buttons: "Print Invoice" (opens invoice in new tab/dialog), "Download PDF", "Create Another"
- Invoice template dropdown to switch templates before printing

### Phase 6 Deliverables Checklist
- [ ] Invoice categories CRUD
- [ ] Invoice templates CRUD with full customization
- [ ] Invoice template builder page with live preview
- [ ] PDF generation with @react-pdf/renderer
- [ ] QR code generation encoding tracking URL
- [ ] CSV export
- [ ] Excel export (xlsx)
- [ ] Export dropdown component
- [ ] Post-shipment invoice flow (print/download after creation)
- [ ] Default template system

---

## Phase 7: Public Pages

### Goal
Build the company landing page and the public shipment tracking page (QR scan destination).

### Step 7.1 - Landing Page

File: `apps/web/app/(public)/page.tsx`

Sections (top to bottom):

**Hero Section:**
- Headline: company tagline (e.g., "Reliable Courier Solutions Across India")
- Subheadline: brief description
- Two CTAs: "Track Shipment" (scrolls to tracking section) + "Login" (links to admin)
- Background: subtle gradient or illustration (CSS only, no external images)

**Services Section:**
- Section title: "Our Services"
- 4-6 cards showcasing service types (Express, Standard, Same-Day, etc.)
- Each card: icon (lucide), title, short description

**How It Works:**
- 3-step horizontal flow: Book -> Ship -> Deliver
- Each step: number badge, icon, title, description

**Coverage Section:**
- Stats: "500+ Cities", "28 States", "30+ Years", "1M+ Deliveries"
- Use stat-card component in a grid

**Track Your Shipment Section:**
- Large input field for tracking number
- "Track" button
- On submit: navigates to `/track/{trackingNumber}`

**Footer:**
- Company name and address
- Quick links: Track, Services, Contact
- Contact info: phone, email

### Step 7.2 - Public Tracking Page

File: `apps/web/app/(public)/track/[trackingNumber]/page.tsx`

- Calls `tracking.getByTrackingNumber` tRPC query (public endpoint)
- If not found: show "Shipment not found" message with search input to try another number

**If found, display:**

**Header:** Company branding bar (logo + name)

**Shipment Summary Card:**
- Tracking number (large, prominent)
- Current status badge
- From: city, state -> To: city, state
- Booked on: date
- Product type, Service type, Mode
- Weight

**Status Timeline (vertical stepper):**
- Each entry from shipment_tracking_history, ordered chronologically
- Each step shows: status label, location, date/time, remarks
- Current status step highlighted with accent color
- Future expected steps shown grayed out
- Completed steps shown with green checkmarks

**Design:** Clean, minimal, mobile-first (this page will be accessed from QR scan on phone)

### Phase 7 Deliverables Checklist
- [ ] Landing page with all 5 sections
- [ ] Responsive design (mobile + desktop)
- [ ] Track shipment input on landing page
- [ ] Public tracking page with status timeline
- [ ] Tracking page handles not-found gracefully
- [ ] No authentication required for public pages
- [ ] Mobile-optimized tracking page (QR scan target)

---

## Phase 8: Notification System

### Goal
Build the `packages/notification` package with adapter/factory pattern, implement all provider adapters, integrate with shipment lifecycle, and build the admin settings UI.

### Step 8.1 - Package Setup

```bash
mkdir -p packages/notification
```

File: `packages/notification/package.json`
```json
{
  "name": "@repo/notification",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@repo/database": "workspace:*",
    "@repo/logger": "workspace:*",
    "zod": "^4.3.5"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "typescript": "^5.9.3"
  }
}
```

Note: Provider-specific packages (resend, twilio, nodemailer, etc.) are added as optional/peer dependencies. Only install the ones actually configured.

### Step 8.2 - Core Types & Abstract Adapter

File: `packages/notification/types.ts`
- `NotificationChannel` = "email" | "sms" | "whatsapp"
- `NotificationResult` = { success, messageId?, channel, provider, error?, timestamp }
- `EmailPayload` = { to, subject, body, textBody?, from?, replyTo?, cc?, bcc?, attachments? }
- `SmsPayload` = { to, message, templateId?, senderId? }
- `WhatsAppPayload` = { to, templateName, templateLanguage, templateParams, mediaUrl? }
- `ProviderConfig` = { credentials: Record<string, string>, settings?: Record<string, string> }

File: `packages/notification/adapter.ts`
- Abstract class `NotificationAdapter<TPayload, TResult>`:
  - `protected channel: NotificationChannel`
  - `protected providerName: string`
  - Constructor accepts channel + providerName
  - Abstract: `send(payload: TPayload): Promise<TResult>`
  - Abstract: `sendBulk(payloads: TPayload[]): Promise<TResult[]>`
  - Abstract: `validateRecipient(recipient: string): boolean`
  - Abstract: `healthCheck(): Promise<boolean>`
  - Concrete: `getChannel()`, `getProviderName()`

### Step 8.3 - Email Channel

File: `packages/notification/channels/email/types.ts`
- Re-export EmailPayload, define EmailProviderConfig shapes per provider

File: `packages/notification/channels/email/providers/resend.ts`
- Class `ResendEmailAdapter extends NotificationAdapter<EmailPayload, NotificationResult>`
- Constructor takes `{ apiKey: string }`
- `send()`: calls Resend API via `resend` npm package
- `validateRecipient()`: email regex validation
- `healthCheck()`: test API key validity

File: `packages/notification/channels/email/providers/sendgrid.ts`
- Same pattern, uses `@sendgrid/mail`

File: `packages/notification/channels/email/providers/aws-ses.ts`
- Same pattern, uses `@aws-sdk/client-ses`

File: `packages/notification/channels/email/providers/smtp.ts`
- Same pattern, uses `nodemailer`
- Config: { host, port, secure, auth: { user, pass } }

File: `packages/notification/channels/email/factory.ts`
- Class `EmailNotificationFactory`:
  - Static method `createAdapter(provider: string, config: ProviderConfig): NotificationAdapter<EmailPayload, NotificationResult>`
  - Switch on provider name, instantiate correct adapter
  - Throw on unknown provider

### Step 8.4 - SMS Channel

File: `packages/notification/channels/sms/providers/twilio.ts`
- `TwilioSmsAdapter` using `twilio` package

File: `packages/notification/channels/sms/providers/msg91.ts`
- `Msg91SmsAdapter` using HTTP fetch (MSG91 REST API)

File: `packages/notification/channels/sms/providers/aws-sns.ts`
- `AwsSnsSmsAdapter` using `@aws-sdk/client-sns`

File: `packages/notification/channels/sms/providers/textlocal.ts`
- `TextlocalSmsAdapter` using HTTP fetch

File: `packages/notification/channels/sms/factory.ts`
- `SmsNotificationFactory` - same pattern as EmailNotificationFactory

### Step 8.5 - WhatsApp Channel

File: `packages/notification/channels/whatsapp/providers/twilio.ts`
- `TwilioWhatsAppAdapter` using `twilio` package (WhatsApp sandbox/API)

File: `packages/notification/channels/whatsapp/providers/gupshup.ts`
- `GupshupWhatsAppAdapter` using HTTP fetch

File: `packages/notification/channels/whatsapp/providers/meta.ts`
- `MetaWhatsAppAdapter` using Meta Graph API via fetch

File: `packages/notification/channels/whatsapp/factory.ts`
- `WhatsAppNotificationFactory`

### Step 8.6 - Notification Templates

File: `packages/notification/templates/shipment-booked.ts`
- Functions: `getShipmentBookedEmail(data)`, `getShipmentBookedSms(data)`, `getShipmentBookedWhatsApp(data)`
- Takes: { trackingNumber, senderName, receiverName, originCity, destinationCity, weight, totalAmount, trackingUrl }
- Returns channel-appropriate payload

File: `packages/notification/templates/status-update.ts`
- Functions for each channel
- Takes: { trackingNumber, status, location, remarks, trackingUrl }

File: `packages/notification/templates/delivery-confirmation.ts`
- Functions for each channel
- Takes: { trackingNumber, deliveredAt, receiverName, trackingUrl }

### Step 8.7 - NotificationService Orchestrator

File: `packages/notification/service.ts`
- Class `NotificationService`:
  - Constructor receives DB access (to read notification_configs)
  - `sendShipmentBooked(shipmentData, senderData, receiverData)`:
    1. Load active configs from DB
    2. For each active channel, get factory, create adapter
    3. Build payload using templates
    4. Call `adapter.send()` on all active channels concurrently (Promise.allSettled)
    5. Log results to notification_events table
    6. Return results
  - `sendStatusUpdate(shipmentData, newStatus, location, remarks)`: same pattern
  - `sendDeliveryConfirmation(shipmentData)`: same pattern
  - Private `getActiveAdapters()`: query DB, use factories, return map of channel -> adapter
  - Private `logNotificationEvent(event)`: insert into notification_events

File: `packages/notification/index.ts`
- Barrel export: NotificationService, all types, all factories, abstract adapter

### Step 8.8 - Notification Database Models & tRPC Routes

Database models already created in Phase 1 (notification_configs, notification_events).

File: `packages/services/notification/model.ts`
- `updateNotificationConfigInputSchema` - { channel, provider, isActive, credentials, settings? }
- `notificationConfigOutputSchema`
- `notificationEventListInputSchema` - { channel?, status?, dateFrom?, dateTo?, page?, limit? }

File: `packages/services/notification/index.ts`
- Class `NotificationConfigService`:
  - `getAll()` - list all configs (one per channel)
  - `update(input)` - upsert config for a channel
  - `testChannel(channel)` - send a test notification to admin's own email/phone
  - `getEventLog(input)` - paginated notification event history

File: `packages/trpc/server/routes/notification/route.ts`
- All procedures use `adminProcedure` (admin-only access)
- Procedures: `getConfigs`, `updateConfig`, `testChannel`, `getEventLog`

### Step 8.9 - Integrate Notifications with Shipment Lifecycle

Update `packages/services/shipment/index.ts`:
- In `create()`: after successful insert, call `notificationService.sendShipmentBooked()`
- In `updateStatus()`: after status update, call `notificationService.sendStatusUpdate()` or `sendDeliveryConfirmation()` (if DELIVERED)
- Notifications are fire-and-forget (don't block shipment operations on notification failure). Use try/catch, log errors.

### Step 8.10 - Admin Notification Settings Page

File: `apps/web/app/(admin)/settings/notifications/page.tsx`
- Page header: "Notification Settings"
- Three cards (one per channel: Email, SMS, WhatsApp):

**Each channel card contains:**
- Channel icon + name
- Active/Inactive toggle (prominent)
- Provider selection dropdown:
  - Email: Resend, SendGrid, AWS SES, SMTP
  - SMS: Twilio, MSG91, AWS SNS, Textlocal
  - WhatsApp: Twilio, Gupshup, Meta Business API
- Credential fields (dynamic based on selected provider):
  - Resend: API Key
  - SendGrid: API Key
  - AWS SES: Access Key ID, Secret Access Key, Region
  - SMTP: Host, Port, Username, Password
  - Twilio: Account SID, Auth Token, Phone Number
  - MSG91: Auth Key, Sender ID, DLT Template ID
  - etc.
- All credential fields masked (password type)
- "Test" button -> sends test notification, shows success/failure toast
- "Save" button -> calls updateConfig mutation

**Below cards:**
- Notification event log table:
  - Columns: Timestamp | Channel | Provider | Recipient | Event Type | Status (badge) | Error
  - Filters: channel, status, date range

### Phase 8 Deliverables Checklist
- [ ] packages/notification package initialized
- [ ] Abstract NotificationAdapter base class
- [ ] EmailNotificationFactory + 4 provider adapters (Resend, SendGrid, AWS SES, SMTP)
- [ ] SmsNotificationFactory + 4 provider adapters (Twilio, MSG91, AWS SNS, Textlocal)
- [ ] WhatsAppNotificationFactory + 3 provider adapters (Twilio, Gupshup, Meta)
- [ ] 3 notification templates (shipment booked, status update, delivery confirmation)
- [ ] NotificationService orchestrator with DB-driven configuration
- [ ] Notification config tRPC routes
- [ ] Notification event logging
- [ ] Integration with shipment create and updateStatus (fire-and-forget)
- [ ] Admin notification settings page with per-channel config
- [ ] Test notification functionality
- [ ] Notification event log table

---

## Phase 9: Analytics & Dashboard

### Goal
Build the main analytics dashboard with KPIs and charts, plus per-entity analytics for customers, product types, service types, and mode types.

### Step 9.1 - Dashboard Service

File: `packages/services/dashboard/model.ts`
- `dashboardOverviewOutputSchema` - { totalShipments, newOrdersToday, deliveredCount, deliveredPercentage, inTransitCount, pendingPickups, returnedCount, revenue, avgDeliveryTimeHours }
- `orderTrendOutputSchema` - Array<{ date, count }>
- `revenueTrendOutputSchema` - Array<{ period, amount }>
- `distributionOutputSchema` - Array<{ name, value }>
- `topBranchOutputSchema` - Array<{ branchName, shipmentCount }>
- `topCustomerOutputSchema` - Array<{ customerName, shipmentCount, revenue }>
- `recentActivityOutputSchema` - Array<{ id, type, description, timestamp, shipmentId? }>
- `dashboardInputSchema` - { dateFrom?, dateTo?, branchId? }

File: `packages/services/dashboard/index.ts`
- Class `DashboardService`:
  - `getOverview(input)` - aggregate queries:
    - COUNT shipments (total, by status)
    - SUM totalAmount (revenue)
    - AVG (deliveredAt - bookedAt) for delivered shipments
    - All filtered by date range
  - `getOrderTrend(input)` - GROUP BY date, COUNT shipments per day/week/month
  - `getRevenueTrend(input)` - GROUP BY period, SUM totalAmount
  - `getShipmentsByProductType(input)` - GROUP BY productTypeId, COUNT + JOIN name
  - `getShipmentsByServiceType(input)` - same pattern
  - `getShipmentsByMode(input)` - same pattern
  - `getTopBranches(input)` - GROUP BY branchId, COUNT, ORDER BY count DESC, LIMIT 10
  - `getTopCustomers(input)` - GROUP BY senderId, COUNT + SUM revenue, LIMIT 10
  - `getRecentActivities(input)` - Latest tracking history entries joined with shipment info, LIMIT 20

### Step 9.2 - Dashboard tRPC Routes

File: `packages/trpc/server/routes/dashboard/route.ts`
- All procedures use `adminProcedure` (admin-only access)
- Procedures: `getOverview`, `getOrderTrend`, `getRevenueTrend`, `getDistributionByProduct`, `getDistributionByService`, `getDistributionByMode`, `getTopBranches`, `getTopCustomers`, `getRecentActivities`
- All accept optional date range filter

### Step 9.3 - Dashboard UI

File: `apps/web/app/(admin)/dashboard/page.tsx`

**Layout (top to bottom):**

**Row 1: Date Range Selector**
- Preset buttons: Today, 7 Days, 30 Days, 90 Days
- Custom date range picker
- Optional branch filter dropdown

**Row 2: KPI Stat Cards (responsive grid, 4 columns on desktop, 2 on mobile)**
- Total Shipments (with trend vs previous period)
- New Orders Today
- Delivered Successfully (count + percentage)
- Revenue (INR, with trend)
- In-Transit
- Pending Pickups
- Returned/Failed
- Avg Delivery Time (hours)

**Row 3: Charts (2-column grid)**
- Left: Order Growth Over Time (area chart, Recharts)
- Right: Revenue Trend (bar chart, Recharts)

**Row 4: Distribution Charts (3-column grid)**
- By Product Type (donut chart)
- By Service Type (donut chart)
- By Mode Type (donut chart)

**Row 5: Rankings (2-column grid)**
- Left: Top Branches (horizontal bar chart)
- Right: Top Customers (table with rank, name, shipment count, revenue)

**Row 6: Recent Activity Feed**
- Table: Time | Activity | Tracking # | Status
- Shows latest 20 activities (new shipments, status changes)
- Auto-refresh every 30 seconds (React Query refetchInterval)

### Step 9.4 - Per-Entity Analytics

Add analytics endpoints and UI sections for Product Types, Service Types, and Mode Types pages.

**For each entity (product-type, service-type, mode-type):**

File update: `packages/services/{entity}/index.ts`
- Add method `getAnalytics(entityId, dateRange?)`:
  - Total shipments for this entity
  - Revenue generated
  - Avg delivery time
  - Monthly trend (count per month)
  - Top customers using this entity
  - Success rate (delivered / total)

File update: `packages/trpc/server/routes/{entity}/route.ts`
- Add `getAnalytics` procedure

File update: `apps/web/app/(admin)/{entity}/page.tsx`
- When a row is selected/expanded, show analytics panel below the table (or in a sheet):
  - Stat cards: Total Shipments, Revenue, Avg Delivery Time, Success Rate
  - Trend chart: monthly shipment count (line chart)
  - Date range filter for analytics

**Customer analytics** (already planned in Phase 3, Step 3.2) - ensure the analytics section on customer detail page uses same patterns.

### Phase 9 Deliverables Checklist
- [ ] DashboardService with all aggregation queries
- [ ] Dashboard tRPC routes (9 procedures)
- [ ] Dashboard page with full layout: stat cards, charts, activity feed
- [ ] Date range filtering across all dashboard widgets
- [ ] Recharts integration: area, bar, donut charts
- [ ] Top branches and top customers rankings
- [ ] Recent activity feed with auto-refresh
- [ ] Per-entity analytics for Product Types, Service Types, Mode Types
- [ ] Customer analytics on detail page

---

## Phase 10: Customer Portal

### Goal
Build the customer-facing portal with authentication, self-service tracking, shipment history, and profile management.

### Step 10.1 - Customer Authentication

**Note:** The `customerProcedure` middleware is already defined in Phase Auth (`packages/trpc/server/trpc.ts`). It extends `protectedProcedure` and checks `ctx.user.role === "customer"`. Customer portal uses this procedure for all authenticated customer routes.

For MVP, customer login uses OTP via SMS (not email/password like admin):

File: `packages/services/customer-auth/model.ts`
- `customerLoginInputSchema` - { phone: string } (OTP-based for MVP)
- `verifyOtpInputSchema` - { phone, otp }
- `customerSessionOutputSchema` - { customerId, token, expiresAt }

File: `packages/services/customer-auth/index.ts`
- Class `CustomerAuthService`:
  - `requestOtp(phone)`:
    1. Find customer by phone
    2. Generate 6-digit OTP
    3. Store OTP in DB (or in-memory with TTL for MVP)
    4. Send OTP via NotificationService (SMS channel)
    5. Return { success: true }
  - `verifyOtp(phone, otp)`:
    1. Validate OTP matches and not expired (5 min TTL)
    2. Find customer by phone
    3. Create/find user record with `role: "customer"` linked to customer
    4. Generate JWT token via `signToken({ id: userId })`
    5. Set HTTP-only cookie via `setAuthentication(ctx, token)`
    6. Return { customerId, token }

File: `packages/trpc/server/routes/customer-auth/route.ts`
- `requestOtp`: `publicProcedure` (POST)
- `verifyOtp`: `publicProcedure` (POST)

### Step 10.2 - Customer Track Shipment Page

File: `apps/web/app/(customer)/track/page.tsx`
- Large tracking number input field
- "Track" button
- On submit: calls `tracking.getByTrackingNumber`
- Shows same tracking timeline as public page but within the portal layout
- Additionally shows: billing details (if this customer is the sender)

### Step 10.3 - Customer Shipments Page

File: `apps/web/app/(customer)/shipments/page.tsx`
- Lists all shipments where this customer is sender or receiver
- Table columns: Tracking # | Date | From/To | Status | Amount
- Filters: status, date range
- Row click expands to show tracking timeline inline
- All routes use `customerProcedure` (from Phase Auth) to scope queries to authenticated customer
- `customerProcedure` extends `protectedProcedure` and ensures `ctx.user.role === "customer"`

### Step 10.4 - Customer Profile Page

File: `apps/web/app/(customer)/profile/page.tsx`
- Display: name, phone, email, address, ID proof info
- Edit form for: email, address (phone and ID proof are read-only after onboarding)
- Stats summary: total shipments, member since

### Step 10.5 - Customer Portal Login Page

File: `apps/web/app/(customer)/login/page.tsx`
- Step 1: Enter phone number -> "Send OTP" button
- Step 2: Enter 6-digit OTP (use `input-otp` component already installed) -> "Verify" button
- On success: store token, redirect to /shipments
- On failure: show error, allow retry

**Auth state management:**
- Store JWT in httpOnly cookie or localStorage (for MVP, localStorage)
- Create `useCustomerAuth` hook
- Wrap `(customer)` layout with auth check, redirect to login if not authenticated

### Phase 10 Deliverables Checklist
- [ ] Customer OTP login flow (request OTP + verify)
- [ ] Customer JWT session management
- [ ] Customer login page with OTP input
- [ ] Customer track shipment page
- [ ] Customer shipments list (scoped to authenticated customer)
- [ ] Customer profile page (view + edit)
- [ ] customerProcedure (protected tRPC procedure)
- [ ] Auth check in customer layout (redirect to login)
- [ ] OTP delivery via notification system (SMS)

---

## Cross-Cutting Concerns (Applied Throughout All Phases)

### Error Handling
- All tRPC procedures use `TRPCError` with appropriate codes (NOT_FOUND, BAD_REQUEST, CONFLICT, INTERNAL_SERVER_ERROR)
- Service layer throws typed errors, tRPC layer catches and maps
- Frontend: toast notifications for errors (using Sonner, already installed)

### Validation
- All inputs validated via Zod schemas at the tRPC procedure level
- Frontend forms use `react-hook-form` + `@hookform/resolvers/zod` (both already installed)

### Pagination Pattern
- All list endpoints accept `{ page: number, limit: number }` (default: page=1, limit=20)
- Return `{ data: T[], total: number, page: number, limit: number, totalPages: number }`
- Frontend data-table component handles pagination controls

### Search Pattern
- Text search across relevant columns using `ilike` in Drizzle
- Debounced search input (300ms) on frontend

### Loading States
- Use React Query's `isLoading`, `isFetching` states
- Skeleton components from shadcn for loading states
- Spinner component (already exists) for action buttons

### Optimistic Updates
- Toggle switches (destination serviceability, active/inactive) use optimistic updates via React Query
- Rollback on error with toast notification

---

## Implementation Order Summary

```
Phase 1: Foundation ──────────────────────────────────────┐
    |                                                      |
    ├──> Phase 2: Masters (Product/Service/Mode/Branch)    |
    |                                                      |
    ├──> Phase 3: Customers & Destinations                 |
    |                                                      |
    └──> Phase Auth: Authentication & RBAC ──────┐         |
                                                  |         |
              Phase 2 + Phase 3 + Phase Auth ─────┤         |
                                                  v         |
                                       Phase 4: Pricing     |
                                       & Shipments          |
                                              |             |
                             +----------------+--------+    |
                             |                |        |    |
                             v                v        v    v
                    Phase 5: Invoices  Phase 6: Public  Phase 7: Notifications
                             |                |              |
                             v                v              v
                        Phase 8: Analytics Dashboard
                                   |
                                   v
                        Phase 9: Customer Portal
```

- Phase Auth can run in parallel with Phase 2 and Phase 3 (all depend only on Phase 1)
- Phase 4 requires Phase 2, 3, AND Auth (uses `adminProcedure` for all admin routes)
- Phases 5, 6, 7 can be worked on in parallel after Phase 4
- Phase 9 is last because it requires notifications (Phase 7) for OTP login

---
---

# Visual UI Wireframes & User Flows

---

## A. User Flow Diagrams

### A.1 Admin - Complete Navigation Flow

```
                                    +-------------+
                                    |   Login     |
                                    | (Admin Auth)|
                                    +------+------+
                                           |
                                           v
                              +------------+------------+
                              |                         |
                              |       DASHBOARD         |
                              |    (Default Landing)    |
                              |                         |
                              +------------+------------+
                                           |
              +----------+--------+--------+--------+---------+----------+
              |          |        |        |        |         |          |
              v          v        v        v        v         v          v
         Shipments  Customers  Branches  Dest.   Pricing  Invoices   Masters
              |          |        |        |        |         |          |
              v          v        v        v        v         v          v
          +---+---+   +--+--+   CRUD    Toggle   CRUD    Template   +--+--+
          |       |   |     |   Page    Table    Page    Builder    |  |  |
         List   New   List  Detail                                Prod Svc Mode
          |       |         |
          v       v         v
        Detail  Create   Analytics
        Sheet   Flow     + History
          |       |
          v       v
        Update  Invoice
        Status  Print
```

### A.2 Shipment Creation Flow (Most Critical User Journey)

```
    Admin clicks "Create Shipment"
                |
                v
    +---------------------+     +----------------------+
    | Step 1: Select      |     |                      |
    | Branch              +---->+  Branch dropdown      |
    | (from active list)  |     |  loads active only    |
    +---------------------+     +----------------------+
                |
                v
    +---------------------+     +----------------------+
    | Step 2: Select      |     |  Combobox search     |
    | Sender              +---->+  by name / phone     |
    | (from customers)    |     |  Shows address card  |
    +---------------------+     +---+------------------+
                |                   |
                |            [or "New Customer" inline]
                v
    +---------------------+     +----------------------+
    | Step 3: Select      |     |  Same combobox       |
    | Receiver            +---->+  pattern as sender   |
    | (from customers)    |     |  Shows address card  |
    +---------------------+     +----------------------+
                |
                v
    +---------------------+     +---------------------------+
    | Step 4: Shipment    |     | Product Type   [dropdown] |
    | Specifications      +---->+ Service Type   [dropdown] |
    |                     |     | Mode           [dropdown] |
    +---------------------+     | Weight (kg)    [input]    |
                |               | Declared Value [input]    |
                |               +---------------------------+
                v
    +---------------------+     +---------------------------+
    | Step 5: Billing     |     | Auto-calculated:          |
    | (Live, auto-updates)|     | Base Price = W x UnitP    |
    |                     +---->+ GST toggle [on/off]       |
    |                     |     | GST split (auto-detect)   |
    +---------------------+     | Total Amount              |
                |               +---------------------------+
                v
    +---------------------+
    | Submit              |
    | "Create Shipment"   |
    +---------+-----------+
              |
              v
    +---------------------+     +---------------------------+
    | Success!            |     | Tracking #: TPC-MUM-...   |
    | Show result         +---->+ [Print Invoice]           |
    |                     |     | [Download PDF]            |
    +---------------------+     | [Create Another]          |
              |                 +---------------------------+
              v
      Notification sent
      (SMS/Email/WhatsApp)
```

### A.3 Customer Portal Flow

```
    Customer visits portal
              |
              v
    +-------------------+
    | Login Page        |
    | Enter Phone #     |
    +--------+----------+
             |
             v
    +-------------------+         +-------------------+
    | OTP Sent (SMS)    +-------->| Enter 6-digit OTP |
    +-------------------+         +--------+----------+
                                           |
                                           v
                                  +--------+----------+
                                  |  Verified?        |
                                  +---+----------+----+
                                      |          |
                                   Yes          No
                                      |          |
                                      v          v
                              +-----------+  Retry / Error
                              | My        |
                              | Shipments |
                              | (Default) |
                              +-----+-----+
                                    |
                   +----------------+----------------+
                   |                |                |
                   v                v                v
            Track Shipment    My Shipments       Profile
                   |                |                |
                   v                v                v
            Enter Tracking#   Table of all      View/Edit
            See Timeline      sent/received     Name, Email,
                              Click -> Detail   Address
```

### A.4 QR Scan / Public Tracking Flow

```
    QR code on invoice/parcel
              |
              v (phone camera scan)
    +-------------------------+
    | Browser opens URL:      |
    | /track/TPC-MUM-260608.. |
    +------------+------------+
                 |
                 v
    +------------+------------+
    | Public Tracking Page    |
    | (No login needed)       |
    |                         |
    | - Shipment Summary      |
    | - Status Timeline       |
    | - Current Location      |
    +-------------------------+
```

### A.5 Invoice Template Configuration Flow

```
    Admin visits Invoice Templates
              |
              v
    +-------------------------+
    | Category Tabs           |
    | [Standard] [Express]    |
    | [+ Add Category]       |
    +------------+------------+
                 |
                 v
    +------------+------------+
    | Template List           |
    | Card 1: "Default A4"   |
    | Card 2: "Compact"      |
    | [+ Create Template]    |
    +------------+------------+
                 |  (click template)
                 v
    +------+-----+-----+------+
    | Edit |           | Live |
    | Form |           | Prev |
    |      |           |      |
    | Name |           | +--+ |
    | Size |           | |QR| |
    | QR   |           | +--+ |
    | Color|           | From |
    | Font |           | To.. |
    | Fields           | Amt  |
    +------+-----------+------+
                 |
                 v
    Save / Set as Default
```

### A.6 Notification Settings Configuration Flow

```
    Admin visits Settings > Notifications
              |
              v
    +--------------------------------------------+
    | Three channel cards side by side:           |
    |                                            |
    | +----------+ +----------+ +-----------+   |
    | |  Email   | |   SMS    | | WhatsApp  |   |
    | | [toggle] | | [toggle] | | [toggle]  |   |
    | | Provider | | Provider | | Provider  |   |
    | | [select] | | [select] | | [select]  |   |
    | | API Key  | | Auth Key | | API Key   |   |
    | | [*****]  | | [*****]  | | [*****]   |   |
    | | [Test]   | | [Test]   | | [Test]    |   |
    | | [Save]   | | [Save]   | | [Save]    |   |
    | +----------+ +----------+ +-----------+   |
    +--------------------------------------------+
              |
              v
    +--------------------------------------------+
    | Notification Log Table                     |
    | Time | Channel | Recipient | Status | ...  |
    +--------------------------------------------+
```

### A.7 Admin Customer Onboarding Flow (Smart OCR)

```
    Admin clicks "Onboard Customer"
                |
                v
    +-------------------------+
    | Onboard Sheet Opens     |
    | Option A: Upload ID     |
    | Option B: Fill manually |
    +--------+-------+--------+
             |       |
         Upload ID   Skip
             |       |
             v       +----------+
    +----------------+          |
    | Drop zone:     |          |
    | Upload ID      |          |
    | proof image    |          |
    +--------+-------+          |
             |                  |
             v                  |
    +----------------+          |
    | Tesseract.js   |          |
    | OCR Processing |          |
    | eng + hin      |          |
    | [====== 67%]   |          |
    +--------+-------+          |
             |                  |
        +----+----+             |
        |         |             |
     Success    Failed          |
        |         |             |
        v         v             v
    +---------+ +-----------------------+
    | OCR OK  | | Manual Form           |
    | PAN det.| | (all fields empty)    |
    | 92% conf| |                       |
    +---------+ +-----------+-----------+
        |                   |
        v                   |
    +-----------------------+
    | Form pre-filled:      |
    |                       |
    | FROM OCR (editable):  |
    | - ID Type (detected)  |
    | - ID Number           |
    | - Full Name           |
    | - DOB                 |
    | - Address (partial)   |
    |                       |
    | MANUAL (admin fills): |
    | - Phone *             |
    | - Email               |
    | - City, State, Pin    |
    |   (pre-filled if      |
    |    parsed from addr)  |
    +--------+--------------+
             |
             v
    +-----------------+
    | Admin reviews   |
    | Corrects errors |
    | Fills missing   |
    +--------+--------+
             |
             v
    +-----------------+
    | Create Customer |
    +-----------------+
             |
             v
    +-----------------+
    | Customer saved  |
    | Redirect to     |
    | detail page     |
    +-----------------+
```

**Key distinction between Admin and Customer onboarding:**

```
+-----------------------------+    +-------------------------------+
| ADMIN ONBOARDING            |    | CUSTOMER SELF-REGISTRATION    |
| (Smart OCR flow)            |    | (Phase 10: Customer Portal)   |
+-----------------------------+    +-------------------------------+
|                             |    |                               |
| 1. Upload ID proof image    |    | 1. Enter phone number         |
| 2. OCR auto-extracts data   |    | 2. Verify OTP                 |
| 3. Form pre-filled          |    | 3. Fill ALL fields manually:  |
| 4. Admin reviews/corrects   |    |    - Name, Phone, Email       |
| 5. Admin fills: phone,email |    |    - Address, City, State     |
| 6. Click "Create Customer"  |    |    - ID Proof Type + Number   |
|                             |    |    - Upload ID image (proof)  |
| OCR = productivity assist   |    | 4. Submit registration        |
| Image = source of truth     |    |                               |
| Admin = final authority     |    | Manual = customer fills all   |
+-----------------------------+    | Image = just for verification |
                                   +-------------------------------+
```

---

## B. Page Wireframes (Visual Layout)

---

### B.1 Admin Sidebar Layout (Shell for all admin pages)

```
+--+-------------------------------+-----------------------------------------------+
|  | TPC India                     | Breadcrumb: Dashboard > ...          [Avatar] |
|  | Courier Services              +-----------------------------------------------+
|  +-------------------------------+                                               |
|  |                               |                                               |
|  | * Dashboard                   |                                               |
|  |                               |                                               |
|  | OPERATIONS                    |         << PAGE CONTENT HERE >>               |
|  | * Shipments            >      |                                               |
|  |   - All Shipments             |                                               |
|  |   - Create New                |                                               |
|  | * Customers                   |                                               |
|  | * Branches                    |                                               |
|  | * Destinations                |                                               |
|  |                               |                                               |
|  | MANAGEMENT                    |                                               |
|  | * Pricing Rules               |                                               |
|  | * Invoice Templates           |                                               |
|  |                               |                                               |
|  | MASTERS                       |                                               |
|  | * Product Types               |                                               |
|  | * Service Types               |                                               |
|  | * Mode Types                  |                                               |
|  |                               |                                               |
|  | SETTINGS                      |                                               |
|  | * Notifications               |                                               |
|  |                               |                                               |
|  +-------------------------------+                                               |
|  | [<>] Collapse sidebar         |                                               |
+--+-------------------------------+-----------------------------------------------+
```

- Sidebar width: ~260px expanded, ~60px collapsed (icon-only)
- Active item: highlighted with primary blue background
- Section labels (OPERATIONS, MANAGEMENT, etc.): muted uppercase text
- Top-right: user avatar with dropdown (profile, logout)
- Breadcrumb bar separates sidebar from page content

---

### B.2 Dashboard Page

```
+-----------------------------------------------+-----------------------------------------------+
| Dashboard                                                                          [Today v] |
|                                                                          [7d] [30d] [90d]    |
+---------+---------+---------+---------+---------+---------+---------+---------+---------------+
|         |         |         |         |         |         |         |         |
| Total   | New     | Delvd   | In      | Pending | Returnd | Revenue | Avg     |
| Shipmts | Today   | Success | Transit | Pickup  | Failed  |         | Time    |
|         |         |         |         |         |         |         |         |
| 12,847  |  43     | 11,204  |  892    |  156    |  312    | 48.2L   | 2.4d    |
| +12.3%  |  +5     | 87.2%   |         |         |  2.4%   | +8.1%   | -0.2d   |
|  ^green |         |  ^green |  blue   | amber   |  ^red   |  ^green |  ^green |
+---------+---------+---------+---------+---------+---------+---------+---------+

+------------------------------------------+    +------------------------------------------+
| Order Growth Over Time              [^]  |    | Revenue Trend                       [^]  |
|                                          |    |                                          |
|    ^                                     |    |   ___                                    |
|    |          ___/----\___/---           |    |  |   |  ___       ___                    |
|    |     ___/                            |    |  |   | |   | ___ |   |  ___              |
|    |  __/                                |    |  |   | |   ||   ||   | |   |             |
|    | /                                   |    |  |   | |   ||   ||   | |   |             |
|    +-----------------------------------> |    |  +---+-+---++---++---+-+---+---->         |
|     Jan  Feb  Mar  Apr  May  Jun         |    |   Jan  Feb  Mar  Apr  May  Jun           |
|                           Area Chart     |    |                           Bar Chart       |
+------------------------------------------+    +------------------------------------------+

+------------------------+  +------------------------+  +---------------------------+
| By Product Type   [^]  |  | By Service Type   [^]  |  | By Transport Mode   [^]   |
|                        |  |                        |  |                           |
|      +------+          |  |      +------+          |  |       +------+            |
|     /  Doc   \         |  |     / Std    \         |  |      / Air    \           |
|    | 35%  Parc|        |  |    | 42% Expr|         |  |     | 28% Rail|           |
|     \ Elec  /          |  |     \ Same /           |  |      \ Road /            |
|      +------+          |  |      +------+          |  |       +------+            |
|   Frag  Liq  Other     |  |  Next  Econ  Priority  |  |     Multi   Other        |
|                        |  |                        |  |                           |
|      Donut Chart       |  |      Donut Chart       |  |       Donut Chart        |
+------------------------+  +------------------------+  +---------------------------+

+------------------------------------------+    +------------------------------------------+
| Top Branches                        [^]  |    | Top Customers                       [^]  |
|                                          |    |                                          |
| Mumbai HO    ==================== 1,842  |    | #  Name            Shipments  Revenue    |
| Delhi Hub    ================ 1,456      |    | 1  Rajesh Sharma       342    2.8L       |
| Bangalore    ============= 1,203         |    | 2  Priya Patel         298    2.1L       |
| Chennai      =========== 987             |    | 3  Amit Singh          276    1.9L       |
| Hyderabad    ========= 834              |    | 4  Sneha Reddy         231    1.7L       |
|              Horizontal Bar Chart        |    | 5  Vikram Mehta        198    1.4L       |
+------------------------------------------+    +------------------------------------------+

+-------------------------------------------------------------------------------------+
| Recent Activity                                                             [^]     |
+-------------------------------------------------------------------------------------+
| Time          Activity                          Tracking #          Status          |
+-------------------------------------------------------------------------------------+
| 2 min ago     New shipment created              TPC-MUM-260608-42   BOOKED          |
| 5 min ago     Status updated                    TPC-DEL-260608-18   IN_TRANSIT      |
| 8 min ago     Delivered successfully            TPC-BLR-260607-93   DELIVERED       |
| 12 min ago    New shipment created              TPC-MUM-260608-41   BOOKED          |
| 15 min ago    Shipment returned                 TPC-CHN-260606-12   RETURNED        |
+-------------------------------------------------------------------------------------+
|                              [1] [2] [3] ... [Next]                                 |
+-------------------------------------------------------------------------------------+
```

---

### B.3 Shipments List Page

```
+-------------------------------------------------------------------------------------+
| Shipments                                                    [+ Create Shipment]    |
| Manage all shipments and track their status                                         |
+-------------------------------------------------------------------------------------+

+-----------+  +-----------+  +------------+  +------------+  +----------+
| Total     |  | Booked    |  | In Transit |  | Delivered  |  | Returned |
| 12,847    |  | 156       |  | 892        |  | 11,204     |  | 312      |
+-----------+  +-----------+  +------------+  +------------+  +----------+

+-------------------------------------------------------------------------------------+
| [Search by tracking #...]     [Status: All v]  [Branch: All v]  [Date: Last 30d v]  |
+-------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------+
| [ ] | Tracking #           | Date       | Sender        | Receiver      | Route       | Status       | Amount    | Actions |
+-----+----------------------+------------+---------------+---------------+-------------+--------------+-----------+---------+
| [ ] | TPC-MUM-260608-0042  | 08 Jun 26  | Rajesh Sharma | Priya Patel   | MUM -> DEL  | [BOOKED]     | 1,250.00  | [...] |
| [ ] | TPC-DEL-260608-0018  | 08 Jun 26  | Amit Singh    | Sneha Reddy   | DEL -> BLR  | [IN_TRANSIT] | 2,340.00  | [...] |
| [ ] | TPC-BLR-260607-0093  | 07 Jun 26  | Vikram Mehta  | Ravi Kumar    | BLR -> CHN  | [DELIVERED]  |   890.00  | [...] |
| [ ] | TPC-MUM-260607-0088  | 07 Jun 26  | Priya Patel   | Amit Singh    | MUM -> HYD  | [OUT_FOR_D.] | 1,560.00  | [...] |
| [ ] | TPC-CHN-260606-0012  | 06 Jun 26  | Ravi Kumar    | Rajesh Sharma | CHN -> MUM  | [RETURNED]   | 3,200.00  | [...] |
+-----+----------------------+------------+---------------+---------------+-------------+--------------+-----------+---------+
| Showing 1-20 of 12,847                                             [< Prev] [1] [2] [3] ... [Next >] |
+-------------------------------------------------------------------------------------+
```

**Status badge colors:**
- BOOKED = blue outline
- PICKED_UP = cyan fill
- IN_TRANSIT = amber fill
- OUT_FOR_DELIVERY = orange fill
- DELIVERED = green fill
- RETURNED = red fill
- CANCELLED = gray fill

---

### B.4 Shipment Creation Page (Two-Column Layout)

```
+-------------------------------------------------------------------------------------+
| Create New Shipment                                                    [< Back]     |
+-------------------------------------------------------------------------------------+

+-------------------------------------------+    +------------------------------------+
| SHIPMENT DETAILS                          |    | BILLING SUMMARY              [sticky]
|                                           |    |                                    |
| Branch *                                  |    | Route                              |
| +-----------------------------------+    |    | Mumbai, MH -> Delhi, DL            |
| | Mumbai Head Office (HO-MUM-001) v |    |    |                                    |
| +-----------------------------------+    |    | Weight         2.500 kg             |
|                                           |    | Unit Price     50.00/kg             |
| ---- SENDER DETAILS ----                 |    |                                    |
|                                           |    | +--------------------------------+ |
| Sender *                                  |    | |                                | |
| +-----------------------------------+    |    | | Base Price        INR 125.00    | |
| | [Search customer by name/phone..] |    |    | |                                | |
| +-----------------------------------+    |    | | GST (IGST 18%)    INR  22.50   | |
|                                           |    | |                                | |
| +-----------------------------------+    |    | | ============================== | |
| | Rajesh Sharma                      |    |    | |                                | |
| | +91 98765 43210                    |    |    | | TOTAL            INR 147.50    | |
| | 42 MG Road, Andheri West          |    |    | |                                | |
| | Mumbai, Maharashtra - 400058      |    |    | +--------------------------------+ |
| +-----------------------------------+    |    |                                    |
|                                           |    | GST                                |
| ---- RECEIVER DETAILS ----              |    | [x] Apply GST                      |
|                                           |    |                                    |
| Receiver *                                |    | Type: IGST (Inter-state)           |
| +-----------------------------------+    |    | Auto-detected: MH -> DL            |
| | [Search customer by name/phone..] |    |    |                                    |
| +-----------------------------------+    |    |                                    |
|                                           |    |                                    |
| +-----------------------------------+    |    |                                    |
| | Priya Patel                        |    |    |                                    |
| | +91 87654 32109                    |    |    |                                    |
| | 15 Connaught Place                 |    |    |                                    |
| | New Delhi, Delhi - 110001          |    |    |                                    |
| +-----------------------------------+    |    |                                    |
|                                           |    |                                    |
| ---- SHIPMENT SPECIFICATIONS ----       |    |                                    |
|                                           |    |                                    |
| Product Type *        Service Type *      |    |                                    |
| +----------------+   +----------------+  |    |                                    |
| | Parcel       v |   | Express      v |  |    |                                    |
| +----------------+   +----------------+  |    |                                    |
|                                           |    |                                    |
| Mode of Transport *                      |    |                                    |
| +-----------------------------------+    |    |                                    |
| | Air                             v |    |    |                                    |
| +-----------------------------------+    |    |                                    |
|                                           |    |                                    |
| Weight (kg) *          Declared Value *   |    |                                    |
| +----------------+   +----------------+  |    |                                    |
| | 2.500          |   | 5,000.00       |  |    |                                    |
| +----------------+   +----------------+  |    |                                    |
|                                           |    |                                    |
+-------------------------------------------+    |  [Create Shipment]                 |
                                                  +------------------------------------+
```

**Interaction notes:**
- Right billing panel is `position: sticky` so it stays visible while scrolling the form
- Billing recalculates on every change to: branch, sender, receiver, product, service, mode, weight
- Uses debounced (300ms) tRPC call to `pricing.calculate`
- If no pricing rule found, billing panel shows error: "No pricing rule configured"
- Create Shipment button disabled until billing is successfully calculated

---

### B.5 Shipment Detail Sheet (Slides from right)

```
                                              +------------------------------------+
                                              | Shipment Detail            [X]     |
                                              +------------------------------------+
                                              |                                    |
                                              | TPC-MUM-260608-0042                |
                                              | Status: [IN_TRANSIT]               |
                                              |                                    |
                                              | Update Status:                     |
                                              | [OUT_FOR_DELIVERY v] [Location..] |
                                              | [Remarks...]        [Update]      |
                                              |                                    |
                                              | ---- ROUTE ----                   |
                                              | From: Mumbai, MH (400058)         |
                                              | To:   Delhi, DL (110001)          |
                                              |                                    |
                                              | ---- SENDER ----                  |
                                              | Rajesh Sharma                      |
                                              | +91 98765 43210                   |
                                              | 42 MG Road, Andheri West          |
                                              |                                    |
                                              | ---- RECEIVER ----                |
                                              | Priya Patel                        |
                                              | +91 87654 32109                   |
                                              | 15 Connaught Place                |
                                              |                                    |
                                              | ---- SPECIFICATIONS ----          |
                                              | Product: Parcel                    |
                                              | Service: Express                   |
                                              | Mode:    Air                       |
                                              | Weight:  2.500 kg                  |
                                              | Declared: INR 5,000               |
                                              |                                    |
                                              | ---- BILLING ----                 |
                                              | Base Price:   INR 125.00           |
                                              | IGST (18%):   INR  22.50           |
                                              | Total:        INR 147.50           |
                                              |                                    |
                                              | ---- TRACKING TIMELINE ----       |
                                              |                                    |
                                              | [*] BOOKED                        |
                                              |  |  Mumbai HO                     |
                                              |  |  08 Jun 2026, 09:30 AM         |
                                              |  |                                |
                                              | [*] PICKED_UP                     |
                                              |  |  Mumbai HO                     |
                                              |  |  08 Jun 2026, 11:45 AM         |
                                              |  |                                |
                                              | [*] IN_TRANSIT  <-- current       |
                                              |  |  Mumbai Airport Hub            |
                                              |  |  08 Jun 2026, 02:15 PM         |
                                              |  |  "Dispatched via Air"           |
                                              |  |                                |
                                              | [ ] OUT_FOR_DELIVERY  (grayed)    |
                                              |  |                                |
                                              | [ ] DELIVERED  (grayed)           |
                                              |                                    |
                                              | [Print Invoice v] [Export v]       |
                                              +------------------------------------+
```

---

### B.6 Branches Page

```
+-------------------------------------------------------------------------------------+
| Branches                                                        [+ Add Branch]      |
| Manage your branch offices and collection centers                                   |
+-------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------+
| [Search by name or code...]     [Type: All v]  [Status: Active v]                   |
+-------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------+
| Code          | Name               | Type             | City      | State   | Status   | Actions   |
+---------------+--------------------+------------------+-----------+---------+----------+-----------+
| HO-MUM-001   | Mumbai Head Office  | Head Office      | Mumbai    | MH      | [Active] | [Edit][X] |
| RO-DEL-001   | Delhi Regional      | Regional Office  | New Delhi | DL      | [Active] | [Edit][X] |
| FR-BLR-001   | Bangalore South     | Franchise        | Bangalore | KA      | [Active] | [Edit][X] |
| CC-CHN-001   | Chennai Central     | Collection Ctr   | Chennai   | TN      | [Active] | [Edit][X] |
| HB-HYD-001   | Hyderabad Hub       | Hub              | Hyderabad | TS      | [Inactive]| [Edit][X] |
+---------------+--------------------+------------------+-----------+---------+----------+-----------+
```

**Add/Edit Branch Sheet (slides from right):**

```
                                              +------------------------------------+
                                              | Add Branch                 [X]     |
                                              +------------------------------------+
                                              |                                    |
                                              | Branch Code *                      |
                                              | [HO-MUM-002             ]          |
                                              |                                    |
                                              | Branch Name *                      |
                                              | [Mumbai Andheri Office   ]          |
                                              |                                    |
                                              | Type *                             |
                                              | [Regional Office        v]          |
                                              |                                    |
                                              | City *             State *          |
                                              | [Mumbai      ]    [Maharashtra v]  |
                                              |                                    |
                                              | Address                            |
                                              | [42 Link Road, Andheri   ]          |
                                              | [West                    ]          |
                                              |                                    |
                                              | Pincode                            |
                                              | [400058    ]                       |
                                              |                                    |
                                              | Contact Phone                      |
                                              | [+91 22 2634 5678       ]          |
                                              |                                    |
                                              | Contact Email                      |
                                              | [mumbai@tpcindia.com    ]          |
                                              |                                    |
                                              | Latitude       Longitude           |
                                              | [19.1364     ] [72.8296    ]       |
                                              | (Optional)     (Optional)          |
                                              |                                    |
                                              |          [Cancel]  [Save Branch]   |
                                              +------------------------------------+
```

---

### B.7 Customers List Page

```
+-------------------------------------------------------------------------------------+
| Customers                                                 [+ Onboard Customer]      |
| Manage customers and view individual analytics                                      |
+-------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------+
| [Search by name, phone, or email...]                        [Status: Active v]      |
+-------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------+
| Name            | Phone          | Email              | City      | ID Proof | Status   | Actions  |
+-----------------+----------------+--------------------+-----------+----------+----------+----------+
| Rajesh Sharma   | +91 98765 4321 | rajesh@mail.com    | Mumbai    | PAN      | [Active] | [View]   |
| Priya Patel     | +91 87654 3210 | priya@mail.com     | New Delhi | AADHAAR  | [Active] | [View]   |
| Amit Singh      | +91 76543 2109 | -                  | Bangalore | VOTER_ID | [Active] | [View]   |
| Sneha Reddy     | +91 65432 1098 | sneha@mail.com     | Hyderabad | PAN      | [Active] | [View]   |
+-----------------+----------------+--------------------+-----------+----------+----------+----------+
| Showing 1-20 of 1,247                                          [< Prev] [1] [2] [Next >] |
+-------------------------------------------------------------------------------------+
```

---

### B.7.1 Admin Onboard Customer Sheet (Smart OCR Flow)

This sheet opens when admin clicks "Onboard Customer". It has two phases.

**Phase 1 - Upload ID Proof (initial state):**

```
                                              +------------------------------------+
                                              | Onboard New Customer        [X]    |
                                              +------------------------------------+
                                              |                                    |
                                              | Upload a customer's ID proof to    |
                                              | auto-fill details, or fill         |
                                              | manually.    [Skip, fill manually] |
                                              |                                    |
                                              | STEP 1: Upload ID Proof            |
                                              |                                    |
                                              | +--------------------------------+ |
                                              | |                                | |
                                              | |                                | |
                                              | |   [Upload icon]                | |
                                              | |                                | |
                                              | |   Drag & drop ID proof image   | |
                                              | |   or click to browse           | |
                                              | |                                | |
                                              | |   Supports: Aadhaar, PAN,     | |
                                              | |   Voter ID, Driving License,  | |
                                              | |   Passport                    | |
                                              | |                                | |
                                              | |   JPG, PNG (max 5MB)          | |
                                              | |                                | |
                                              | +--------------------------------+ |
                                              |                                    |
                                              +------------------------------------+
```

**Phase 1b - Processing (OCR running):**

```
                                              +------------------------------------+
                                              | Onboard New Customer        [X]    |
                                              +------------------------------------+
                                              |                                    |
                                              | +--------------------------------+ |
                                              | |                                | |
                                              | |   [Uploaded image thumbnail]   | |
                                              | |   pan_card_rajesh.jpg          | |
                                              | |                                | |
                                              | +--------------------------------+ |
                                              |                                    |
                                              | Extracting data from ID proof...   |
                                              |                                    |
                                              | [==============         ]  67%     |
                                              |                                    |
                                              | Recognizing text (eng + hin)...    |
                                              |                                    |
                                              +------------------------------------+
```

**Phase 2 - OCR Complete, Review & Fill Remaining:**

```
                                              +------------------------------------+
                                              | Onboard New Customer        [X]    |
                                              +------------------------------------+
                                              |                                    |
                                              | +--------------------------------+ |
                                              | | [checkmark] PAN Card detected  | |
                                              | | Confidence: 92%                | |
                                              | | Review extracted data below.   | |
                                              | | Correct any errors before      | |
                                              | | submitting.                    | |
                                              | +--------------------------------+ |
                                              |                                    |
                                              | ---- EXTRACTED FROM ID (review) -- |
                                              |                                    |
                                              | ID Proof Type *                    |
                                              | [PAN Card                     v]   |
                                              |  ^ auto-detected                   |
                                              |                                    |
                                              | ID Proof Number *                  |
                                              | [ABCDE1234F               ]        |
                                              |  ^ extracted via OCR               |
                                              |                                    |
                                              | Full Name *                        |
                                              | [RAJESH KUMAR SHARMA      ]        |
                                              |  ^ extracted via OCR               |
                                              |                                    |
                                              | Date of Birth                      |
                                              | [15/03/1988               ]        |
                                              |  ^ extracted via OCR               |
                                              |                                    |
                                              | Father's Name                      |
                                              | [SURESH SHARMA            ]        |
                                              |  ^ extracted via OCR               |
                                              |                                    |
                                              | ---- FILL MANUALLY (required) --- |
                                              |                                    |
                                              | Phone *                            |
                                              | [+91                      ]        |
                                              |                                    |
                                              | Email                              |
                                              | [                         ]        |
                                              |                                    |
                                              | Address *                          |
                                              | [42 MG Road, Andheri West ]        |
                                              |  ^ partially from OCR (if Aadhaar) |
                                              |                                    |
                                              | City *           State *           |
                                              | [Mumbai    ]     [Maharashtra  v]  |
                                              |                                    |
                                              | Pincode *                          |
                                              | [400058   ]                        |
                                              |                                    |
                                              | ID Proof Image                     |
                                              | [pan_card_rajesh.jpg] [Preview]    |
                                              |  ^ already uploaded                |
                                              |                                    |
                                              |       [Cancel] [Create Customer]   |
                                              +------------------------------------+
```

**Phase 2 - OCR Failed / Low Confidence Fallback:**

```
                                              +------------------------------------+
                                              | Onboard New Customer        [X]    |
                                              +------------------------------------+
                                              |                                    |
                                              | +--------------------------------+ |
                                              | | [warning] Could not extract    | |
                                              | | data from image. The image     | |
                                              | | may be unclear or damaged.     | |
                                              | | Please fill the form manually. | |
                                              | |                                | |
                                              | | [Try another image]            | |
                                              | +--------------------------------+ |
                                              |                                    |
                                              | ---- ALL FIELDS (manual entry) -- |
                                              |                                    |
                                              | Full Name *                        |
                                              | [                         ]        |
                                              |                                    |
                                              | Phone *                            |
                                              | [+91                      ]        |
                                              |                                    |
                                              | Email                              |
                                              | [                         ]        |
                                              |                                    |
                                              | ... (all fields empty)             |
                                              |                                    |
                                              | ID Proof Type *                    |
                                              | [Select ID type...          v]     |
                                              |                                    |
                                              | ID Proof Number *                  |
                                              | [                         ]        |
                                              |                                    |
                                              | ID Proof Image                     |
                                              | [blurry_card.jpg] [Change]         |
                                              |                                    |
                                              |       [Cancel] [Create Customer]   |
                                              +------------------------------------+
```

**"Skip, fill manually" flow (no upload at all):**
Skips Phase 1 entirely, shows Phase 2 with all fields empty and no image. Admin fills everything by hand. ID Proof Image becomes an optional upload field at the bottom.

---

### B.8 Customer Detail Page

```
+-------------------------------------------------------------------------------------+
| [< Back to Customers]                                               [Edit] [Toggle] |
+-------------------------------------------------------------------------------------+

+-------------------------------------------+    +------------------------------------+
| PROFILE                                   |    | ID VERIFICATION                    |
|                                           |    |                                    |
| Rajesh Sharma                             |    | Type:   PAN Card                   |
| +91 98765 43210                           |    | Number: ABCDE1234F                 |
| rajesh@mail.com                           |    | Status: [Verified]                 |
|                                           |    |                                    |
| 42 MG Road, Andheri West                  |    | +----------------------------+    |
| Mumbai, Maharashtra - 400058              |    | |  [PAN Card Image Preview]  |    |
|                                           |    | |                            |    |
| Member since: 15 Mar 2024                 |    | +----------------------------+    |
+-------------------------------------------+    +------------------------------------+

+-----------+  +-----------+  +------------+  +------------+
| Total     |  | Avg       |  | Total      |  | Success    |
| Shipments |  | Delivery  |  | Spend      |  | Rate       |
|           |  | Time      |  |            |  |            |
| 342       |  | 2.1 days  |  | INR 2.8L   |  | 96.2%      |
+-----------+  +-----------+  +------------+  +------------+

+-------------------------------------------------------------------------------------+
| ACTIVE SHIPMENT                                                                     |
+-------------------------------------------------------------------------------------+
|                                                                                     |
| TPC-MUM-260608-0042          Mumbai -> Delhi          Status: [IN_TRANSIT]          |
|                                                                                     |
| [*] BOOKED ---- [*] PICKED_UP ---- [*] IN_TRANSIT ---- [ ] OUT_FOR_DLVR ---- [ ] DELIVERED |
| 09:30 AM         11:45 AM           02:15 PM                                       |
|                                                                                     |
+-------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------+
| SHIPMENT HISTORY                               [Status: All v]  [Date: Last 90d v] |
+-------------------------------------------------------------------------------------+
| Tracking #           | Date       | To             | Status      | Amount  | Time  |
+----------------------+------------+----------------+-------------+---------+-------+
| TPC-MUM-260607-0088  | 07 Jun 26  | Hyderabad      | [DELIVERED] | 1,560   | 1.8d  |
| TPC-MUM-260605-0034  | 05 Jun 26  | Chennai        | [DELIVERED] | 890     | 2.3d  |
| TPC-MUM-260601-0012  | 01 Jun 26  | Bangalore      | [RETURNED]  | 2,100   | -     |
| TPC-MUM-260528-0067  | 28 May 26  | Delhi          | [DELIVERED] | 1,250   | 1.5d  |
+----------------------+------------+----------------+-------------+---------+-------+
| Showing 1-20 of 342                                       [< Prev] [1] [2] [Next >]|
+-------------------------------------------------------------------------------------+
```

---

### B.9 Destinations Page (Serviceability Master)

```
+-------------------------------------------------------------------------------------+
| Destinations                                                                        |
| Control which locations are serviceable                                              |
+-------------------------------------------------------------------------------------+

+-----------+  +-----------+  +-----------+
| Total     |  | Serviced  |  | Disabled  |
| Locations |  |           |  |           |
| 19,042    |  | 17,856    |  | 1,186     |
+-----------+  +-----------+  +-----------+

+-------------------------------------------------------------------------------------+
| [State: All v]  [City search...]  [Pincode...]  [Serviceable: All v]  [Bulk Toggle] |
+-------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------+
| State             | City               | Pincode  | Serviceable                     |
+-------------------+--------------------+----------+---------------------------------+
| Maharashtra       | Mumbai             | 400001   | [=========ON=========]          |
| Maharashtra       | Mumbai             | 400002   | [=========ON=========]          |
| Maharashtra       | Mumbai             | 400003   | [=========ON=========]          |
| Maharashtra       | Pune               | 411001   | [=========ON=========]          |
| Maharashtra       | Pune               | 411002   | [OFF=====================]      |
| Maharashtra       | Nagpur             | 440001   | [=========ON=========]          |
| Delhi             | New Delhi          | 110001   | [=========ON=========]          |
| Delhi             | New Delhi          | 110002   | [=========ON=========]          |
| Karnataka         | Bangalore          | 560001   | [=========ON=========]          |
| Karnataka         | Bangalore          | 560002   | [OFF=====================]      |
+-------------------+--------------------+----------+---------------------------------+
| Showing 1-50 of 19,042                                    [< Prev] [1] [2] [Next >] |
+-------------------------------------------------------------------------------------+
```

**Interactions:**
- Toggle switch is inline, triggers immediate API call with optimistic update
- "Bulk Toggle" opens dialog: "Toggle all pincodes in [State dropdown] to [Serviceable/Not Serviceable]"
- State filter narrows the table to one state
- Pagination: 50 rows per page (for 19k records)

---

### B.10 Pricing Rules Page

```
+-------------------------------------------------------------------------------------+
| Pricing Rules                                                 [+ Add Pricing Rule]  |
| Configure shipment pricing by route, product, service, and transport mode           |
+-------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------+
| [Origin: All v]  [Dest: All v]  [Product: All v]  [Service: All v]  [Mode: All v]  |
+-------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------+
| Origin         | Destination    | Product    | Service  | Mode  | Unit Price | Min   | Active | Actions     |
+----------------+----------------+------------+----------+-------+------------+-------+--------+-------------+
| MH (All)       | DL (All)       | Parcel     | Express  | Air   | 50.00/kg   | 100   | [On]   | [E] [D] [X] |
| MH (All)       | DL (All)       | Parcel     | Standard | Road  | 25.00/kg   | 50    | [On]   | [E] [D] [X] |
| MH (Mumbai)    | KA (Bangalore) | Documents  | Express  | Air   | 40.00/kg   | 80    | [On]   | [E] [D] [X] |
| MH (All)       | KA (All)       | Electronics| Priority | Air   | 75.00/kg   | 200   | [On]   | [E] [D] [X] |
| DL (All)       | MH (All)       | Parcel     | Express  | Rail  | 35.00/kg   | 75    | [Off]  | [E] [D] [X] |
+----------------+----------------+------------+----------+-------+------------+-------+--------+-------------+

[E] = Edit    [D] = Duplicate    [X] = Delete
```

**Add/Edit Pricing Rule Dialog:**

```
+----------------------------------------------+
| Add Pricing Rule                      [X]    |
+----------------------------------------------+
|                                              |
| ---- ORIGIN ----                            |
| State *                  City (optional)     |
| [Maharashtra       v]   [                 ]  |
|                          Leave blank = all   |
|                                              |
| ---- DESTINATION ----                       |
| State *                  City (optional)     |
| [Delhi             v]   [                 ]  |
|                                              |
| ---- CONFIGURATION ----                    |
| Product Type *           Service Type *      |
| [Parcel            v]   [Express         v]  |
|                                              |
| Mode of Transport *                         |
| [Air                                    v]   |
|                                              |
| ---- PRICING ----                           |
| Unit Price (INR/kg) *    Minimum Charge *    |
| [50.00              ]   [100.00          ]   |
|                                              |
|              [Cancel]   [Save Rule]          |
+----------------------------------------------+
```

---

### B.11 Master Data Pages (Product Types / Service Types / Mode Types)

All three follow the same layout pattern. Shown here for Product Types:

```
+-------------------------------------------------------------------------------------+
| Product Types                                              [+ Add Product Type]     |
| Manage product categories for shipments                                             |
+-------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------+
| [Search...]                                                  [Status: All v]        |
+-------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------+
| Name           | Description                           | Status    | Actions        |
+----------------+---------------------------------------+-----------+----------------+
| Documents      | Paper documents, contracts, letters   | [Active]  | [Edit] [Del]   |
| Parcel         | General packages and parcels          | [Active]  | [Edit] [Del]   |
| Fragile        | Glass, ceramics, delicate items       | [Active]  | [Edit] [Del]   |
| Electronics    | Phones, laptops, electronic devices   | [Active]  | [Edit] [Del]   |
| Liquid         | Sealed liquid containers              | [Inactive]| [Edit] [Del]   |
| Perishable     | Food items, flowers, medicines        | [Active]  | [Edit] [Del]   |
| Heavy Goods    | Items above 50kg                      | [Active]  | [Edit] [Del]   |
| Bulk Cargo     | Large volume commercial goods         | [Active]  | [Edit] [Del]   |
+----------------+---------------------------------------+-----------+----------------+

+----- ANALYTICS (shown when row selected/expanded) -----+
|                                                         |
| +----------+ +----------+ +-----------+ +----------+   |
| | Shipments| | Revenue  | | Avg Time  | | Success  |   |
| | 3,421    | | 12.4L    | | 2.1 days  | | 94.8%    |   |
| +----------+ +----------+ +-----------+ +----------+   |
|                                                         |
| Monthly Trend:                                          |
|    ^                                                    |
|    |     /\    /\                                       |
|    |   /    \/    \   /                                 |
|    | /              \/                                  |
|    +------------------------------>                     |
|     Jan  Feb  Mar  Apr  May  Jun                        |
+---------------------------------------------------------+
```

---

### B.12 Invoice Template Builder Page

```
+-------------------------------------------------------------------------------------+
| Invoice Templates                                                                   |
+-------------------------------------------------------------------------------------+

+-- CATEGORY TABS -----------------------+
| [Standard] [Express] [Custom] [+ Add]  |
+-----------------------------------------+

+-- TEMPLATE LIST (left) --+    +-- TEMPLATE EDITOR (right) -------------------------+
|                          |    |                                                     |
| +--------------------+  |    | ---- BASIC SETTINGS ----                           |
| | Default A4         |  |    | Name:     [Default A4 Invoice    ]                  |
| | 210 x 297 mm       |  |    | Category: [Standard             v]                 |
| | [DEFAULT]          |  |    | Width:    [210] mm    Height: [297] mm              |
| +--------------------+  |    |                                                     |
|                          |    | ---- QR CODE ----                                  |
| +--------------------+  |    | Show QR: [x]    Position: [Bottom-Right v]          |
| | Compact Slip       |  |    |                                                     |
| | 100 x 150 mm       |  |    | ---- COLORS ----                                   |
| |                    |  |    | Primary:    [#1e40af]  Secondary: [#ea580c]          |
| +--------------------+  |    | Background: [#ffffff]  Text:      [#1a1a1a]          |
|                          |    | Border:     [#e5e7eb]                               |
| +--------------------+  |    |                                                     |
| | Thermal Receipt    |  |    | ---- TYPOGRAPHY ----                                |
| | 80 x 200 mm        |  |    | Heading: [Inter v] [16px]                           |
| |                    |  |    | Body:    [Inter v] [12px]                            |
| +--------------------+  |    |                                                     |
|                          |    | ---- VISIBLE FIELDS ----                           |
| [+ Create Template]     |    | [x] Tracking #    [x] Sender Name                  |
|                          |    | [x] Sender Addr   [x] Sender Phone                 |
+-- 240px ----------------+    | [x] Receiver Name  [x] Receiver Addr               |
                                | [x] Receiver Phone [x] Product Type                 |
                                | [x] Service Type   [x] Mode Type                    |
                                | [x] Weight         [x] Declared Value               |
                                | [x] Base Price     [x] GST Breakdown                |
                                | [x] Total Amount   [x] Booked Date                  |
                                | [ ] Expected Dlvr                                    |
                                |                                                     |
                                | ---- HEADER CONFIG ----                             |
                                | Company Name: [TPC India Couriers     ]              |
                                | Address:      [Mumbai, Maharashtra    ]              |
                                | Logo URL:     [https://...            ]              |
                                |                                                     |
                                | ---- FOOTER CONFIG ----                             |
                                | Terms: [Subject to terms & conditions ]              |
                                |                                                     |
                                | [Set as Default]  [Save Template]                   |
                                +-----------------------------------------------------+

+-- LIVE PREVIEW (below or toggle) -----------------------------------------------+
|                                                                                  |
|  +--------------------------------------------------------------------------+   |
|  | TPC India Couriers                                         +--------+    |   |
|  | Mumbai, Maharashtra                                        |        |    |   |
|  |                                                            |  QR    |    |   |
|  | INVOICE                                                    |  CODE  |    |   |
|  | Tracking: TPC-MUM-260608-0042                              +--------+    |   |
|  |                                                                          |   |
|  | From: Rajesh Sharma              To: Priya Patel                         |   |
|  |       Mumbai, MH 400058               New Delhi, DL 110001              |   |
|  |       +91 98765 43210                  +91 87654 32109                   |   |
|  |                                                                          |   |
|  | Product: Parcel    Service: Express    Mode: Air    Weight: 2.5 kg      |   |
|  |                                                                          |   |
|  | Base Price:        INR 125.00                                            |   |
|  | IGST (18%):        INR  22.50                                            |   |
|  | -------------------------------------------                              |   |
|  | Total:             INR 147.50                                            |   |
|  |                                                                          |   |
|  | Date: 08 Jun 2026                                                        |   |
|  | Subject to terms & conditions                                            |   |
|  +--------------------------------------------------------------------------+   |
|                                                                                  |
+----------------------------------------------------------------------------------+
```

---

### B.13 Notification Settings Page

```
+-------------------------------------------------------------------------------------+
| Notification Settings                                                               |
| Configure how customers receive shipment updates                                    |
+-------------------------------------------------------------------------------------+

+-------------------------------+  +-------------------------------+  +-------------------------------+
| EMAIL                    [On] |  | SMS                     [On] |  | WHATSAPP              [Off] |
+-------------------------------+  +-------------------------------+  +-------------------------------+
|                               |  |                               |  |                               |
| Provider:                     |  | Provider:                     |  | Provider:                     |
| [Resend                   v]  |  | [MSG91                    v]  |  | [Select provider...       v]  |
|                               |  |                               |  |                               |
| API Key:                      |  | Auth Key:                     |  | API Key:                      |
| [*********************    ]   |  | [*********************    ]   |  | [                         ]   |
|                               |  |                               |  |                               |
| From Address:                 |  | Sender ID:                    |  | (Enable channel to          |
| [noreply@tpcindia.com    ]   |  | [TPCIND              ]        |  |  configure provider)         |
|                               |  |                               |  |                               |
|                               |  | DLT Template ID:              |  |                               |
|                               |  | [1107161234567     ]          |  |                               |
|                               |  |                               |  |                               |
| [Test]            [Save]      |  | [Test]            [Save]      |  |               [Save]          |
+-------------------------------+  +-------------------------------+  +-------------------------------+

+-------------------------------------------------------------------------------------+
| Notification Log                                   [Channel: All v] [Status: All v] |
+-------------------------------------------------------------------------------------+
| Timestamp          | Channel | Provider | Recipient       | Event          | Status |
+--------------------+---------+----------+-----------------+----------------+--------+
| 08 Jun, 02:15 PM   | SMS     | MSG91    | +91 87654 32109 | STATUS_UPDATE  | [SENT] |
| 08 Jun, 11:45 AM   | Email   | Resend   | rajesh@mail.com | SHIPMENT_BOOKED| [SENT] |
| 08 Jun, 11:45 AM   | SMS     | MSG91    | +91 98765 43210 | SHIPMENT_BOOKED| [SENT] |
| 08 Jun, 09:30 AM   | Email   | Resend   | priya@mail.com  | DELIVERED      | [FAIL] |
+--------------------+---------+----------+-----------------+----------------+--------+
```

---

### B.14 Landing Page (Public)

```
+====================================================================================+
|  [TPC Logo] TPC India                            [Track] [Services] [Login]         |
+====================================================================================+

+------------------------------------------------------------------------------------+
|                                                                                    |
|                    Reliable Courier Solutions                                       |
|                       Across India                                                 |
|                                                                                    |
|           Delivering trust for over 30 years with pan-India coverage               |
|           across 500+ cities via Air, Rail, and Road networks.                     |
|                                                                                    |
|               [Track Shipment]        [Login to Dashboard]                         |
|                                                                                    |
+------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------+
| Our Services                                                                       |
|                                                                                    |
| +----------------+  +----------------+  +----------------+  +----------------+     |
| |   [Zap icon]   |  | [Clock icon]   |  | [Truck icon]   |  | [Globe icon]   |     |
| |                |  |                |  |                |  |                |     |
| |   Express      |  |   Same Day     |  |   Standard     |  |   Priority     |     |
| |   Delivery     |  |   Delivery     |  |   Delivery     |  |   Delivery     |     |
| |                |  |                |  |                |  |                |     |
| | Fast & secure  |  | Within hours   |  | Cost-effective |  | High-value     |     |
| | delivery for   |  | for urgent     |  | shipping for   |  | items with     |     |
| | time-critical  |  | local          |  | regular        |  | extra care     |     |
| | packages       |  | packages       |  | shipments      |  | & tracking     |     |
| +----------------+  +----------------+  +----------------+  +----------------+     |
+------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------+
| How It Works                                                                       |
|                                                                                    |
|     +--------+            +--------+            +--------+                         |
|     |   1    |            |   2    |            |   3    |                         |
|     | [Book] |  ------->  | [Ship] |  ------->  |[Deliver]|                        |
|     +--------+            +--------+            +--------+                         |
|                                                                                    |
|     Book Your              We Pick Up            Delivered                          |
|     Shipment               & Transport           to Doorstep                       |
|                                                                                    |
|     Create a shipment      We handle the         Safe & timely                     |
|     in minutes with        logistics via         delivery with                     |
|     our simple form        Air, Rail, Road       real-time updates                 |
+------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------+
|                                                                                    |
|   +----------+     +----------+     +----------+     +----------+                  |
|   |  500+    |     |   28     |     |   30+    |     |   1M+    |                  |
|   |  Cities  |     |  States  |     |  Years   |     | Deliveries|                 |
|   +----------+     +----------+     +----------+     +----------+                  |
|                                                                                    |
+------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------+
|                                                                                    |
|                    Track Your Shipment                                              |
|                                                                                    |
|          +---------------------------------------------+  +-------+               |
|          | Enter tracking number (e.g. TPC-MUM-...)    |  | Track |               |
|          +---------------------------------------------+  +-------+               |
|                                                                                    |
+------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------+
| TPC India Couriers                   Quick Links           Contact                 |
| Mumbai, Maharashtra                 Track Shipment         +91 22 2634 5678       |
| Est. 1994                           Our Services           info@tpcindia.com       |
|                                     Login                  Mumbai, Maharashtra     |
+------------------------------------------------------------------------------------+
```

---

### B.15 Public Tracking Page (QR Scan Target)

```
+====================================================================================+
| [TPC Logo]  TPC India Couriers                                                     |
+====================================================================================+

+------------------------------------------------------------------------------------+
|                                                                                    |
|   +------- SHIPMENT DETAILS --------------------------------------------------+   |
|   |                                                                            |   |
|   |  Tracking Number                                                          |   |
|   |  TPC-MUM-260608-0042                                                      |   |
|   |                                                                            |   |
|   |  Status: [====== IN TRANSIT ======]                                       |   |
|   |                                                                            |   |
|   |  From                              To                                     |   |
|   |  Mumbai, Maharashtra               New Delhi, Delhi                       |   |
|   |  400058                             110001                                |   |
|   |                                                                            |   |
|   |  Product: Parcel     Service: Express     Mode: Air     Weight: 2.5 kg    |   |
|   |  Booked: 08 Jun 2026, 09:30 AM                                           |   |
|   |                                                                            |   |
|   +----------------------------------------------------------------------------+   |
|                                                                                    |
|   +------- TRACKING TIMELINE -------------------------------------------------+   |
|   |                                                                            |   |
|   |  [*]  BOOKED                                                              |   |
|   |   |   Mumbai Head Office                                                  |   |
|   |   |   08 Jun 2026, 09:30 AM                                              |   |
|   |   |                                                                       |   |
|   |  [*]  PICKED UP                                                          |   |
|   |   |   Mumbai Head Office                                                  |   |
|   |   |   08 Jun 2026, 11:45 AM                                              |   |
|   |   |   Collected from sender                                               |   |
|   |   |                                                                       |   |
|   |  [*]  IN TRANSIT                           <--- Current                   |   |
|   |   |   Mumbai Airport Hub                                                  |   |
|   |   |   08 Jun 2026, 02:15 PM                                              |   |
|   |   |   Dispatched via Air freight                                          |   |
|   |   |                                                                       |   |
|   |  [ ]  OUT FOR DELIVERY                     --- Upcoming (grayed) ---      |   |
|   |   |                                                                       |   |
|   |  [ ]  DELIVERED                            --- Upcoming (grayed) ---      |   |
|   |                                                                            |   |
|   +----------------------------------------------------------------------------+   |
|                                                                                    |
|   +------- TRACK ANOTHER -----------------------------------------------------+   |
|   |                                                                            |   |
|   |  +-------------------------------------------+  +---------+               |   |
|   |  | Enter another tracking number...          |  |  Track  |               |   |
|   |  +-------------------------------------------+  +---------+               |   |
|   |                                                                            |   |
|   +----------------------------------------------------------------------------+   |
|                                                                                    |
+------------------------------------------------------------------------------------+
```

**Mobile-optimized**: This page renders well on small screens (single-column, timeline takes full width). The status badge and timeline are the hero elements.

---

### B.16 Customer Portal - Login Page

```
+====================================================================================+
| [TPC Logo]  TPC India                                 [Track]  [Login]              |
+====================================================================================+

+------------------------------------------------------------------------------------+
|                                                                                    |
|                         +------------------------------+                           |
|                         |                              |                           |
|                         |     Customer Login            |                           |
|                         |                              |                           |
|                         |     Enter your registered     |                           |
|                         |     phone number to login     |                           |
|                         |                              |                           |
|                         |     Phone Number              |                           |
|                         |     +--------------------+   |                           |
|                         |     | +91 98765 43210    |   |                           |
|                         |     +--------------------+   |                           |
|                         |                              |                           |
|                         |     [   Send OTP          ]   |                           |
|                         |                              |                           |
|                         +------------------------------+                           |
|                                                                                    |
+------------------------------------------------------------------------------------+

                              After OTP sent:

+------------------------------------------------------------------------------------+
|                                                                                    |
|                         +------------------------------+                           |
|                         |                              |                           |
|                         |     Verify OTP                |                           |
|                         |                              |                           |
|                         |     Enter the 6-digit code    |                           |
|                         |     sent to +91 98765 43210   |                           |
|                         |                              |                           |
|                         |     +--+--+--+--+--+--+      |                           |
|                         |     | 4| 8| 2| 9| 1| 7|      |                           |
|                         |     +--+--+--+--+--+--+      |                           |
|                         |                              |                           |
|                         |     [   Verify & Login    ]   |                           |
|                         |                              |                           |
|                         |     Didn't receive?           |                           |
|                         |     [Resend OTP] (in 28s)     |                           |
|                         |                              |                           |
|                         +------------------------------+                           |
|                                                                                    |
+------------------------------------------------------------------------------------+
```

---

### B.17 Customer Portal - My Shipments

```
+====================================================================================+
| [TPC Logo]  TPC India          Track Shipment  |  My Shipments  |  Profile  [Logout]|
+====================================================================================+

+------------------------------------------------------------------------------------+
| My Shipments                                                                       |
+------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------+
| [Status: All v]  [Date: Last 30 days v]                                            |
+------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------+
| Tracking #           | Date       | Route          | Status       | Amount         |
+----------------------+------------+----------------+--------------+----------------+
| TPC-MUM-260608-0042  | 08 Jun 26  | Mumbai -> Delhi| [IN_TRANSIT] | INR 147.50     |
|                                                                                    |
|   [*] BOOKED -- [*] PICKED_UP -- [*] IN_TRANSIT -- [ ] OUT_FOR -- [ ] DELIVERED   |
|   09:30 AM       11:45 AM         02:15 PM                                        |
+------------------------------------------------------------------------------------+
| TPC-MUM-260607-0088  | 07 Jun 26  | Mumbai -> Hyd  | [DELIVERED]  | INR 1,560.00   |
+------------------------------------------------------------------------------------+
| TPC-MUM-260605-0034  | 05 Jun 26  | Mumbai -> Chen | [DELIVERED]  | INR 890.00     |
+------------------------------------------------------------------------------------+
| TPC-MUM-260601-0012  | 01 Jun 26  | Mumbai -> Blr  | [RETURNED]   | INR 2,100.00   |
+------------------------------------------------------------------------------------+
| Showing 1-20 of 342                                       [< Prev] [1] [2] [Next >]|
+------------------------------------------------------------------------------------+
```

**Interaction**: Clicking a row expands it inline to show the tracking timeline (as shown for the first row). No page navigation needed.

---

### B.18 Customer Portal - Profile Page

```
+====================================================================================+
| [TPC Logo]  TPC India          Track Shipment  |  My Shipments  |  Profile  [Logout]|
+====================================================================================+

+------------------------------------------------------------------------------------+
| My Profile                                                            [Edit]       |
+------------------------------------------------------------------------------------+

+-------------------------------------------+    +------------------------------------+
| PERSONAL INFORMATION                      |    | ACCOUNT STATS                      |
|                                           |    |                                    |
| Name                                      |    | Member Since    15 Mar 2024        |
| Rajesh Sharma                             |    | Total Shipments 342                |
|                                           |    | Active          1                  |
| Phone                                     |    |                                    |
| +91 98765 43210         [Verified]        |    +------------------------------------+
|                                           |
| Email                                     |    +------------------------------------+
| rajesh@mail.com                           |    | ID VERIFICATION                    |
|                                           |    |                                    |
| Address                                   |    | PAN Card                           |
| 42 MG Road, Andheri West                  |    | ABCDE1234F                         |
| Mumbai, Maharashtra - 400058              |    | [Verified]                         |
|                                           |    +------------------------------------+
+-------------------------------------------+
```

**Edit mode**: Clicking [Edit] makes Email and Address fields editable. Phone and ID Proof are read-only (cannot be changed by customer).

---

## C. Responsive Behavior Summary

| Breakpoint | Sidebar | Content Grid | Tables | Cards |
|-----------|---------|-------------|--------|-------|
| Desktop (1280px+) | Expanded (260px) | Up to 4 columns | Full columns visible | 4 per row |
| Tablet (768-1279px) | Collapsed (icons only) | 2 columns | Horizontal scroll for wide tables | 2 per row |
| Mobile (<768px) | Hidden (hamburger toggle) | 1 column | Card view replaces table rows | 1 per row (stacked) |

**Key responsive patterns:**
- Stat cards: 4-col -> 2-col -> 1-col stacking
- Data tables: On mobile, each row becomes a card with label-value pairs
- Shipment creation: Two-column -> single column (billing panel moves below form)
- Charts: Full width on mobile, 2-col grid on desktop
- Sidebar: Full overlay on mobile with backdrop
- Invoice builder: Editor and preview stack vertically on mobile

---

## D. Color Token Usage Across UI

| Element | Light Mode | Dark Mode | CSS Variable |
|---------|-----------|----------|-------------|
| Sidebar background | White | Dark gray | `--sidebar` |
| Sidebar active item | Deep Blue bg | Blue bg | `--sidebar-primary` |
| Page background | Light gray (#fafafa) | Near black | `--background` |
| Card background | White | Dark gray | `--card` |
| Primary buttons | Deep Blue | Lighter Blue | `--primary` |
| Accent/CTA buttons | Warm Orange | Orange | `--accent` (custom) |
| Status: Booked | Blue outline | Blue outline | `--chart-1` |
| Status: In Transit | Amber fill | Amber fill | `--chart-4` |
| Status: Delivered | Green fill | Green fill | `--chart-2` |
| Status: Returned | Red fill | Red fill | `--destructive` |
| Table borders | Light gray | Dark border | `--border` |
| Muted text | Medium gray | Light gray | `--muted-foreground` |

No purple anywhere. Primary = Blue, Accent = Orange, Status colors = semantic (green/amber/red).
