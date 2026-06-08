# Phase 2: Master Data Modules

## Status: COMPLETE

## Note on Authentication
All routes in this phase were implemented using `publicProcedure` (no auth). When Phase Auth is implemented, these routes will be migrated to `adminProcedure` so only authenticated admin users can access them. This is a one-line change per route file (import `adminProcedure` instead of `publicProcedure`).

## Goal
Implement full CRUD stack for the four master data entities: Product Types, Service Types, Mode Types, and Branches. Each follows the pattern: Zod models -> Service class -> tRPC route -> Frontend UI page. Also create a seed script for default master data.

---

## Step 2.1 - Product Types (Service + Route)
**Status: PENDING**

### 2.1.1 Zod Models - `packages/services/product-type/model.ts` - PENDING

```typescript
// Input schemas
createProductTypeInputSchema: { name: z.string().min(1).max(50), description: z.string().max(500).optional() }
updateProductTypeInputSchema: { id: z.string().uuid(), name: z.string().min(1).max(50).optional(), description: z.string().max(500).optional(), isActive: z.boolean().optional() }
listProductTypesInputSchema: { search: z.string().optional(), isActive: z.boolean().optional(), page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(100).default(20) }
getByIdInputSchema: { id: z.string().uuid() }
deleteInputSchema: { id: z.string().uuid() }

// Output schemas
productTypeOutputSchema: { id, name, description, isActive, createdAt, updatedAt }
listProductTypesOutputSchema: { data: productTypeOutputSchema[], total: number, page: number, limit: number }
```

### 2.1.2 Service Class - `packages/services/product-type/index.ts` - PENDING

Class: `ProductTypeService`

Methods:
- `list(input: ListProductTypesInput)` -> ListProductTypesOutput
  - Query `productTypesTable` with:
    - `ilike` search on `name` column if `search` provided
    - Equality filter on `isActive` if provided
    - Count total matching records
    - Apply `limit` and `offset` (derived from page)
    - Order by `createdAt` desc
  - Return `{ data, total, page, limit }`

- `getById(id: string)` -> ProductTypeOutput
  - Query by id, throw TRPCError NOT_FOUND if missing

- `create(input: CreateProductTypeInput)` -> ProductTypeOutput
  - Check name uniqueness (ilike match to prevent "Express" vs "express" collision)
  - Insert into `productTypesTable`
  - Return created record

- `update(input: UpdateProductTypeInput)` -> ProductTypeOutput
  - Check record exists (throw NOT_FOUND)
  - If name is being changed, check uniqueness again
  - Update record
  - Return updated record

- `delete(id: string)` -> { success: boolean }
  - Check record exists
  - Check if referenced by `pricingRulesTable` or `shipmentsTable` (count where productTypeId = id)
  - If referenced: throw CONFLICT error "Cannot delete: product type is in use by X pricing rules and Y shipments"
  - Otherwise: delete record

### 2.1.3 tRPC Route - `packages/trpc/server/routes/product-type/route.ts` - PENDING

```typescript
const TAGS = ["Product Types"];
const getPath = generatePath("/product-types");

productTypeRouter = router({
  list: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/"), tags: TAGS } })
    .input(listProductTypesInputSchema)
    .output(listProductTypesOutputSchema)
    .query(({ input }) => productTypeService.list(input)),

  getById: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/:id"), tags: TAGS } })
    .input(getByIdInputSchema)
    .output(productTypeOutputSchema)
    .query(({ input }) => productTypeService.getById(input.id)),

  create: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createProductTypeInputSchema)
    .output(productTypeOutputSchema)
    .mutation(({ input }) => productTypeService.create(input)),

  update: publicProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/:id"), tags: TAGS } })
    .input(updateProductTypeInputSchema)
    .output(productTypeOutputSchema)
    .mutation(({ input }) => productTypeService.update(input)),

  delete: publicProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/:id"), tags: TAGS } })
    .input(deleteInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(({ input }) => productTypeService.delete(input.id)),
});
```

---

## Step 2.2 - Service Types (Service + Route)
**Status: PENDING**

Identical pattern to Product Types. Same file structure, same CRUD operations.

### Files:
- `packages/services/service-type/model.ts` - PENDING
- `packages/services/service-type/index.ts` - PENDING
- `packages/trpc/server/routes/service-type/route.ts` - PENDING

