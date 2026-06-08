# Courier Service Management System - Detailed Analysis

## 1. Current Tech Stack & Architecture

| Layer | Technology |
|-------|-----------|
| **Monorepo** | Turborepo + pnpm workspaces |
| **Frontend** | Next.js 16.1, React 19, Tailwind CSS v4, shadcn/ui (Radix primitives) |
| **Backend** | Express 5 + tRPC v11 + trpc-to-openapi (REST + RPC dual endpoints) |
| **Database** | PostgreSQL 15 (Docker) + Drizzle ORM |
| **Validation** | Zod v4 |
| **State/Data Fetching** | TanStack React Query + tRPC React hooks |
| **Theming** | next-themes (light/dark), CSS variables via oklch |
| **Logging** | Winston |
| **Auth (current)** | Google OAuth2 (partial setup) |
| **API Docs** | Scalar (OpenAPI/Swagger) |
| **Build** | tsup (API), Next.js (Web) |
| **Charts** | Recharts (already installed) |

---

## 2. Established Folder Pattern (Strictly Followed)

```
courier/
├── apps/
│   ├── api/src/                    -> Express server, env, tRPC adapter
│   └── web/
│       ├── app/                    -> Next.js App Router pages
│       ├── components/ui/          -> shadcn/ui components
│       ├── hooks/                  -> Custom hooks
│       ├── lib/                    -> Utilities (cn, etc.)
│       ├── providers/              -> React context providers
│       └── trpc/                   -> tRPC client setup
├── packages/
│   ├── database/                   -> Drizzle schema, models, migrations
│   │   ├── models/                 -> Per-feature table definitions
│   │   ├── schema.ts              -> Barrel export for all models
│   │   ├── index.ts               -> DB connection + re-exports
│   │   ├── env.ts                 -> Zod-validated env
│   │   └── drizzle.config.ts      -> Drizzle Kit config
│   ├── services/                   -> Business logic layer (class-based)
│   │   ├── {feature}/index.ts     -> Service class
│   │   ├── {feature}/model.ts     -> Zod schemas for input/output
│   │   ├── clients/               -> External API clients
│   │   └── env.ts                 -> Zod-validated env
│   ├── trpc/
│   │   ├── server/
│   │   │   ├── routes/{feature}/route.ts  -> Feature router
│   │   │   ├── services/index.ts          -> Service instantiation
│   │   │   ├── utils/path-generator.ts    -> OpenAPI path helper
│   │   │   ├── trpc.ts                    -> Router/procedure exports
│   │   │   ├── context.ts                 -> Request context
│   │   │   ├── schema.ts                  -> Shared Zod schemas
│   │   │   └── index.ts                   -> Root router composition
│   │   └── client/index.ts                -> Type exports for frontend
│   ├── logger/                     -> Winston logger
│   ├── notification/               -> NEW: Notification package (adapter pattern)
│   ├── eslint-config/              -> Shared lint configs
│   └── typescript-config/          -> Shared tsconfigs
```

**Key Convention**: Each feature gets:
- A Drizzle model in `packages/database/models/{feature}.ts`
- A service class in `packages/services/{feature}/index.ts` with Zod models in `model.ts`
- A tRPC route in `packages/trpc/server/routes/{feature}/route.ts`
- Service instantiation in `packages/trpc/server/services/index.ts`

---

## 3. TPC India Business Context

Based on research of tpcindia.com:

- **30+ years** in Indian courier & cargo industry
- **Transport modes**: Air, Rail, Road (Surface)
- **Services**: Express, Premium, Priority, E-commerce, International
- **Tools**: Consignment tracking, PIN code verification, rate finder
- **Coverage**: Pan-India domestic + international
- **Operations**: Branch/franchise model across Indian cities

---

## 4. Detailed Feature Breakdown

---

### 4.1 Analytics Dashboard

**Purpose**: Central hub for actionable decision-making.

**Required KPIs:**

| KPI | Visualization | Description |
|-----|--------------|-------------|
| Total Shipments | Stat card | Today / this week / this month / all-time |
| New Orders Created | Stat card | Count of orders created today |
| Delivered Successfully | Stat card + % | Count + success rate percentage |
| In-Transit | Stat card | Currently moving shipments |
| Pending Pickups | Stat card | Booked but not picked up |
| Failed/Returned | Stat card | Deliveries that failed |
| Revenue | Stat card | Daily / weekly / monthly revenue |
| Avg Delivery Time | Stat card | Average hours/days to deliver |
| Order Growth Over Time | Line/Area chart | Orders plotted on timeline (daily/weekly/monthly) |
| Revenue Trend | Bar chart | Revenue over time periods |
| Shipments by Product Type | Donut chart | Distribution across product types |
| Shipments by Service Type | Donut chart | Distribution across service types |
| Shipments by Mode | Donut chart | Distribution across transport modes |
| Top Branches | Horizontal bar | Branches ranked by volume |
| Top Customers | Table | Customers ranked by shipment count |
| Recent Activities | Activity feed | Latest shipment creations, status changes |

