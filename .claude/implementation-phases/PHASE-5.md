# Phase 5: Invoice System

## Status: DONE

## Prerequisites
- **Phase 4 must be completed first.** This phase generates invoices from shipment data and uses `adminProcedure` for all routes.

## Goal
Build the invoice template system with categories, a template builder with live preview, PDF generation with QR codes, and CSV/Excel export functionality. Invoices are generated from shipment data and styled according to configurable templates.

---

## Step 5.1 - Invoice Service (Models + Service)
**Status: PENDING**

### 5.1.1 Zod Models - `packages/services/invoice/model.ts` - PENDING

```typescript
// --- Invoice Categories ---
createInvoiceCategoryInputSchema: {
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
}

invoiceCategoryOutputSchema: {
  id, name, description, createdAt
}

listCategoriesOutputSchema: z.array(invoiceCategoryOutputSchema)

deleteCategoryInputSchema: { id: z.string().uuid() }

// --- Invoice Templates ---
// JSONB sub-schemas
colorsSchema: z.object({
  primary: z.string().default("#000000"),
  secondary: z.string().default("#666666"),
  background: z.string().default("#ffffff"),
  text: z.string().default("#000000"),
  border: z.string().default("#e5e7eb"),
})

typographySchema: z.object({
  headingFont: z.string().default("Helvetica"),
  headingSize: z.number().int().min(8).max(36).default(16),
  baseFont: z.string().default("Helvetica"),
  baseSize: z.number().int().min(6).max(24).default(10),
})

visibleFieldsSchema: z.object({
  trackingNumber: z.boolean().default(true),
  senderName: z.boolean().default(true),
  senderAddress: z.boolean().default(true),
  senderPhone: z.boolean().default(true),
  receiverName: z.boolean().default(true),
  receiverAddress: z.boolean().default(true),
  receiverPhone: z.boolean().default(true),
  productType: z.boolean().default(true),
  serviceType: z.boolean().default(true),
  modeType: z.boolean().default(true),
  weight: z.boolean().default(true),
  declaredValue: z.boolean().default(true),
  basePrice: z.boolean().default(true),
  gstBreakdown: z.boolean().default(true),
  totalAmount: z.boolean().default(true),
  bookedDate: z.boolean().default(true),
})

headerConfigSchema: z.object({
  companyName: z.string().default("TPC India"),
  address: z.string().default(""),
  logoUrl: z.string().optional(),
})

footerConfigSchema: z.object({
  termsText: z.string().default(""),
  disclaimerText: z.string().default(""),
})

layoutSchema: z.object({
  orientation: z.enum(["portrait", "landscape"]).default("portrait"),
  padding: z.number().int().min(0).max(50).default(20),
})

createInvoiceTemplateInputSchema: {
  name: z.string().min(1).max(100),
  categoryId: z.string().uuid(),
  width: z.number().int().min(50).max(500),   // mm
  height: z.number().int().min(50).max(500),  // mm
  showQR: z.boolean().default(true),
  qrPosition: z.enum(["top-left", "top-right", "bottom-left", "bottom-right"]).default("bottom-right"),
  layout: layoutSchema,
  colors: colorsSchema,
  typography: typographySchema,
  visibleFields: visibleFieldsSchema,
  headerConfig: headerConfigSchema.optional(),
  footerConfig: footerConfigSchema.optional(),
  isDefault: z.boolean().default(false),
}

updateInvoiceTemplateInputSchema: {
  id: z.string().uuid(),
  ...partial of create fields (all optional)
}

invoiceTemplateOutputSchema: {
  id, name, categoryId, categoryName,
  width, height, showQR, qrPosition,
  layout, colors, typography, visibleFields,
  headerConfig, footerConfig, isDefault,
  createdAt, updatedAt,
}

listTemplatesInputSchema: {
  categoryId: z.string().uuid().optional(),
}

getByIdInputSchema: { id: z.string().uuid() }
deleteInputSchema: { id: z.string().uuid() }
setDefaultInputSchema: { id: z.string().uuid() }

// --- Invoice Data Generation ---
generateInvoiceDataInputSchema: {
  shipmentId: z.string().uuid(),
  templateId: z.string().uuid().optional(),  // uses default template if omitted
}

invoiceDataOutputSchema: {
  template: invoiceTemplateOutputSchema,
  shipment: {
    trackingNumber, status, bookedAt,
    senderAddress (Address object),
    receiverAddress (Address object),
    productTypeName, serviceTypeName, modeTypeName,
    weight, declaredValue,
    basePrice, gstEnabled, gstType, gstRate, gstAmount, totalAmount,
    branchName,
  },
  qrContent: z.string(),  // URL for QR code: "{BASE_URL}/track/{trackingNumber}"
}

// --- Export ---
exportShipmentsInputSchema: {
  shipmentIds: z.array(z.string().uuid()).min(1).max(500),
}
```