### Differences from Product Types:
- Table: `serviceTypesTable` (from `@repo/database/schema`)
- Service class: `ServiceTypeService`
- Router: `serviceTypeRouter`
- Delete protection: check `pricingRulesTable.serviceTypeId` and `shipmentsTable.serviceTypeId`
- TAGS: `["Service Types"]`
- Path base: `/service-types`

---

## Step 2.3 - Mode Types (Service + Route)
**Status: PENDING**

Identical pattern to Product Types. Same file structure, same CRUD operations.

### Files:
- `packages/services/mode-type/model.ts` - PENDING
- `packages/services/mode-type/index.ts` - PENDING
- `packages/trpc/server/routes/mode-type/route.ts` - PENDING

### Differences from Product Types:
- Table: `modeTypesTable` (from `@repo/database/schema`)
- Service class: `ModeTypeService`
- Router: `modeTypeRouter`
- Delete protection: check `pricingRulesTable.modeTypeId` and `shipmentsTable.modeTypeId`
- TAGS: `["Mode Types"]`
- Path base: `/mode-types`

---

## Step 2.4 - Branches (Service + Route)
**Status: PENDING**

### 2.4.1 Zod Models - `packages/services/branch/model.ts` - PENDING

```typescript
// Enums
branchTypeEnum: z.enum(["Head Office", "Regional Office", "Franchise", "Collection Center", "Hub"])

// Input schemas
createBranchInputSchema: {
  code: z.string().min(1).max(20).transform(v => v.toUpperCase()),
  name: z.string().min(1).max(100),
  type: branchTypeEnum,
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  address: z.string().max(500).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
  latitude: z.string().max(20).optional(),
  longitude: z.string().max(20).optional(),
  contactPhone: z.string().max(15).optional(),
  contactEmail: z.string().email().max(255).optional(),
}

updateBranchInputSchema: {
  id: z.string().uuid(),
  ...partial of all create fields,
  isActive: z.boolean().optional(),
}

listBranchesInputSchema: {
  search: z.string().optional(),       // searches name, code, city
  type: branchTypeEnum.optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}

// Output schemas
branchOutputSchema: { id, code, name, type, city, state, address, pincode, latitude, longitude, contactPhone, contactEmail, isActive, createdAt, updatedAt }
listBranchesOutputSchema: { data: branchOutputSchema[], total, page, limit }
```

### 2.4.2 Service Class - `packages/services/branch/index.ts` - PENDING

Class: `BranchService`

Methods:
- `list(input)` -> ListBranchesOutput
  - Search filter: `ilike` on name OR code OR city
  - Type filter: equality on `type`
  - Active filter: equality on `isActive`
  - Paginate + count
  - Order by `createdAt` desc

- `getById(id)` -> BranchOutput
  - Throw NOT_FOUND if missing

- `create(input)` -> BranchOutput
  - Validate `code` uniqueness (case-insensitive)
  - Insert and return

- `update(input)` -> BranchOutput
  - Check exists
  - If code changing, validate uniqueness
  - Update and return

- `delete(id)` -> { success: boolean }
  - Check if referenced by `shipmentsTable.branchId`
  - If referenced: throw CONFLICT "Cannot delete: branch has X shipments"
  - Otherwise: delete

### 2.4.3 tRPC Route - `packages/trpc/server/routes/branch/route.ts` - PENDING

```typescript
const TAGS = ["Branches"];
const getPath = generatePath("/branches");

branchRouter = router({
  list:     GET    /branches
  getById:  GET    /branches/:id
  create:   POST   /branches
  update:   PUT    /branches/:id
  delete:   DELETE /branches/:id
});
```

---

## Step 2.5 - Register Services & Routes
**Status: PENDING**

### 2.5.1 Update `packages/trpc/server/services/index.ts` - PENDING

Add instantiations:
```typescript
import ProductTypeService from "@repo/services/product-type";
import ServiceTypeService from "@repo/services/service-type";
import ModeTypeService from "@repo/services/mode-type";
import BranchService from "@repo/services/branch";

export const productTypeService = new ProductTypeService();
export const serviceTypeService = new ServiceTypeService();
export const modeTypeService = new ModeTypeService();
export const branchService = new BranchService();
```