**UI Layout:**
- Date range selector at the top (today, 7d, 30d, 90d, custom)
- KPI stat cards in a responsive grid (top section)
- Charts in a 2-column grid (middle section)
- Recent activity feed table at the bottom

---

### 4.2 Branches

**Purpose**: Manage company branches/offices.

**Database Model: `branches`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default random | |
| code | varchar(20) | unique, not null | e.g. "HO-MUM-001" |
| name | varchar(100) | not null | Branch name |
| type | varchar(30) | not null | "Head Office", "Regional Office", "Franchise", "Collection Center" |
| city | varchar(100) | not null | |
| state | varchar(100) | not null | |
| address | text | | Full street address |
| pincode | varchar(6) | | |
| latitude | decimal(10,7) | nullable | Optional geolocation |
| longitude | decimal(10,7) | nullable | Optional geolocation |
| contactPhone | varchar(15) | | |
| contactEmail | varchar(255) | | |
| isActive | boolean | default true | Active/Inactive status |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | on update | |

**Branch Types (enum-like values):**
- Head Office
- Regional Office
- Franchise
- Collection Center
- Hub

**UI:**
- Table view with search, filter by type and status
- Create/Edit modal or sheet
- Toggle active/inactive directly from table
- Optional: Map view showing branch locations

---

### 4.3 Customers

**Purpose**: Full customer lifecycle management with individual analytics.

**Database Model: `customers`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default random | |
| fullName | varchar(100) | not null | |
| phone | varchar(15) | not null | Primary contact |
| email | varchar(255) | nullable | |
| address | text | not null | |
| city | varchar(100) | not null | |
| state | varchar(100) | not null | |
| pincode | varchar(6) | not null | |
| idProofType | varchar(20) | not null | "PAN", "AADHAAR", "VOTER_ID", "DRIVING_LICENSE", "PASSPORT" |
| idProofNumber | varchar(50) | not null | ID document number |
| idProofImageUrl | text | nullable | Uploaded photo of ID proof |
| isActive | boolean | default true | |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | on update | |

**ID Proof Types:**
- PAN Card
- Aadhaar Card
- Voter ID Card
- Driving License
- Passport

### 4.3.1 Smart ID Proof OCR - Auto-Fill Customer Data (Admin Flow)

**Purpose**: When an admin onboards a customer, they upload an image of any supported ID proof. The system automatically extracts text via OCR, parses structured fields (name, ID number, DOB, address, gender), and pre-fills the customer creation form. The admin reviews, corrects if needed, and submits.

**Why OCR instead of Government APIs:**
Indian government verification APIs (UIDAI eKYC, NSDL PAN Verify, DigiLocker) all require:
- Authorized User Agency (AUA) registration with UIDAI (for Aadhaar)
- Licensed access agreements and compliance audits
- Per-transaction fees (Aadhaar eKYC: INR 0.50-20 per call)
- STQC-certified biometric devices (for Aadhaar auth)

None of these are free for commercial use. For an MVP, **client-side OCR using Tesseract.js** is the ideal zero-cost approach.

**Technology Stack:**
- **Tesseract.js** (v5+) - Free, open-source OCR engine running in the browser
  - Supports English (`eng`) and Hindi (`hin`) languages (covers all Indian IDs)
  - Runs entirely client-side (no server cost, no API keys)
  - ~2-5 seconds per image on modern browsers
- **Custom regex parsers** per ID type to extract structured fields from raw OCR text

**Extractable Fields Per ID Type:**

| ID Type | Fields Extracted via OCR |
|---------|------------------------|
| **Aadhaar** | Full Name, Aadhaar Number (XXXX XXXX XXXX), DOB, Gender, Address (partial) |
| **PAN** | Full Name, PAN Number (ABCDE1234F), Father's Name, DOB |
| **Voter ID** | Full Name, Voter ID Number (e.g. ABC1234567), Father's Name, Address, Age/DOB |
| **Driving License** | Full Name, DL Number (e.g. MH-01-2020-XXXXXXX), DOB, Address, Blood Group |
| **Passport** | Full Name, Passport Number (e.g. A1234567), DOB, Place of Issue |

