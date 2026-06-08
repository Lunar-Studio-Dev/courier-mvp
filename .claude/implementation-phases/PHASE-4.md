# Phase 4: Pricing Rules & Shipment Booking

## Status: COMPLETE

## Prerequisites
- **Phase Auth must be completed first.** This phase uses `adminProcedure` for all admin routes and `publicProcedure` for the public tracking endpoint.

## Goal
Implement the pricing rules engine and the full shipment booking flow. Pricing rules define cost per weight unit based on origin/destination/product/service/mode combinations. Shipment booking ties together customers, branches, pricing, and generates tracking numbers with GST calculation.

---

## Step 4.1 - Pricing Rules (Service + Route)
**Status: PENDING**

### 4.1.1 Zod Models - `packages/services/pricing-rule/model.ts` - PENDING

```typescript
// Input schemas
createPricingRuleInputSchema: {
  originState: z.string().min(1).max(100),
  originCity: z.string().max(100).optional(),       // optional = state-level rule
  destinationState: z.string().min(1).max(100),
  destinationCity: z.string().max(100).optional(),   // optional = state-level rule
  productTypeId: z.string().uuid(),
  serviceTypeId: z.string().uuid(),
  modeTypeId: z.string().uuid(),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),  // price per kg
  minimumCharge: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
}

updatePricingRuleInputSchema: {
  id: z.string().uuid(),
  ...partial of create fields,
  isActive: z.boolean().optional(),
}

listPricingRulesInputSchema: {
  originState: z.string().optional(),
  destinationState: z.string().optional(),
  productTypeId: z.string().uuid().optional(),
  serviceTypeId: z.string().uuid().optional(),
  modeTypeId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}

// Calculate price endpoint
calculatePriceInputSchema: {
  originState: z.string().min(1),
  originCity: z.string().optional(),
  destinationState: z.string().min(1),
  destinationCity: z.string().optional(),
  productTypeId: z.string().uuid(),
  serviceTypeId: z.string().uuid(),
  modeTypeId: z.string().uuid(),
  weight: z.string().regex(/^\d+(\.\d{1,3})?$/),   // up to 3 decimal places
}

// Output schemas
pricingRuleOutputSchema: {
  id, originState, originCity, destinationState, destinationCity,
  productTypeId, serviceTypeId, modeTypeId,
  unitPrice, minimumCharge, isActive,
  // Joined names for display
  productTypeName, serviceTypeName, modeTypeName,
  createdAt, updatedAt
}

listPricingRulesOutputSchema: { data[], total, page, limit }

calculatePriceOutputSchema: {
  ruleId: z.string(),
  unitPrice: z.string(),
  weight: z.string(),
  basePrice: z.string(),        // max(unitPrice * weight, minimumCharge)
  minimumCharge: z.string(),
}
```

### 4.1.2 Service Class - `packages/services/pricing-rule/index.ts` - PENDING

Class: `PricingRuleService`

Methods:
- `list(input)` -> ListPricingRulesOutput
  - Filter by: originState, destinationState, productTypeId, serviceTypeId, modeTypeId, isActive
  - Join with product_types, service_types, mode_types for display names
  - Paginate + count
  - Order by originState, destinationState

- `getById(id)` -> PricingRuleOutput
  - With joined names

- `create(input)` -> PricingRuleOutput
  - Check for duplicate rule (same origin/destination/product/service/mode combo)
  - Insert and return with joined names

- `update(input)` -> PricingRuleOutput
  - Check exists, check uniqueness if changing key fields
  - Update and return

- `delete(id)` -> { success: boolean }
  - Check if referenced by shipments
  - Hard delete if not referenced

- `calculatePrice(input)` -> CalculatePriceOutput
  - Rule matching priority (most specific first):
    1. Exact city-to-city match
    2. City-to-state match (origin city, destination state)
    3. State-to-city match (origin state, destination city)
    4. State-to-state match
  - Calculate: basePrice = max(unitPrice * weight, minimumCharge)
  - Throw NOT_FOUND if no matching rule