### 2.5.2 Update `packages/trpc/server/index.ts` - PENDING

Add routers:
```typescript
import { productTypeRouter } from "./routes/product-type/route";
import { serviceTypeRouter } from "./routes/service-type/route";
import { modeTypeRouter } from "./routes/mode-type/route";
import { branchRouter } from "./routes/branch/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  productTypes: productTypeRouter,
  serviceTypes: serviceTypeRouter,
  modeTypes: modeTypeRouter,
  branches: branchRouter,
});
```

---

## Step 2.6 - Product Types Frontend UI
**Status: PENDING**

### File: `apps/web/app/(admin)/product-types/page.tsx` - PENDING

Page structure:
- `PageHeader` title="Product Types" with "Add Product Type" button
- Search input + Active/Inactive filter dropdown
- `DataTable` with columns:
  | Name | Description | Status | Actions |
  - Name: text
  - Description: text (truncated)
  - Status: Badge (green "Active" / gray "Inactive")
  - Actions: Edit button, Delete button
- Pagination via DataTable props

### File: `apps/web/app/(admin)/product-types/_components/product-type-form.tsx` - PENDING

Reusable form component (used for both Create and Edit):
- Sheet/Dialog wrapper
- Fields:
  - Name (Input, required)
  - Description (Textarea, optional)
  - Active toggle (only in edit mode)
- Uses `react-hook-form` + Zod resolver
- Submit calls tRPC `create` or `update` mutation
- On success: close dialog, invalidate list query, show toast

### File: `apps/web/app/(admin)/product-types/_components/columns.tsx` - PENDING

TanStack Table column definitions for the product types table.

### Hooks & Data Fetching:
- `trpc.productTypes.list.useQuery({ search, isActive, page, limit })`
- `trpc.productTypes.create.useMutation()` with `onSuccess` -> invalidate list
- `trpc.productTypes.update.useMutation()` with `onSuccess` -> invalidate list
- `trpc.productTypes.delete.useMutation()` with `onSuccess` -> invalidate list
- Delete button opens `ConfirmDialog` component

---

## Step 2.7 - Service Types Frontend UI
**Status: PENDING**

### Files:
- `apps/web/app/(admin)/service-types/page.tsx` - PENDING
- `apps/web/app/(admin)/service-types/_components/service-type-form.tsx` - PENDING
- `apps/web/app/(admin)/service-types/_components/columns.tsx` - PENDING

Same layout and pattern as Product Types. Different title, different tRPC namespace (`trpc.serviceTypes.*`).

---

## Step 2.8 - Mode Types Frontend UI
**Status: PENDING**

### Files:
- `apps/web/app/(admin)/mode-types/page.tsx` - PENDING
- `apps/web/app/(admin)/mode-types/_components/mode-type-form.tsx` - PENDING
- `apps/web/app/(admin)/mode-types/_components/columns.tsx` - PENDING

Same layout and pattern as Product Types. Different title, different tRPC namespace (`trpc.modeTypes.*`).

---

## Step 2.9 - Branches Frontend UI
**Status: PENDING**

### File: `apps/web/app/(admin)/branches/page.tsx` - PENDING

Page structure:
- `PageHeader` title="Branches" with "Add Branch" button
- Filter bar:
  - Search input (searches name, code, city)
  - Type dropdown: All / Head Office / Regional Office / Franchise / Collection Center / Hub
  - Status dropdown: All / Active / Inactive
- `DataTable` with columns:
  | Code | Name | Type | City | State | Status | Actions |
  - Code: monospace text
  - Name: text
  - Type: Badge with variant colors per type
  - City: text
  - State: text
  - Status: Switch toggle (inline update)
  - Actions: Edit, Delete

### File: `apps/web/app/(admin)/branches/_components/branch-form.tsx` - PENDING

Sheet (side panel) form:
- Code (Input, uppercase, required)
- Name (Input, required)
- Type (Select dropdown, required)
- City (Input, required)
- State (Input, required)
- Address (Textarea, optional)
- Pincode (Input, 6-digit validation, optional)
- Contact Phone (Input, optional)
- Contact Email (Input, email validation, optional)
- Latitude (Input, optional)
- Longitude (Input, optional)
- Active toggle (only in edit mode)