**OCR Pipeline:**
1. Admin uploads ID image (JPEG/PNG) via file input
2. Client-side image pre-processing (optional: contrast enhancement, grayscale conversion for better OCR accuracy)
3. Tesseract.js worker processes image with `eng+hin` language pack
4. Raw OCR text passed to ID-type-specific parser
5. Parser uses regex patterns to extract structured data:
   - Aadhaar: `/\d{4}\s\d{4}\s\d{4}/` for number, name after "Name" or specific line positions
   - PAN: `/[A-Z]{5}[0-9]{4}[A-Z]/` for PAN number
   - Voter ID: `/[A-Z]{3}[0-9]{7}/` for voter ID number
   - DL: `/[A-Z]{2}[-\s]?\d{2}[-\s]?\d{4}[-\s]?\d{7}/` for DL number
   - Passport: `/[A-Z]\d{7}/` for passport number
6. Extracted data pre-fills the form fields
7. Admin reviews, corrects any OCR errors, fills remaining fields (phone, email)
8. Admin submits to create customer

**Accuracy Notes:**
- Printed text on cards: 85-95% accuracy
- Clear, well-lit photos: best results
- Handwritten text or damaged cards: lower accuracy, admin manually corrects
- The admin review step is critical - OCR is an assist, not a replacement

**Two Onboarding Flows:**

| Flow | Who | How |
|------|-----|-----|
| **Admin Onboarding** | Admin creates customer | Upload ID image -> OCR auto-fills -> Admin reviews & corrects -> Submit |
| **Customer Self-Registration** | Customer creates own account | Manual form fill (all fields required) -> Upload ID image as proof -> Submit |

**Customer Detail Page Features:**
1. **Profile Card** - Name, contact, address, ID proof badge with verified indicator
2. **Shipment History Table** - Paginated, sortable, filterable table of all shipments
3. **Live Tracking** - For any currently active shipment, show real-time status timeline
4. **Analytics Section:**
   - Total shipments sent/received
   - Average delivery time for their shipments
   - Total spend
   - Shipment frequency (monthly trend)
   - Success rate (delivered vs returned)
5. **Filters**: Date range, status, product type

---

### 4.4 Destinations (Serviceability Master)

**Purpose**: Control which locations the company services.

**Database Model: `destinations`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default random | |
| state | varchar(100) | not null | Indian state / UT |
| city | varchar(100) | not null | |
| pincode | varchar(6) | not null, unique | |
| isServiceable | boolean | default true | Toggle |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | on update | |

**UI:**
- Data table with columns: State | City | Pincode | Serviceable (toggle switch)
- Filter bar above table:
  - State dropdown (multi-select)
  - City search input
  - Pincode input
  - Serviceable filter (All / Yes / No)
- Bulk toggle serviceability by state
- Pagination with configurable page size

**Data Note**: India has ~19,000 PIN codes across 28 states + 8 UTs. Seed data can be sourced from India Post PIN code directory.

---

### 4.5 Shipments

**Purpose**: Core module for creating and managing shipments.

**Database Model: `shipments`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default random | |
| trackingNumber | varchar(30) | unique, not null | Auto-generated (e.g. TPC-MUM-240001) |
| branchId | uuid | FK -> branches | Originating branch |
| senderId | uuid | FK -> customers | |
| receiverId | uuid | FK -> customers | |
| senderAddress | jsonb | not null | Snapshot at booking time |
| receiverAddress | jsonb | not null | Snapshot at booking time |
| productTypeId | uuid | FK -> product_types | |
| serviceTypeId | uuid | FK -> service_types | |
| modeTypeId | uuid | FK -> mode_types | |
| weight | decimal(10,3) | not null | In kg |
| declaredValue | decimal(12,2) | not null | Value in INR |
| basePrice | decimal(12,2) | not null | From pricing engine |
| gstEnabled | boolean | default true | |
| gstType | varchar(10) | nullable | "IGST" or "CGST_SGST" (null if GST disabled) |
| gstRate | decimal(5,2) | | GST percentage applied |
| gstAmount | decimal(12,2) | | Calculated GST |
| totalAmount | decimal(12,2) | not null | Final billed amount |
| status | varchar(20) | not null, default "BOOKED" | Current status |
| invoiceTemplateId | uuid | FK -> invoice_templates, nullable | Selected invoice template |
| bookedAt | timestamp | default now | |
| deliveredAt | timestamp | nullable | |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | on update | |

**Shipment Statuses:**
- BOOKED
- PICKED_UP
- IN_TRANSIT
- OUT_FOR_DELIVERY
- DELIVERED
- RETURNED
- CANCELLED