### 4.1.3 tRPC Route - `packages/trpc/server/routes/pricing-rule/route.ts` - PENDING

All pricing rule routes use `adminProcedure` (admin-only access):

```typescript
import { adminProcedure, router } from "../../trpc";

const TAGS = ["Pricing Rules"];
const getPath = generatePath("/pricing-rules");

pricingRuleRouter = router({
  list:           adminProcedure  GET    /pricing-rules
  getById:        adminProcedure  GET    /pricing-rules/:id
  create:         adminProcedure  POST   /pricing-rules
  update:         adminProcedure  PUT    /pricing-rules/:id
  delete:         adminProcedure  DELETE /pricing-rules/:id
  calculatePrice: adminProcedure  POST   /pricing-rules/calculate
});
```

---

## Step 4.2 - Pricing Rules Frontend UI
**Status: PENDING**

### File: `apps/web/app/(admin)/pricing/page.tsx` - PENDING

Page layout:
- `PageHeader` title="Pricing Rules" with "Add Rule" button
- Filter bar:
  - Origin State dropdown (from destinations.getStates)
  - Destination State dropdown (from destinations.getStates)
  - Product Type dropdown (from productTypes.list)
  - Service Type dropdown (from serviceTypes.list)
  - Active/Inactive filter
- `DataTable` columns:
  - Origin (State/City)
  - Destination (State/City)
  - Product Type (name from join)
  - Service Type (name from join)
  - Mode (name from join)
  - Unit Price (INR formatted)
  - Min. Charge (INR formatted)
  - Status (Active badge)
  - Actions (Edit, Delete)
- Pagination (20 per page)

### File: `apps/web/app/(admin)/pricing/_components/columns.tsx` - PENDING

Column definitions with formatted prices and type badges.

### File: `apps/web/app/(admin)/pricing/_components/pricing-rule-form.tsx` - PENDING

Sheet form:
- Origin State (Select from states list)
- Origin City (Input, optional)
- Destination State (Select from states list)
- Destination City (Input, optional)
- Product Type (Select from product types list)
- Service Type (Select from service types list)
- Mode Type (Select from mode types list)
- Unit Price (Input, number with 2 decimal places, INR prefix)
- Minimum Charge (Input, number with 2 decimal places, INR prefix, optional)
- Active toggle (only in edit mode)

All Select dropdowns populated from their respective list queries.

---

## Step 4.3 - Shipment Service & Route
**Status: PENDING**

### 4.3.1 Zod Models - `packages/services/shipment/model.ts` - PENDING

```typescript
// Enums
shipmentStatusEnum: z.enum([
  "BOOKED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "ON_HOLD",
])

// Address schema (stored as JSONB)
addressSchema: z.object({
  fullName: z.string(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
})

// Create shipment input
createShipmentInputSchema: {
  branchId: z.string().uuid(),
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  // Optional address overrides (if different from customer address)
  senderAddress: addressSchema.optional(),
  receiverAddress: addressSchema.optional(),
  productTypeId: z.string().uuid(),
  serviceTypeId: z.string().uuid(),
  modeTypeId: z.string().uuid(),
  weight: z.string().regex(/^\d+(\.\d{1,3})?$/),
  declaredValue: z.string().regex(/^\d+(\.\d{1,2})?$/),
  gstEnabled: z.boolean().default(true),
}

// Update shipment status
updateShipmentStatusInputSchema: {
  id: z.string().uuid(),
  status: shipmentStatusEnum,
  location: z.string().max(200).optional(),
  remarks: z.string().max(500).optional(),
}

// List shipments
listShipmentsInputSchema: {
  search: z.string().optional(),          // tracking number, sender/receiver name
  status: shipmentStatusEnum.optional(),
  branchId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),        // ISO date string
  dateTo: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}

// Track shipment (public)
trackShipmentInputSchema: {
  trackingNumber: z.string().min(1),
}

// Output schemas
shipmentOutputSchema: {
  id, trackingNumber, branchId,
  senderId, receiverId,
  senderAddress, receiverAddress,
  productTypeId, serviceTypeId, modeTypeId,
  weight, declaredValue,
  basePrice, gstEnabled, gstType, gstRate, gstAmount, totalAmount,
  status, invoiceTemplateId,
  bookedAt, deliveredAt, createdAt, updatedAt,
  // Joined names
  senderName, receiverName, branchName,
  productTypeName, serviceTypeName, modeTypeName,
}

listShipmentsOutputSchema: { data[], total, page, limit }

trackingOutputSchema: {
  trackingNumber, status, bookedAt, deliveredAt,
  senderCity, senderState,
  receiverCity, receiverState,
  history: z.array(z.object({
    status: z.string(),
    location: z.string().nullable(),
    remarks: z.string().nullable(),
    timestamp: z.date().nullable(),
  }))
}
```