### 5.1.2 Service Class - `packages/services/invoice/index.ts` - PENDING

Class: `InvoiceService`

**Category Methods:**
- `listCategories()` -> InvoiceCategoryOutput[]
  - Return all categories ordered by name

- `createCategory(input)` -> InvoiceCategoryOutput
  - Check unique name (case-insensitive)
  - Insert and return

- `deleteCategory(id)` -> { success: boolean }
  - Check if any templates reference this category
  - Block deletion if templates exist, throw CONFLICT
  - Hard delete if no references

**Template Methods:**
- `listTemplates(categoryId?)` -> InvoiceTemplateOutput[]
  - Filter by categoryId if provided
  - Join with categories for categoryName
  - Order by name

- `getTemplateById(id)` -> InvoiceTemplateOutput
  - With joined categoryName
  - Throw NOT_FOUND if missing

- `createTemplate(input)` -> InvoiceTemplateOutput
  - Validate categoryId exists
  - If isDefault=true, unset any existing default first
  - Insert and return with joined categoryName

- `updateTemplate(input)` -> InvoiceTemplateOutput
  - Check exists
  - If setting isDefault=true, unset previous default
  - Update and return

- `deleteTemplate(id)` -> { success: boolean }
  - Check exists
  - Hard delete

- `setDefault(id)` -> InvoiceTemplateOutput
  - Unset all other defaults (UPDATE SET isDefault=false)
  - Set this template as default
  - Return updated template

**Generation Methods:**
- `generateInvoiceData(shipmentId, templateId?)` -> InvoiceDataOutput
  - If no templateId: find the default template (isDefault=true)
  - If no default exists: throw BAD_REQUEST "No invoice template configured"
  - Fetch shipment with all joined data (reuse ShipmentService.getById)
  - Build qrContent: `{BASE_URL}/track/{trackingNumber}`
  - Return structured data object combining template + shipment data

**Export Methods:**
- `exportShipmentsCsv(shipmentIds)` -> string (CSV content)
  - Fetch all shipments by IDs
  - Generate CSV with headers: Tracking#, Sender, Receiver, Route, Status, Weight, BasePrice, GST, Total, BookedAt
  - Return CSV string

- `exportShipmentsExcel(shipmentIds)` -> Buffer (XLSX content)
  - Same data as CSV but in Excel format
  - Use `xlsx` library
  - Return Buffer for download

---

## Step 5.2 - Invoice tRPC Routes
**Status: PENDING**

### File: `packages/trpc/server/routes/invoice/route.ts` - PENDING

All routes use `adminProcedure`:

```typescript
import { adminProcedure, router } from "../../trpc";

const TAGS = ["Invoices"];
const getPath = generatePath("/invoices");

invoiceRouter = router({
  // Categories
  listCategories:    adminProcedure  GET    /invoices/categories
  createCategory:    adminProcedure  POST   /invoices/categories
  deleteCategory:    adminProcedure  DELETE /invoices/categories/:id

  // Templates
  listTemplates:     adminProcedure  GET    /invoices/templates
  getTemplateById:   adminProcedure  GET    /invoices/templates/:id
  createTemplate:    adminProcedure  POST   /invoices/templates
  updateTemplate:    adminProcedure  PUT    /invoices/templates/:id
  deleteTemplate:    adminProcedure  DELETE /invoices/templates/:id
  setDefault:        adminProcedure  PUT    /invoices/templates/:id/default

  // Generation & Export
  generateInvoiceData:  adminProcedure  GET   /invoices/generate/:shipmentId
  exportCsv:            adminProcedure  POST  /invoices/export/csv
  exportExcel:          adminProcedure  POST  /invoices/export/excel
});
```