**Database Model: `shipment_tracking_history`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default random | |
| shipmentId | uuid | FK -> shipments | |
| status | varchar(20) | not null | Status at this point |
| location | varchar(200) | | Location/branch at this point |
| remarks | text | nullable | Optional notes |
| timestamp | timestamp | default now | When this status was recorded |

**Shipment Creation Flow (Step-by-step):**
1. Select branch from dropdown
2. Search/select sender from customers
3. Search/select receiver from customers
4. Choose product type, service type, mode of transport
5. Enter weight (kg) and declared value (INR)
6. **Live Billing Panel** (auto-updates as inputs change):
   - Base Price = pricing engine lookup (weight x unitPrice)
   - GST Toggle (on/off)
   - If GST on: select split type
     - IGST (single line)
     - CGST + SGST (split 50/50)
   - GST Amount = basePrice x gstRate
   - **Total = basePrice + gstAmount**
7. Submit -> generates tracking number -> creates shipment record
8. Auto-generates invoice with option to select template
9. Sends notification (SMS/Email/WhatsApp based on config)

---

### 4.6 Invoice System

**Purpose**: Fully customizable invoice template builder and generator.

**Database Model: `invoice_templates`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default random | |
| name | varchar(100) | not null | Template name |
| category | varchar(50) | not null | Dynamic category (user-created) |
| width | integer | not null | Width in mm |
| height | integer | not null | Height in mm |
| showQR | boolean | default true | Whether to include QR code |
| qrPosition | varchar(20) | nullable | "top-left", "top-right", "bottom-left", "bottom-right" |
| layout | jsonb | not null | Full layout config (field positions, sections) |
| colors | jsonb | not null | { primary, secondary, background, text, border } |
| typography | jsonb | not null | { headingFont, headingSize, baseFont, baseSize, lineHeight } |
| visibleFields | jsonb | not null | Array of shipment fields to display |
| headerConfig | jsonb | | Company logo, name, address placement |
| footerConfig | jsonb | | Footer text, terms & conditions |
| isDefault | boolean | default false | Default template flag |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | on update | |

**Database Model: `invoice_categories`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default random | |
| name | varchar(50) | unique, not null | Category name |
| description | text | nullable | |
| createdAt | timestamp | default now | |

**Customization Options:**
- Dimensions: height x width (mm)
- QR Code: show/hide, position (4 corners)
- Colors: primary, secondary, background, text, border
- Typography: heading font + size, base font + size
- Visible Fields: toggle which shipment fields appear (tracking number, sender, receiver, weight, value, price breakdown, dates, etc.)
- Layout: section ordering and arrangement
- Header: company logo, name, address
- Footer: terms, disclaimers

**Export Options:**
- PDF (primary, for printing)
- CSV (data export)
- Excel / XLSX (data export)

**QR Code Content**: Encodes URL `{APP_URL}/track/{trackingNumber}` -> public tracking page.

---

### 4.7 Dual UI System (Client vs End-User)

**Purpose**: Separate interfaces for company operators and customers.

| Aspect | Client (Company/Admin) | End-User (Customer Portal) |
|--------|----------------------|---------------------------|
| **Access** | Full management dashboard | Limited self-service |
| **Features** | All CRUD, analytics, settings, pricing config, invoice builder | Track shipment, view history, profile |
| **Navigation** | Collapsible sidebar with all modules | Simple top navigation bar |
| **Auth** | Admin login with role-based access | Customer login via phone/email |
| **Complexity** | Power-user interface with data-dense tables | Minimal, task-focused interface |

**Next.js App Router Implementation:**
```
app/
├── (public)/               -> Landing page, QR tracking page
│   ├── page.tsx            -> Landing page
│   └── track/[id]/page.tsx -> Public shipment tracking
├── (admin)/                -> Company dashboard (protected)
│   ├── layout.tsx          -> Sidebar layout
│   ├── dashboard/
│   ├── shipments/
│   ├── customers/
│   ├── branches/
│   ├── destinations/
│   ├── pricing/
│   ├── invoices/
│   ├── product-types/
│   ├── service-types/
│   ├── mode-types/
│   └── settings/
│       └── notifications/  -> Notification provider config
└── (customer)/             -> Customer portal (protected)
    ├── layout.tsx          -> Top nav layout
    ├── track/
    ├── shipments/
    └── profile/
```

---

### 4.8 Dynamic Pricing Engine

**Purpose**: Calculate shipment cost based on route, product, service, and mode.

