# Phase 1: Foundation & Database Schema

## Status: COMPLETE

## Goal
Set up every database table, generate migrations, establish the admin/customer/public route group layouts, update color scheme, and build shared reusable components that all later phases depend on.

---

## Step 1.1 - Database Models
**Status: DONE**

Create all Drizzle table definitions in `packages/database/models/`. Each file exports the pgTable + inferred Select/Insert types. All tables use the established pattern from `models/user.ts`.

### Files to create:

#### 1.1.1 `packages/database/models/branch.ts` - PENDING
- Table: `branchesTable` ("branches")
- Columns:
  - `id` uuid PK defaultRandom
  - `code` varchar(20) unique notNull (e.g. "HO-MUM-001")
  - `name` varchar(100) notNull
  - `type` varchar(30) notNull ("Head Office", "Regional Office", "Franchise", "Collection Center", "Hub")
  - `city` varchar(100) notNull
  - `state` varchar(100) notNull
  - `address` text nullable
  - `pincode` varchar(6) nullable
  - `latitude` varchar(20) nullable (store as string for simplicity)
  - `longitude` varchar(20) nullable
  - `contactPhone` varchar(15) nullable
  - `contactEmail` varchar(255) nullable
  - `isActive` boolean default(true)
  - `createdAt` timestamp defaultNow
  - `updatedAt` timestamp $onUpdate
- Exports: `branchesTable`, `SelectBranch`, `InsertBranch`

#### 1.1.2 `packages/database/models/customer.ts` - PENDING
- Table: `customersTable` ("customers")
- Columns:
  - `id` uuid PK defaultRandom
  - `fullName` varchar(100) notNull
  - `phone` varchar(15) notNull
  - `email` varchar(255) nullable
  - `address` text notNull
  - `city` varchar(100) notNull
  - `state` varchar(100) notNull
  - `pincode` varchar(6) notNull
  - `idProofType` varchar(20) notNull ("PAN", "AADHAAR", "VOTER_ID", "DRIVING_LICENSE", "PASSPORT")
  - `idProofNumber` varchar(50) notNull
  - `idProofImageUrl` text nullable
  - `isActive` boolean default(true)
  - `createdAt` timestamp defaultNow
  - `updatedAt` timestamp $onUpdate
- Exports: `customersTable`, `SelectCustomer`, `InsertCustomer`

#### 1.1.3 `packages/database/models/destination.ts` - PENDING
- Table: `destinationsTable` ("destinations")
- Columns:
  - `id` uuid PK defaultRandom
  - `state` varchar(100) notNull
  - `city` varchar(100) notNull
  - `pincode` varchar(6) notNull unique
  - `isServiceable` boolean default(true)
  - `createdAt` timestamp defaultNow
  - `updatedAt` timestamp $onUpdate
- Exports: `destinationsTable`, `SelectDestination`, `InsertDestination`

#### 1.1.4 `packages/database/models/product-type.ts` - PENDING
- Table: `productTypesTable` ("product_types")
- Columns:
  - `id` uuid PK defaultRandom
  - `name` varchar(50) unique notNull
  - `description` text nullable
  - `isActive` boolean default(true)
  - `createdAt` timestamp defaultNow
  - `updatedAt` timestamp $onUpdate
- Exports: `productTypesTable`, `SelectProductType`, `InsertProductType`

#### 1.1.5 `packages/database/models/service-type.ts` - PENDING
- Table: `serviceTypesTable` ("service_types")
- Same structure as product-type
- Exports: `serviceTypesTable`, `SelectServiceType`, `InsertServiceType`

#### 1.1.6 `packages/database/models/mode-type.ts` - PENDING
- Table: `modeTypesTable` ("mode_types")
- Same structure as product-type
- Exports: `modeTypesTable`, `SelectModeType`, `InsertModeType`

#### 1.1.7 `packages/database/models/pricing-rule.ts` - PENDING
- Table: `pricingRulesTable` ("pricing_rules")
- Columns:
  - `id` uuid PK defaultRandom
  - `originState` varchar(100) notNull
  - `originCity` varchar(100) nullable (null = all cities)
  - `destinationState` varchar(100) notNull
  - `destinationCity` varchar(100) nullable
  - `productTypeId` uuid notNull references productTypesTable.id
  - `serviceTypeId` uuid notNull references serviceTypesTable.id
  - `modeTypeId` uuid notNull references modeTypesTable.id
  - `unitPrice` varchar(20) notNull (stored as string, parsed as decimal for precision)
  - `minimumCharge` varchar(20) default("0")
  - `isActive` boolean default(true)
  - `createdAt` timestamp defaultNow
  - `updatedAt` timestamp $onUpdate