Uses `Sheet` component from shadcn/ui for the side panel behavior.

### File: `apps/web/app/(admin)/branches/_components/columns.tsx` - PENDING

Column definitions with:
- Inline status toggle that calls `trpc.branches.update.useMutation()`
- Type displayed as colored badge

### Hooks & Data Fetching:
- `trpc.branches.list.useQuery({ search, type, isActive, page, limit })`
- `trpc.branches.create.useMutation()`
- `trpc.branches.update.useMutation()`
- `trpc.branches.delete.useMutation()`

---

## Step 2.10 - Seed Data Script
**Status: PENDING**

### File: `packages/database/seed/masters.ts` - PENDING

```typescript
// Idempotent: only inserts if table is empty (count == 0)

// Product Types to seed:
const productTypes = [
  { name: "Documents", description: "Important documents and papers" },
  { name: "Parcel", description: "General parcels and packages" },
  { name: "Fragile", description: "Fragile items requiring careful handling" },
  { name: "Electronics", description: "Electronic items and gadgets" },
  { name: "Liquid", description: "Liquid goods in sealed containers" },
  { name: "Perishable", description: "Time-sensitive perishable goods" },
  { name: "Heavy Goods", description: "Items exceeding 50kg weight" },
  { name: "Bulk Cargo", description: "Large volume bulk shipments" },
];

// Service Types to seed:
const serviceTypes = [
  { name: "Standard", description: "Regular delivery within 5-7 business days" },
  { name: "Express", description: "Fast delivery within 2-3 business days" },
  { name: "Same-Day", description: "Delivery on the same day of booking" },
  { name: "Next-Day", description: "Guaranteed next business day delivery" },
  { name: "Economy", description: "Budget-friendly option with 7-10 day delivery" },
  { name: "Priority", description: "High priority delivery within 24 hours" },
];

// Mode Types to seed:
const modeTypes = [
  { name: "Air", description: "Air freight transportation" },
  { name: "Rail", description: "Rail cargo transportation" },
  { name: "Road", description: "Surface road transportation" },
  { name: "Multimodal", description: "Combination of multiple transport modes" },
];
```

### Update `packages/database/package.json` - PENDING

Add script:
```json
"db:seed": "dotenv -- tsx seed/masters.ts"
```

---

## Step 2.11 - Build Verification
**Status: PENDING**

- Run `pnpm turbo build` to verify full compilation
- Test API: start dev server, call `GET /api/product-types` (should return empty list)
- Test UI: navigate to `/product-types`, verify page loads with empty state
- Test seed: run `pnpm db:seed`, verify data appears in API responses
- Test CRUD: create, edit, delete a product type via UI
- Test delete protection: try deleting a type referenced by a pricing rule (should fail)

---

## Deliverables Checklist

| # | Item | Status |
|---|------|--------|
| 1 | `services/product-type/model.ts` | DONE |
| 2 | `services/product-type/index.ts` | DONE |
| 3 | `trpc/server/routes/product-type/route.ts` | DONE |
| 4 | `services/service-type/model.ts` | DONE |
| 5 | `services/service-type/index.ts` | DONE |
| 6 | `trpc/server/routes/service-type/route.ts` | DONE |
| 7 | `services/mode-type/model.ts` | DONE |
| 8 | `services/mode-type/index.ts` | DONE |
| 9 | `trpc/server/routes/mode-type/route.ts` | DONE |
| 10 | `services/branch/model.ts` | DONE |
| 11 | `services/branch/index.ts` | DONE |
| 12 | `trpc/server/routes/branch/route.ts` | DONE |
| 13 | `trpc/server/services/index.ts` updated (4 services) | DONE |
| 14 | `trpc/server/index.ts` updated (4 routers) | DONE |
| 15 | Product Types UI page + form + columns | DONE |
| 16 | Service Types UI page + form + columns | DONE |
| 17 | Mode Types UI page + form + columns | DONE |
| 18 | Branches UI page + form + columns | DONE |
| 19 | `database/seed/masters.ts` seed script | DONE |
| 20 | `package.json` db:seed script added | DONE |
| 21 | Full build passes (`pnpm turbo build`) | DONE |
| 22 | Delete protection working (all 4 entities) | DONE |