**Database Model: `pricing_rules`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default random | |
| originState | varchar(100) | not null | |
| originCity | varchar(100) | nullable | Null = all cities in state |
| destinationState | varchar(100) | not null | |
| destinationCity | varchar(100) | nullable | Null = all cities in state |
| productTypeId | uuid | FK -> product_types | |
| serviceTypeId | uuid | FK -> service_types | |
| modeTypeId | uuid | FK -> mode_types | |
| unitPrice | decimal(10,2) | not null | Price per kg (INR) |
| minimumCharge | decimal(10,2) | default 0 | Floor price regardless of weight |
| isActive | boolean | default true | |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | on update | |

**Price Calculation Formula:**
```
1. Lookup matching pricing_rule by: origin, destination, productType, serviceType, modeType
2. basePrice = max(weight * unitPrice, minimumCharge)
3. If GST enabled:
   a. If origin state == destination state:
      - gstType = "CGST_SGST"
      - CGST = basePrice * 9%
      - SGST = basePrice * 9%
      - gstAmount = CGST + SGST (= 18%)
   b. If origin state != destination state:
      - gstType = "IGST"
      - gstAmount = basePrice * 18%
4. totalAmount = basePrice + gstAmount
```

**Rule Matching Priority (most specific wins):**
1. Exact city-to-city match
2. City-to-state match (destination city null)
3. State-to-city match (origin city null)
4. State-to-state match (both cities null)

---

### 4.9 QR-Based Public Tracking Page

**Route**: `/track/{trackingNumber}` (no authentication required)

**Page Content:**
- Company header/branding
- Shipment summary card:
  - Tracking number
  - From (city, state) -> To (city, state)
  - Weight, product type, service type
  - Booked date, expected delivery
- **Status Timeline** (vertical stepper):
  - Each step: status label, location, timestamp, remarks
  - Current step highlighted
  - Future steps grayed out
- Current status badge prominently displayed

---

### 4.10 Dynamic Shipment Price Page (Admin)

**Purpose**: Master configuration page for pricing rules.

**UI:**
- Filterable data table showing all pricing rules
- Columns: Origin (State/City) | Destination (State/City) | Product Type | Service Type | Mode | Unit Price (per kg) | Min Charge | Active
- Filters: origin state/city, destination state/city, product type, service type, mode type
- CRUD: Create new rule, edit inline or via modal, delete with confirmation
- Duplicate rule action for quick creation of similar rules

---

### 4.11 Product Types

**Purpose**: Manage categories of items that can be shipped.

**Database Model: `product_types`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default random | |
| name | varchar(50) | unique, not null | |
| description | text | nullable | |
| isActive | boolean | default true | |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | on update | |

**Default Product Types:**
- Documents
- Parcel
- Fragile
- Electronics
- Liquid
- Perishable
- Heavy Goods
- Bulk Cargo

**Analytics KPIs (filtered by product type):**
- Total shipments for this product type
- Revenue generated
- Average delivery time
- Growth trend (line chart)
- Top customers using this product type
- Success rate (delivered vs returned)

---

### 4.12 Service Types

**Purpose**: Manage delivery speed/priority tiers.

**Database Model: `service_types`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default random | |
| name | varchar(50) | unique, not null | |
| description | text | nullable | |
| isActive | boolean | default true | |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | on update | |

**Default Service Types:**
- Standard
- Express
- Same-Day
- Next-Day
- Economy
- Priority

**Analytics KPIs (filtered by service type):**
- Total shipments by service type
- Revenue contribution
- Avg transit time vs SLA target
- Volume trend over time
- Distribution across branches

---

### 4.13 Mode Types

**Purpose**: Manage transport mode options.

**Database Model: `mode_types`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default random | |
| name | varchar(50) | unique, not null | |
| description | text | nullable | |
| isActive | boolean | default true | |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | on update | |

**Default Mode Types:**
- Air
- Rail
- Road (Surface)
- Multimodal

**Analytics KPIs (filtered by mode type):**
- Total shipments by mode
- Cost efficiency per mode
- Avg transit time per mode
- Mode utilization trend
- Revenue by mode

---

## 5. Notification System (packages/notification)

### 5.1 Overview

A standalone package at `packages/notification/` implementing the **Adapter + Factory pattern** for multi-channel, multi-provider notification delivery. The system supports three notification channels (Email, SMS, WhatsApp), each with multiple swappable providers. Admins configure which channels are active and which provider to use per channel.

### 5.2 Architecture Diagram

```
                    NotificationService
                           |
            +--------------+--------------+
            |              |              |
      EmailFactory    SmsFactory    WhatsAppFactory
            |              |              |
    +-----------+    +-----------+   +-----------+
    | Provider  |    | Provider  |   | Provider  |
    | Adapter   |    | Adapter   |   | Adapter   |
    +-----------+    +-----------+   +-----------+
         |               |               |
    [Resend]         [Twilio]       [Twilio WA]
    [SendGrid]       [MSG91]        [Gupshup]
    [AWS SES]        [AWS SNS]      [WA Business API]
    [SMTP]           [Textlocal]
```