- Exports: `pricingRulesTable`, `SelectPricingRule`, `InsertPricingRule`

Note on decimals: Drizzle's `numeric`/`decimal` type from `drizzle-orm/pg-core` will be used instead of varchar for price fields. Use `numeric("column_name", { precision: 12, scale: 2 })` for prices and `numeric("column_name", { precision: 10, scale: 3 })` for weight.

#### 1.1.8 `packages/database/models/shipment.ts` - PENDING
- Table 1: `shipmentsTable` ("shipments")
- Columns:
  - `id` uuid PK defaultRandom
  - `trackingNumber` varchar(30) unique notNull
  - `branchId` uuid notNull references branchesTable.id
  - `senderId` uuid notNull references customersTable.id
  - `receiverId` uuid notNull references customersTable.id
  - `senderAddress` jsonb notNull (snapshot)
  - `receiverAddress` jsonb notNull (snapshot)
  - `productTypeId` uuid notNull references productTypesTable.id
  - `serviceTypeId` uuid notNull references serviceTypesTable.id
  - `modeTypeId` uuid notNull references modeTypesTable.id
  - `weight` numeric(10,3) notNull (kg)
  - `declaredValue` numeric(12,2) notNull (INR)
  - `basePrice` numeric(12,2) notNull
  - `gstEnabled` boolean default(true)
  - `gstType` varchar(10) nullable ("IGST" | "CGST_SGST")
  - `gstRate` numeric(5,2) nullable
  - `gstAmount` numeric(12,2) nullable
  - `totalAmount` numeric(12,2) notNull
  - `status` varchar(20) notNull default("BOOKED")
  - `invoiceTemplateId` uuid nullable references invoiceTemplatesTable.id
  - `bookedAt` timestamp defaultNow
  - `deliveredAt` timestamp nullable
  - `createdAt` timestamp defaultNow
  - `updatedAt` timestamp $onUpdate

- Table 2: `shipmentTrackingHistoryTable` ("shipment_tracking_history")
- Columns:
  - `id` uuid PK defaultRandom
  - `shipmentId` uuid notNull references shipmentsTable.id
  - `status` varchar(20) notNull
  - `location` varchar(200) nullable
  - `remarks` text nullable
  - `timestamp` timestamp defaultNow

- Exports: `shipmentsTable`, `SelectShipment`, `InsertShipment`, `shipmentTrackingHistoryTable`, `SelectShipmentTrackingHistory`, `InsertShipmentTrackingHistory`

#### 1.1.9 `packages/database/models/invoice.ts` - PENDING
- Table 1: `invoiceCategoriesTable` ("invoice_categories")
- Columns:
  - `id` uuid PK defaultRandom
  - `name` varchar(50) unique notNull
  - `description` text nullable
  - `createdAt` timestamp defaultNow

- Table 2: `invoiceTemplatesTable` ("invoice_templates")
- Columns:
  - `id` uuid PK defaultRandom
  - `name` varchar(100) notNull
  - `categoryId` uuid notNull references invoiceCategoriesTable.id
  - `width` integer notNull (mm)
  - `height` integer notNull (mm)
  - `showQR` boolean default(true)
  - `qrPosition` varchar(20) nullable ("top-left", "top-right", "bottom-left", "bottom-right")
  - `layout` jsonb notNull
  - `colors` jsonb notNull
  - `typography` jsonb notNull
  - `visibleFields` jsonb notNull
  - `headerConfig` jsonb nullable
  - `footerConfig` jsonb nullable
  - `isDefault` boolean default(false)
  - `createdAt` timestamp defaultNow
  - `updatedAt` timestamp $onUpdate

- Exports: `invoiceCategoriesTable`, `SelectInvoiceCategory`, `InsertInvoiceCategory`, `invoiceTemplatesTable`, `SelectInvoiceTemplate`, `InsertInvoiceTemplate`