### Update `packages/trpc/server/services/index.ts` - PENDING
```typescript
import InvoiceService from "@repo/services/invoice";
export const invoiceService = new InvoiceService();
```

### Update `packages/trpc/server/index.ts` - PENDING
```typescript
import { invoiceRouter } from "./routes/invoice/route";
// Add to serverRouter:
invoices: invoiceRouter,
```

---

## Step 5.3 - New Dependencies
**Status: PENDING**

```bash
# In apps/web — for PDF rendering and QR codes
pnpm add @react-pdf/renderer qrcode
pnpm add -D @types/qrcode

# In packages/services — for Excel export
pnpm add xlsx
```

---

## Step 5.4 - Invoice PDF & QR Components
**Status: PENDING**

### File: `apps/web/components/invoice/invoice-pdf.tsx` - PENDING

React PDF document component using `@react-pdf/renderer`:
- Accepts `invoiceData` (output of `generateInvoiceData`)
- Renders an A4/custom-sized PDF document with:
  - **Header**: Company name, address, logo (from headerConfig)
  - **Shipment Info**: Tracking #, booked date, branch, status
  - **Sender/Receiver**: Two-column layout with name, phone, full address
  - **Details Table**: Product type, service type, mode, weight, declared value
  - **Billing Table**: Base price, GST breakdown (type, rate, amount), total amount
  - **QR Code**: Generated from `qrContent`, positioned per `qrPosition` setting
  - **Footer**: Terms text, disclaimer (from footerConfig)
- Respects template settings:
  - `colors` for text, borders, backgrounds
  - `typography` for font families and sizes
  - `visibleFields` to show/hide individual fields
  - `width`/`height` for page dimensions
  - `layout.orientation` and `layout.padding`

### File: `apps/web/components/invoice/invoice-preview.tsx` - PENDING

HTML preview component (mirrors PDF layout but renders as HTML):
- Used in the template builder for live preview
- Same layout structure as the PDF component
- Accepts same `invoiceData` props
- Uses sample/placeholder data when no real shipment is provided
- Styled with inline styles matching the template colors/typography
- Responsive within its container

### File: `apps/web/lib/invoice/qr.ts` - PENDING

QR code utility:
- `generateQRDataUrl(content: string): Promise<string>`
  - Uses `qrcode` library to generate QR as data URL (base64 PNG)
  - Used by both PDF renderer and HTML preview

---

## Step 5.5 - Invoice Template Builder Page
**Status: PENDING**

### File: `apps/web/app/(admin)/invoices/page.tsx` - PENDING

Full page replacing the placeholder. Two-panel layout:

**Left Panel — Template List:**
- Category tabs at top (dynamic from `invoices.listCategories`)
  - "All" tab + one tab per category
  - "Add Category" button (opens small dialog: name + description)
  - Category delete button on each tab (with confirmation)
- Template cards within the selected category
  - Each card shows: name, dimensions (W×H mm), default badge (star icon)
  - Click to select for editing
  - Delete button on each card
- "Create Template" button at bottom

**Right Panel — Template Editor (visible when a template is selected):**
- Tabbed form sections:
  - **Basic**: Name, Category (dropdown), Width (mm), Height (mm), Orientation
  - **QR Code**: Show QR (toggle), QR Position (select: 4 corners)
  - **Colors**: Primary, Secondary, Background, Text, Border (color input fields)
  - **Typography**: Heading Font, Heading Size, Base Font, Base Size
  - **Fields**: Checklist of toggles for each visible field
  - **Header**: Company Name, Address, Logo URL
  - **Footer**: Terms text, Disclaimer text
- "Set as Default" button
- "Save" button

### File: `apps/web/app/(admin)/invoices/_components/template-card.tsx` - PENDING

Card component for template list:
- Template name, dimensions, default badge
- Click handler, delete button