### 5.3 Core Design - Adapter Pattern

**Base Notification Adapter (Abstract Generic Class):**

```
NotificationAdapter<TPayload, TResult>
├── Properties:
│   ├── channel: NotificationChannel ("email" | "sms" | "whatsapp")
│   └── providerName: string
├── Abstract Methods:
│   ├── send(payload: TPayload): Promise<TResult>
│   ├── sendBulk(payloads: TPayload[]): Promise<TResult[]>
│   ├── validateRecipient(recipient: string): boolean
│   └── healthCheck(): Promise<boolean>
└── Concrete Methods:
    └── getChannel(): NotificationChannel
    └── getProviderName(): string
```

This base class is generic so each channel can define its own payload shape and result shape while sharing the common contract.

### 5.4 Channel-Specific Payload Types

**Email Payload:**
```typescript
{
  to: string;             // recipient email
  subject: string;
  body: string;           // HTML body
  textBody?: string;      // plain text fallback
  from?: string;          // sender override
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{ filename: string; content: Buffer; mimeType: string }>;
}
```

**SMS Payload:**
```typescript
{
  to: string;             // phone number with country code
  message: string;        // text content (max ~160 chars for single SMS)
  templateId?: string;    // DLT template ID (required in India)
  senderId?: string;      // sender ID override
}
```

**WhatsApp Payload:**
```typescript
{
  to: string;             // phone number with country code
  templateName: string;   // pre-approved WhatsApp template name
  templateLanguage: string;
  templateParams: string[];  // dynamic values for template placeholders
  mediaUrl?: string;      // optional media attachment
}
```

**Notification Result:**
```typescript
{
  success: boolean;
  messageId?: string;     // provider's message ID
  channel: NotificationChannel;
  provider: string;
  error?: string;
  timestamp: Date;
}
```

### 5.5 Provider Adapters (Factory Implementations)

#### Email Provider Adapters

| Provider | Adapter Class | NPM Package | Notes |
|----------|--------------|-------------|-------|
| Resend | ResendEmailAdapter | `resend` | Modern, developer-friendly |
| SendGrid | SendGridEmailAdapter | `@sendgrid/mail` | Enterprise-grade |
| AWS SES | AwsSesEmailAdapter | `@aws-sdk/client-ses` | Cost-effective at scale |
| SMTP (Generic) | SmtpEmailAdapter | `nodemailer` | Self-hosted / any SMTP server |

All implement `NotificationAdapter<EmailPayload, NotificationResult>`.

#### SMS Provider Adapters

| Provider | Adapter Class | NPM Package | Notes |
|----------|--------------|-------------|-------|
| Twilio | TwilioSmsAdapter | `twilio` | Global coverage |
| MSG91 | Msg91SmsAdapter | HTTP API (fetch) | India-focused, DLT compliant |
| AWS SNS | AwsSnsSmsAdapter | `@aws-sdk/client-sns` | Scalable |
| Textlocal | TextlocalSmsAdapter | HTTP API (fetch) | India-focused, affordable |

All implement `NotificationAdapter<SmsPayload, NotificationResult>`.

#### WhatsApp Provider Adapters

| Provider | Adapter Class | NPM Package | Notes |
|----------|--------------|-------------|-------|
| Twilio WhatsApp | TwilioWhatsAppAdapter | `twilio` | Easy setup via Twilio |
| Gupshup | GupshupWhatsAppAdapter | HTTP API (fetch) | India-focused, popular |
| Meta WA Business API | MetaWhatsAppAdapter | HTTP API (fetch) | Direct Meta integration |

All implement `NotificationAdapter<WhatsAppPayload, NotificationResult>`.

### 5.6 Factory Classes

Each channel has a factory that creates the correct provider adapter based on configuration:

**EmailNotificationFactory:**
```
createAdapter(provider: "resend" | "sendgrid" | "aws_ses" | "smtp", config: ProviderConfig): NotificationAdapter<EmailPayload, NotificationResult>
```

**SmsNotificationFactory:**
```
createAdapter(provider: "twilio" | "msg91" | "aws_sns" | "textlocal", config: ProviderConfig): NotificationAdapter<SmsPayload, NotificationResult>
```

**WhatsAppNotificationFactory:**
```
createAdapter(provider: "twilio" | "gupshup" | "meta", config: ProviderConfig): NotificationAdapter<WhatsAppPayload, NotificationResult>
```