#### 1.1.10 `packages/database/models/notification.ts` - PENDING
- Table 1: `notificationConfigsTable` ("notification_configs")
- Columns:
  - `id` uuid PK defaultRandom
  - `channel` varchar(20) notNull ("email", "sms", "whatsapp")
  - `provider` varchar(30) notNull
  - `isActive` boolean default(false)
  - `credentials` jsonb notNull
  - `settings` jsonb nullable
  - `createdAt` timestamp defaultNow
  - `updatedAt` timestamp $onUpdate

- Table 2: `notificationEventsTable` ("notification_events")
- Columns:
  - `id` uuid PK defaultRandom
  - `eventType` varchar(30) notNull ("SHIPMENT_BOOKED", "STATUS_UPDATE", "DELIVERED")
  - `channel` varchar(20) notNull
  - `provider` varchar(30) notNull
  - `recipient` varchar(255) notNull
  - `status` varchar(20) notNull ("SENT", "FAILED", "DELIVERED")
  - `messageId` varchar(255) nullable
  - `error` text nullable
  - `sentAt` timestamp defaultNow

- Exports: `notificationConfigsTable`, `SelectNotificationConfig`, `InsertNotificationConfig`, `notificationEventsTable`, `SelectNotificationEvent`, `InsertNotificationEvent`

#### 1.1.11 Update `packages/database/schema.ts` - PENDING
- Add barrel exports for all new model files:
  - `export * from "./models/branch"`
  - `export * from "./models/customer"`
  - `export * from "./models/destination"`
  - `export * from "./models/product-type"`
  - `export * from "./models/service-type"`
  - `export * from "./models/mode-type"`
  - `export * from "./models/pricing-rule"`
  - `export * from "./models/shipment"`
  - `export * from "./models/invoice"`
  - `export * from "./models/notification"`

---

## Step 1.2 - Run Database Migration
**Status: DONE**

- Run `pnpm db:generate` to generate SQL migration files
- Run `pnpm db:migrate` to apply migrations to PostgreSQL
- Verify all tables exist in database

---

## Step 1.3 - Update Color Scheme
**Status: DONE**

File: `apps/web/app/globals.css`

Replace the current neutral oklch palette. No purple anywhere.

**Light mode `:root` values:**
- `--primary`: oklch(0.40 0.15 250) - Deep Blue
- `--primary-foreground`: oklch(0.985 0 0) - White
- `--accent`: oklch(0.72 0.18 55) - Warm Orange (new custom variable for CTAs)
- `--secondary`: oklch(0.97 0 0) - Light gray (keep)
- `--secondary-foreground`: oklch(0.205 0 0) (keep)
- `--muted`: oklch(0.97 0 0) (keep)
- `--muted-foreground`: oklch(0.556 0 0) (keep)
- `--destructive`: oklch(0.577 0.245 27.325) (keep - red)
- `--chart-1`: oklch(0.55 0.18 250) - Blue
- `--chart-2`: oklch(0.65 0.18 55) - Orange
- `--chart-3`: oklch(0.60 0.15 155) - Green
- `--chart-4`: oklch(0.75 0.15 85) - Amber
- `--chart-5`: oklch(0.60 0.12 195) - Teal
- `--sidebar-primary`: oklch(0.40 0.15 250) - matches primary

**Dark mode `.dark` values:**
- Same hue families, adjusted lightness for dark backgrounds
- `--primary`: oklch(0.70 0.15 250) - Lighter blue for dark mode
- `--sidebar-primary`: oklch(0.60 0.18 250)
- Charts: slightly brighter versions for dark backgrounds

---

## Step 1.4 - Next.js Route Group Structure
**Status: DONE**

Note: Customer routes placed under `(customer)/portal/` prefix to avoid path collision with admin routes. Root `/` serves landing page from `(public)/page.tsx`.

Create all directories and placeholder page files. Each placeholder page exports a simple component with the page title so navigation works.

### Files to create:

**Public route group:**
- `apps/web/app/(public)/layout.tsx` - Minimal layout, no sidebar, just children
- `apps/web/app/(public)/page.tsx` - Landing page placeholder ("TPC India - Courier Services")
- `apps/web/app/(public)/track/[trackingNumber]/page.tsx` - Tracking placeholder