### 4.3.2 Service Class - `packages/services/shipment/index.ts` - PENDING

Class: `ShipmentService`

Methods:
- `create(input)` -> ShipmentOutput
  1. Validate sender/receiver exist and are active
  2. Validate branch exists and is active
  3. Fetch sender/receiver full records for address defaults
  4. Build senderAddress/receiverAddress (use override or customer record)
  5. Call PricingRuleService.calculatePrice to get basePrice
  6. GST calculation:
     - Determine gstType: if origin state === destination state -> "CGST+SGST", else "IGST"
     - gstRate = 18% (standard rate for courier services)
     - gstAmount = basePrice * gstRate / 100 (if gstEnabled)
     - totalAmount = basePrice + gstAmount
  7. Generate tracking number: `TPC` + YYYYMMDD + 5-digit sequence (e.g., "TPC2026060800001")
     - Query max tracking number for today, increment
     - Fallback: random 5-digit suffix if no records for today
  8. Insert shipment record
  9. Insert initial tracking history entry (status="BOOKED", location=branch city)
  10. Return with joined names

- `list(input)` -> ListShipmentsOutput
  - Search: tracking number exact match OR ilike on sender/receiver name (via address JSONB)
  - Filters: status, branchId, date range (bookedAt between dateFrom and dateTo)
  - Join product/service/mode types for names
  - Paginate + count
  - Order by bookedAt desc

- `getById(id)` -> ShipmentOutput
  - With all joined names

- `updateStatus(input)` -> ShipmentOutput
  - Validate status transition is valid:
    - BOOKED -> PICKED_UP, CANCELLED, ON_HOLD
    - PICKED_UP -> IN_TRANSIT, CANCELLED, ON_HOLD
    - IN_TRANSIT -> OUT_FOR_DELIVERY, RETURNED, ON_HOLD
    - OUT_FOR_DELIVERY -> DELIVERED, RETURNED, ON_HOLD
    - ON_HOLD -> PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, CANCELLED
    - DELIVERED/CANCELLED/RETURNED -> (terminal, no transitions allowed)
  - Insert tracking history entry
  - If DELIVERED: set deliveredAt = now
  - Return updated shipment

- `track(trackingNumber)` -> TrackingOutput
  - **Public endpoint** (uses `publicProcedure`, no auth needed)
  - Find shipment by tracking number
  - Fetch tracking history ordered by timestamp
  - Return summary with history

### 4.3.3 tRPC Route - `packages/trpc/server/routes/shipment/route.ts` - PENDING

Shipment routes use `adminProcedure` for admin operations, `publicProcedure` for public tracking:

```typescript
import { adminProcedure, publicProcedure, router } from "../../trpc";

shipmentRouter = router({
  list:         adminProcedure    GET    /shipments
  getById:      adminProcedure    GET    /shipments/:id
  create:       adminProcedure    POST   /shipments
  updateStatus: adminProcedure    PUT    /shipments/:id/status
  track:        publicProcedure   GET    /shipments/track/:trackingNumber  (public, no auth)
});
```

---

## Step 4.4 - Register Services & Routes
**Status: PENDING**

### Update `packages/trpc/server/services/index.ts` - PENDING
```typescript
import PricingRuleService from "@repo/services/pricing-rule";
import ShipmentService from "@repo/services/shipment";

export const pricingRuleService = new PricingRuleService();
export const shipmentService = new ShipmentService();
```

### Update `packages/trpc/server/index.ts` - PENDING
```typescript
import { pricingRuleRouter } from "./routes/pricing-rule/route";
import { shipmentRouter } from "./routes/shipment/route";

// Add to serverRouter:
pricingRules: pricingRuleRouter,
shipments: shipmentRouter,
```

---

## Step 4.5 - Shipment Booking Page (Create New)
**Status: PENDING**

### File: `apps/web/app/(admin)/shipments/new/page.tsx` - PENDING

Multi-step form (not a sheet — full page because of complexity):

**Step 1: Sender & Receiver**
- Sender: Customer combobox (using customers.search) + address display
  - On select: auto-fill sender address fields
  - "Use different address" toggle to override
- Receiver: same pattern
- Both show address preview cards

**Step 2: Shipment Details**
- Branch (Select from branches.list, only active ones)
- Product Type (Select)
- Service Type (Select)
- Mode Type (Select)
- Weight (number input, kg, up to 3 decimal places)
- Declared Value (number input, INR)

**Step 3: Price & Confirm**
- Auto-calculate price on load (calls pricingRules.calculatePrice)
- Price breakdown display:
  - Base Price (unit price x weight or minimum charge)
  - GST Type (IGST or CGST+SGST, auto-determined from states)
  - GST Rate (18%)
  - GST Amount
  - Total Amount
- GST toggle (enabled by default)
- Confirm & Book button

On success: redirect to shipment detail page or show success with tracking number.

### File: `apps/web/app/(admin)/shipments/new/_components/customer-select.tsx` - PENDING

Combobox component:
- Debounced search input
- Calls `trpc.customers.search` with query
- Shows dropdown with name + phone
- On select: returns customer ID and fills address
- Shows selected customer card with address

### File: `apps/web/app/(admin)/shipments/new/_components/price-calculator.tsx` - PENDING

Component that:
- Takes origin state/city, dest state/city, product/service/mode IDs, weight
- Calls `trpc.pricingRules.calculatePrice` mutation
- Displays price breakdown card
- Shows GST calculation

---

## Step 4.6 - Shipments List Page
**Status: PENDING**

### File: `apps/web/app/(admin)/shipments/page.tsx` - PENDING

Page layout:
- `PageHeader` title="Shipments" with "Create New" button (links to /shipments/new)
- Stat cards row:
  - Total Shipments (count from current filters)
  - Booked Today (placeholder, count from today)
  - In Transit (placeholder)
  - Delivered (placeholder)
- Filter bar:
  - Search input (tracking number, names)
  - Status dropdown (All + each status enum value)
  - Date range (From / To date inputs)
- `DataTable` columns:
  - Tracking # (monospace font, link to detail)
  - Sender (name from address JSONB)
  - Receiver (name from address JSONB)
  - Route (origin city -> dest city)
  - Status (StatusBadge component)
  - Amount (INR formatted)
  - Booked Date
  - Actions (View, Update Status)
- Pagination (20 per page)

### File: `apps/web/app/(admin)/shipments/_components/columns.tsx` - PENDING

Column definitions with StatusBadge, formatted amounts, links.

### File: `apps/web/app/(admin)/shipments/_components/update-status-sheet.tsx` - PENDING