Each factory:
- Accepts a provider name and its credentials/config
- Returns the instantiated adapter
- Throws if the provider is unknown

### 5.7 NotificationService (Orchestrator)

The top-level service class that the rest of the application calls. It reads the admin configuration from the database to determine which channels are active and which provider each channel uses.

```
NotificationService
├── sendShipmentBooked(shipment, sender, receiver)
├── sendStatusUpdate(shipment, newStatus)
├── sendDeliveryConfirmation(shipment)
├── send(channel, payload)              -> send on a specific channel
├── sendMultiChannel(channels[], payloads)  -> send on multiple channels
└── Private:
    ├── getActiveChannels(): NotificationChannel[]
    ├── getAdapterForChannel(channel): NotificationAdapter
    └── loadConfiguration(): NotificationConfig
```

**Behavior:**
1. Admin configures: "Send via Email (Resend) + SMS (MSG91)"
2. On shipment creation, `NotificationService.sendShipmentBooked()` is called
3. Service loads config from DB -> sees email + SMS are active
4. Uses `EmailNotificationFactory.createAdapter("resend", resendConfig)` to get email adapter
5. Uses `SmsNotificationFactory.createAdapter("msg91", msg91Config)` to get SMS adapter
6. Calls `.send()` on both adapters concurrently
7. Returns combined results

### 5.8 Notification Configuration (Database)

**Database Model: `notification_configs`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default random | |
| channel | varchar(20) | not null | "email", "sms", "whatsapp" |
| provider | varchar(30) | not null | Provider identifier |
| isActive | boolean | default false | Is this channel active? |
| credentials | jsonb | not null | Encrypted provider credentials |
| settings | jsonb | nullable | Additional settings (sender ID, from address, etc.) |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | on update | |

**Unique constraint**: One active provider per channel (channel + isActive).

**Database Model: `notification_events`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default random | |
| eventType | varchar(30) | not null | "SHIPMENT_BOOKED", "STATUS_UPDATE", "DELIVERED" |
| channel | varchar(20) | not null | |
| provider | varchar(30) | not null | |
| recipient | varchar(255) | not null | Email/phone |
| status | varchar(20) | not null | "SENT", "FAILED", "DELIVERED" |
| messageId | varchar(255) | nullable | Provider message ID |
| error | text | nullable | Error message if failed |
| sentAt | timestamp | default now | |

### 5.9 Notification Package Folder Structure

```
packages/notification/
├── package.json
├── env.ts                              -> Zod-validated env
├── index.ts                            -> Barrel exports
├── types.ts                            -> All shared types and interfaces
├── adapter.ts                          -> Abstract NotificationAdapter base class
├── service.ts                          -> NotificationService orchestrator
├── channels/
│   ├── email/
│   │   ├── factory.ts                  -> EmailNotificationFactory
│   │   ├── types.ts                    -> EmailPayload, EmailConfig
│   │   └── providers/
│   │       ├── resend.ts               -> ResendEmailAdapter
│   │       ├── sendgrid.ts             -> SendGridEmailAdapter
│   │       ├── aws-ses.ts              -> AwsSesEmailAdapter
│   │       └── smtp.ts                 -> SmtpEmailAdapter
│   ├── sms/
│   │   ├── factory.ts                  -> SmsNotificationFactory
│   │   ├── types.ts                    -> SmsPayload, SmsConfig
│   │   └── providers/
│   │       ├── twilio.ts               -> TwilioSmsAdapter
│   │       ├── msg91.ts                -> Msg91SmsAdapter
│   │       ├── aws-sns.ts              -> AwsSnsSmsAdapter
│   │       └── textlocal.ts            -> TextlocalSmsAdapter
│   └── whatsapp/
│       ├── factory.ts                  -> WhatsAppNotificationFactory
│       ├── types.ts                    -> WhatsAppPayload, WhatsAppConfig
│       └── providers/
│           ├── twilio.ts               -> TwilioWhatsAppAdapter
│           ├── gupshup.ts              -> GupshupWhatsAppAdapter
│           └── meta.ts                 -> MetaWhatsAppAdapter
└── templates/
    ├── shipment-booked.ts              -> Template for booking confirmation
    ├── status-update.ts                -> Template for status change
    └── delivery-confirmation.ts        -> Template for delivery complete
```

### 5.10 Notification Triggers in Shipment Lifecycle

| Event | Recipient | Channels | Content |
|-------|-----------|----------|---------|
| Shipment Booked | Sender + Receiver | Email, SMS, WhatsApp | Tracking number, booking details, estimated delivery |
| Status Update (Picked Up, In Transit, Out for Delivery) | Receiver | SMS, WhatsApp | Current status, tracking link |
| Delivered | Sender + Receiver | Email, SMS, WhatsApp | Delivery confirmation, POD link |
| Returned / Failed | Sender | Email, SMS | Reason for failure, next steps |