### File: `apps/web/app/(admin)/invoices/_components/template-editor.tsx` - PENDING

Form component for editing template:
- All form fields organized in tabs/sections
- Uses react-hook-form + zod
- Save handler calls `invoices.createTemplate` or `invoices.updateTemplate`

### File: `apps/web/app/(admin)/invoices/_components/category-dialog.tsx` - PENDING

Small dialog for creating a new category:
- Name input + Description textarea
- Create button

---

## Step 5.6 - Export Dropdown Component
**Status: PENDING**

### File: `apps/web/components/invoice/export-dropdown.tsx` - PENDING

Dropdown menu button with export options:
- "Download PDF" — calls `generateInvoiceData`, renders PDF via `@react-pdf/renderer`, triggers download
- "Export CSV" — calls `invoices.exportCsv`, triggers CSV file download
- "Export Excel" — calls `invoices.exportExcel`, triggers XLSX file download

Props:
- `shipmentId?: string` — for single shipment export
- `shipmentIds?: string[]` — for bulk export from list

Used in:
1. Shipment detail page (`/shipments/[id]`) — single shipment
2. Shipments list page (`/shipments`) — bulk export (future enhancement)

---

## Step 5.7 - Integration with Shipment Detail Page
**Status: PENDING**

### Update: `apps/web/app/(admin)/shipments/[id]/page.tsx` - PENDING

Add to the shipment detail page:
- "Print Invoice" button that opens the invoice in a new dialog/sheet
- Invoice template selector dropdown (if multiple templates exist)
- Uses `InvoicePreview` component for in-page display
- Uses `ExportDropdown` for PDF/CSV/Excel download
- PDF download uses `@react-pdf/renderer`'s `pdf()` function to generate blob and trigger download

---

## Step 5.8 - Seed Data for Invoice Templates
**Status: PENDING**

### File: `packages/database/seed/invoice-templates.ts` - PENDING

Seeds:
- 1 default category: "Standard"
- 1 default template: "Standard Invoice"
  - A4 portrait (210×297 mm)
  - QR enabled, bottom-right
  - Default colors (black text, white background, gray borders)
  - All visible fields enabled
  - Header: TPC India, address placeholder
  - Footer: standard terms text
  - isDefault: true

Idempotent: skip if categories table has records.

### Update `packages/database/package.json` - PENDING
Add script: `"db:seed:invoices": "dotenv -- tsx seed/invoice-templates.ts"`

---

## Step 5.9 - Build Verification
**Status: PENDING**

- Run `pnpm turbo build` to verify full compilation
- Run `pnpm db:seed:invoices` to populate default template
- Test category CRUD
- Test template CRUD + set default
- Test invoice data generation from a shipment
- Test PDF download
- Test CSV/Excel export
- Test invoice preview in template builder

---

## Deliverables Checklist

| # | Item | Status |
|---|------|--------|
| 1 | `services/invoice/model.ts` (Zod schemas for categories, templates, generation, export) | PENDING |
| 2 | `services/invoice/index.ts` (InvoiceService class) | PENDING |
| 3 | `trpc/server/routes/invoice/route.ts` (12 endpoints, all adminProcedure) | PENDING |
| 4 | Services + routes registered (index.ts updates) | PENDING |
| 5 | Install dependencies (@react-pdf/renderer, qrcode, xlsx) | PENDING |
| 6 | `components/invoice/invoice-pdf.tsx` (PDF renderer) | PENDING |
| 7 | `components/invoice/invoice-preview.tsx` (HTML preview) | PENDING |
| 8 | `lib/invoice/qr.ts` (QR code utility) | PENDING |
| 9 | Invoice template builder page (categories + templates + editor) | PENDING |
| 10 | Template card component | PENDING |
| 11 | Template editor component | PENDING |
| 12 | Category dialog component | PENDING |
| 13 | Export dropdown component (PDF/CSV/Excel) | PENDING |
| 14 | Shipment detail page integration (print invoice + export) | PENDING |
| 15 | `database/seed/invoice-templates.ts` + script | PENDING |
| 16 | Full build passes | PENDING |