Sheet for updating shipment status:
- Current status display
- New status (Select, only valid transitions shown)
- Location (optional text input)
- Remarks (optional textarea)
- Submit button

---

## Step 4.7 - Shipment Detail Page
**Status: PENDING**

### File: `apps/web/app/(admin)/shipments/[id]/page.tsx` - PENDING

Layout:
- Back button + PageHeader with tracking number
- Status badge (large, prominent)
- Two-column grid:
  - Left: Shipment info card
    - Tracking Number
    - Branch
    - Product/Service/Mode type
    - Weight, Declared Value
  - Right: Price breakdown card
    - Base Price, GST breakdown, Total
- Two-column grid:
  - Sender card (name, phone, full address)
  - Receiver card (name, phone, full address)
- Tracking timeline:
  - Vertical timeline of status history
  - Each entry: status, location, remarks, timestamp
  - Most recent at top
- Actions:
  - Update Status button (opens sheet)
  - Print Invoice (placeholder for Phase 6)

---

## Step 4.8 - Public Tracking Page
**Status: PENDING**

### File: `apps/web/app/(public)/track/[trackingNumber]/page.tsx` - PENDING

Update the existing placeholder to:
- Call `trpc.shipments.track` with tracking number from params
- Display:
  - Tracking number + current status badge
  - Route: origin city -> destination city
  - Tracking timeline (same vertical timeline style)
  - Booked date, delivery date (if delivered)
- Error state: "Shipment not found" message
- Loading skeleton

---

## Step 4.9 - Seed Data for Pricing Rules
**Status: PENDING**

### File: `packages/database/seed/pricing-rules.ts` - PENDING

Strategy:
- Depends on master seed having run first (needs product/service/mode type IDs)
- Query existing product types, service types, mode types
- Generate pricing rules for common inter-state routes:
  - Maharashtra -> Delhi, Karnataka, Tamil Nadu, Gujarat
  - Delhi -> Maharashtra, Karnataka, UP, Rajasthan
  - Karnataka -> Maharashtra, Delhi, Tamil Nadu, Telangana
- For each route: create rules for "Parcel" + "Standard" + "Road" as baseline
- ~20-30 representative rules
- Idempotent: skip if pricing_rules table has records

### Update `packages/database/package.json` - PENDING
Add script: `"db:seed:pricing": "dotenv -- tsx seed/pricing-rules.ts"`

---

## Step 4.10 - Build Verification
**Status: PENDING**

- Run `pnpm turbo build` to verify full compilation
- Run `pnpm db:seed:pricing` to populate pricing rules
- Test pricing rules CRUD
- Test price calculation endpoint
- Test shipment booking flow end-to-end
- Test shipment list with filters
- Test status update with valid/invalid transitions
- Test public tracking page

---

## Deliverables Checklist

| # | Item | Status |
|---|------|--------|
| 1 | `services/pricing-rule/model.ts` | PENDING |
| 2 | `services/pricing-rule/index.ts` | PENDING |
| 3 | `trpc/server/routes/pricing-rule/route.ts` | PENDING |
| 4 | Pricing Rules UI (page + columns + form) | PENDING |
| 5 | `services/shipment/model.ts` | PENDING |
| 6 | `services/shipment/index.ts` | PENDING |
| 7 | `trpc/server/routes/shipment/route.ts` | PENDING |
| 8 | Services + routes registered (index.ts updates) | PENDING |
| 9 | Shipment booking page (multi-step form) | PENDING |
| 10 | Customer select combobox component | PENDING |
| 11 | Price calculator component | PENDING |
| 12 | Shipments list page + columns | PENDING |
| 13 | Update status sheet | PENDING |
| 14 | Shipment detail page with timeline | PENDING |
| 15 | Public tracking page (updated) | PENDING |
| 16 | `database/seed/pricing-rules.ts` + script | PENDING |
| 17 | Full build passes | PENDING |