### 5.11 Admin Notification Settings UI

Located at `(admin)/settings/notifications/`:
- Card per channel (Email, SMS, WhatsApp)
- Each card shows:
  - Active/Inactive toggle
  - Provider dropdown (lists available providers for that channel)
  - Credential fields (API key, secret, etc.) - masked input
  - Test button to send a test notification
  - Save button
- Notification event toggles: which events trigger notifications

---

## 6. tRPC Route Structure

```
serverRouter
├── health              -> getHealth
├── auth                -> getSupportedAuthenticationProviders
├── dashboard           -> getOverview, getRecentActivities, getOrderTrend, getRevenueByPeriod
├── branches            -> list, getById, create, update, delete
├── customers           -> list, getById, create, update, delete, getAnalytics, getShipments
├── destinations        -> list, update (toggle serviceability), bulkUpdate
├── shipments           -> list, getById, create, updateStatus, getTracking, getByCustomer
├── invoices
│   ├── templates       -> list, getById, create, update, delete, setDefault
│   ├── categories      -> list, create, delete
│   └── generate        -> generatePdf, exportCsv, exportExcel
├── pricing             -> list, getById, create, update, delete, calculate
├── productTypes        -> list, getById, create, update, delete, getAnalytics
├── serviceTypes        -> list, getById, create, update, delete, getAnalytics
├── modeTypes           -> list, getById, create, update, delete, getAnalytics
├── notifications
│   ├── config          -> getAll, update, testChannel
│   └── logs            -> list (notification history)
└── tracking            -> getByTrackingNumber (public, no auth)
```

---

## 7. UX & Navigation Plan

### 7.1 Admin Sidebar Navigation

```
Dashboard
Shipments
  - All Shipments
  - Create New
Customers
Branches
Destinations
Pricing Rules
Invoice Templates
Masters
  - Product Types
  - Service Types
  - Mode Types
Settings
  - Notifications
  - General
```

### 7.2 Customer Portal Top Navigation

```
[Logo]  Track Shipment   My Shipments   Profile   [Logout]
```

### 7.3 Landing Page Structure (Public)

1. **Hero Section** - Company tagline + dual CTA ("Track Shipment" / "Login")
2. **Services Section** - Cards showcasing service types
3. **Coverage Section** - Network reach stats or map
4. **How It Works** - 3-step visual flow (Book -> Ship -> Deliver)
5. **Track Your Shipment** - Prominent input field for tracking number
6. **Footer** - Contact info, quick links, address

---

## 8. Color Scheme (No Purple)

**Primary Palette:**
- **Primary**: Deep Blue - trust, professionalism (oklch-based, ~hue 250)
- **Accent**: Warm Orange - speed, energy, action (oklch-based, ~hue 55)
- **Success**: Green - delivered, active statuses
- **Warning**: Amber - pending, attention states
- **Destructive**: Red - errors, cancellations
- **Neutrals**: Gray scale for backgrounds, borders, text

Both light and dark mode supported via existing CSS variable system.

---

## 9. Database Entity Relationship Summary

```
branches ─────────── shipments ─────────── customers (sender)
                        |                      |
                        ├── customers (receiver)
                        |
                        ├── product_types
                        ├── service_types
                        ├── mode_types
                        ├── invoice_templates ── invoice_categories
                        └── shipment_tracking_history

pricing_rules ──┬── product_types
                ├── service_types
                └── mode_types

destinations (standalone serviceability master)

notification_configs (standalone, admin-managed)
notification_events (log of all sent notifications)
```

---

## 10. Additional Industry Features Included

| Feature | Description |
|---------|-------------|
| **Tracking Number Format** | Branch-prefix + serial: TPC-{BRANCH_CODE}-{YYMMDD}-{SEQ} |
| **Address Snapshot** | Sender/receiver addresses stored as JSONB at booking time to preserve history |
| **GST Auto-Detection** | IGST vs CGST+SGST automatically determined by origin/destination state match |
| **Pricing Rule Fallback** | Most-specific rule wins (city>state) with graceful fallback |
| **Notification Audit Log** | Every notification attempt logged with status, provider, and error details |
| **Multi-Provider Resilience** | If one provider fails, admin can switch providers without code changes |
| **DLT Compliance** | SMS templates support DLT template IDs (mandatory for Indian SMS) |
| **WhatsApp Template System** | Pre-approved templates with dynamic parameters (Meta/WhatsApp policy) |