**Admin route group (19 files):**
- `apps/web/app/(admin)/layout.tsx` - Sidebar layout (full implementation in Step 1.5)
- `apps/web/app/(admin)/dashboard/page.tsx` - "Dashboard" placeholder
- `apps/web/app/(admin)/shipments/page.tsx` - "All Shipments" placeholder
- `apps/web/app/(admin)/shipments/new/page.tsx` - "Create Shipment" placeholder
- `apps/web/app/(admin)/customers/page.tsx` - "Customers" placeholder
- `apps/web/app/(admin)/customers/[id]/page.tsx` - "Customer Detail" placeholder
- `apps/web/app/(admin)/branches/page.tsx` - "Branches" placeholder
- `apps/web/app/(admin)/destinations/page.tsx` - "Destinations" placeholder
- `apps/web/app/(admin)/pricing/page.tsx` - "Pricing Rules" placeholder
- `apps/web/app/(admin)/invoices/page.tsx` - "Invoice Templates" placeholder
- `apps/web/app/(admin)/product-types/page.tsx` - "Product Types" placeholder
- `apps/web/app/(admin)/service-types/page.tsx` - "Service Types" placeholder
- `apps/web/app/(admin)/mode-types/page.tsx` - "Mode Types" placeholder
- `apps/web/app/(admin)/settings/notifications/page.tsx` - "Notification Settings" placeholder

**Customer portal route group:**
- `apps/web/app/(customer)/layout.tsx` - Top nav layout (full implementation in Step 1.6)
- `apps/web/app/(customer)/track/page.tsx` - "Track Shipment" placeholder
- `apps/web/app/(customer)/shipments/page.tsx` - "My Shipments" placeholder
- `apps/web/app/(customer)/profile/page.tsx` - "My Profile" placeholder

**Root page update:**
- `apps/web/app/page.tsx` - Redirect to `/dashboard` (admin) for MVP

**Placeholder page pattern:**
```tsx
export default function PageName() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Page Title</h1>
      <p className="text-muted-foreground mt-1">Page description.</p>
    </div>
  );
}
```

---

## Step 1.5 - Admin Sidebar Layout
**Status: DONE**

File: `apps/web/app/(admin)/layout.tsx`

Uses shadcn `Sidebar`, `SidebarProvider`, `SidebarContent`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton` components already in the project.

### Sidebar structure:
```
Header:
  - TPC India logo area + "TPC India" text

Navigation groups:
  MAIN:
    - Dashboard          (LayoutDashboard)    /dashboard
    - Shipments          (Package)            /shipments
      - All Shipments                         /shipments
      - Create New                            /shipments/new
    - Customers          (Users)              /customers

  OPERATIONS:
    - Branches           (Building2)          /branches
    - Destinations       (MapPin)             /destinations
    - Pricing Rules      (IndianRupee)        /pricing
    - Invoice Templates  (FileText)           /invoices

  MASTERS:
    - Product Types      (Box)                /product-types
    - Service Types      (Zap)                /service-types
    - Mode Types         (Truck)              /mode-types

  SETTINGS:
    - Notifications      (Bell)               /settings/notifications

Footer:
  - Collapse toggle
```

### Implementation details:
- Create `apps/web/components/admin/app-sidebar.tsx` - the sidebar component
- Use `usePathname()` from next/navigation for active route highlighting
- `SidebarProvider` wraps children in the layout
- Content area has a top bar with `SidebarTrigger` (hamburger) + breadcrumbs
- Mobile: sidebar as overlay sheet (built-in shadcn sidebar behavior)

---

## Step 1.6 - Customer Portal Layout
**Status: DONE**

File: `apps/web/app/(customer)/layout.tsx`

### Implementation:
- Top navigation bar using a simple flex header
- Logo on left, nav links center, logout right
- Links: Track Shipment (`/track`), My Shipments (`/shipments`), Profile (`/profile`)
- Note: These paths are relative within the `(customer)` route group
- Mobile: hamburger menu with sheet for nav items
- Create `apps/web/components/customer/customer-nav.tsx` for the nav component

---

## Step 1.7 - Shared Components
**Status: DONE**

### 1.7.1 Install dependency - PENDING
```bash
cd apps/web && pnpm add @tanstack/react-table
```

### 1.7.2 `apps/web/components/shared/data-table.tsx` - PENDING
- Generic `DataTable<TData, TValue>` component
- Props:
  - `columns: ColumnDef<TData, TValue>[]` - TanStack Table column definitions
  - `data: TData[]` - row data
  - `pageCount?: number` - total pages (for server-side pagination)
  - `pagination?: { pageIndex: number; pageSize: number }` - current page state
  - `onPaginationChange?: (pagination) => void` - pagination callback
  - `isLoading?: boolean` - shows skeleton rows
- Renders using shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- Pagination controls at bottom using shadcn `Button`
- Empty state message when no data

### 1.7.3 `apps/web/components/shared/stat-card.tsx` - PENDING
- Props:
  - `title: string` - KPI label
  - `value: string | number` - main value
  - `trend?: { value: number; isPositive: boolean }` - optional trend indicator
  - `icon?: LucideIcon` - optional icon
  - `description?: string` - optional subtitle
- Uses shadcn `Card` component
- Trend shows up/down arrow with green/red color

### 1.7.4 `apps/web/components/shared/page-header.tsx` - PENDING
- Props:
  - `title: string`
  - `description?: string`
  - `actions?: React.ReactNode` - slot for action buttons (top-right)
- Renders title as h1, description as muted text, actions flex-end

### 1.7.5 `apps/web/components/shared/confirm-dialog.tsx` - PENDING
- Props:
  - `open: boolean`
  - `onOpenChange: (open: boolean) => void`
  - `title: string`
  - `description: string`
  - `onConfirm: () => void`
  - `confirmLabel?: string` (default: "Delete")
  - `variant?: "destructive" | "default"` (default: "destructive")
  - `isLoading?: boolean`
- Uses shadcn `AlertDialog` components
- Confirm button shows spinner when isLoading

### 1.7.6 `apps/web/components/shared/status-badge.tsx` - PENDING
- Props:
  - `status: string` - shipment status
- Color mapping:
  - BOOKED = blue (bg-blue-100 text-blue-700 / dark:bg-blue-900 dark:text-blue-300)
  - PICKED_UP = cyan
  - IN_TRANSIT = amber
  - OUT_FOR_DELIVERY = orange
  - DELIVERED = green
  - RETURNED = red
  - CANCELLED = gray
- Uses shadcn `Badge` with custom className based on status

---

## Step 1.8 - tRPC Context Update
**Status: DONE**

File: `packages/trpc/server/context.ts`

Update the currently empty context function to accept request info:
```typescript
export async function createContext({ req }: { req?: { headers?: Record<string, string> } } = {}) {
  return { headers: req?.headers };
}
```

This is a minimal change - just adds the parameter signature so auth context can be added in later phases without breaking the existing setup.

---

## Deliverables Checklist

| # | Item | Status |
|---|------|--------|
| 1 | `models/branch.ts` | DONE |
| 2 | `models/customer.ts` | DONE |
| 3 | `models/destination.ts` | DONE |
| 4 | `models/product-type.ts` | DONE |
| 5 | `models/service-type.ts` | DONE |
| 6 | `models/mode-type.ts` | DONE |
| 7 | `models/pricing-rule.ts` | DONE |
| 8 | `models/shipment.ts` (2 tables) | DONE |
| 9 | `models/invoice.ts` (2 tables) | DONE |
| 10 | `models/notification.ts` (2 tables) | DONE |
| 11 | `schema.ts` updated with all exports | DONE |
| 12 | Migration generated | DONE |
| 13 | Migration applied | DONE |
| 14 | Color scheme updated (globals.css) | DONE |
| 15 | Public route group (layout + pages) | DONE |
| 16 | Admin route group (layout + 14 pages) | DONE |
| 17 | Customer route group (layout + 3 pages) | DONE |
| 18 | Root `/` = landing page, links to `/dashboard` | DONE |
| 19 | Admin sidebar (`app-sidebar.tsx` + layout) | DONE |
| 20 | Customer nav (`customer-nav.tsx` + layout) | DONE |
| 21 | `@tanstack/react-table` installed | DONE |
| 22 | `data-table.tsx` shared component | DONE |
| 23 | `stat-card.tsx` shared component | DONE |
| 24 | `page-header.tsx` shared component | DONE |
| 25 | `confirm-dialog.tsx` shared component | DONE |
| 26 | `status-badge.tsx` shared component | DONE |
| 27 | tRPC context updated | DONE |
