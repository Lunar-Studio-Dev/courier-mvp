# Phase 7: Notification System

## Status: DONE

## Prerequisites
- **Phase 4 must be completed first.** Notifications fire on shipment lifecycle events (create, status update, delivery).

## Goal
Build a multi-channel notification system using the Adapter + Factory pattern. Support Email (4 providers), SMS (4 providers), and WhatsApp (3 providers) with DB-driven configuration, notification templates, event logging, shipment lifecycle integration, and an admin settings UI.

---

## Current State Analysis

### Already Implemented
- **Database tables** (`packages/database/models/notification.ts`):
  - `notification_configs` — channel, provider, isActive, credentials (jsonb), settings (jsonb), timestamps
  - `notification_events` — eventType, channel, provider, recipient, status, messageId, error, sentAt
- **Schema exported** in `packages/database/schema.ts`

### Missing (All New)
1. `packages/notification/` package — core adapter, factories, provider implementations, templates, orchestrator
2. `packages/services/notification/` — NotificationConfigService (CRUD for configs + event log)
3. `packages/trpc/server/routes/notification/` — tRPC routes for admin config management
4. Shipment lifecycle integration — fire-and-forget notifications on create/statusUpdate
5. Admin UI — notification settings page at `(admin)/settings/notifications/`

---

## Step 7.1 - Package Setup & Core Types
**Status: PENDING**

### Create: `packages/notification/package.json`

```json
{
  "name": "@repo/notification",
  "version": "1.0.0",
  "private": true,
  "main": "index.ts",
  "dependencies": {
    "@repo/database": "workspace:*",
    "zod": "^4.3.5"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "typescript": "^5.9.3"
  }
}
```

Provider SDK packages (resend, twilio, nodemailer, @sendgrid/mail, @aws-sdk/*, etc.) are added only when a provider is actually implemented. For MVP, implement **one provider per channel** with real SDK, and stub the others.

### Create: `packages/notification/tsconfig.json`
Extend from `@repo/typescript-config/base.json`.

### Create: `packages/notification/types.ts`

Define all shared types:
- `NotificationChannel` = `"email" | "sms" | "whatsapp"`
- `NotificationResult` = `{ success: boolean; messageId?: string; channel: NotificationChannel; provider: string; error?: string; timestamp: Date }`
- `EmailPayload` = `{ to: string; subject: string; body: string; textBody?: string; from?: string; replyTo?: string }`
- `SmsPayload` = `{ to: string; message: string; templateId?: string; senderId?: string }`
- `WhatsAppPayload` = `{ to: string; templateName: string; templateLanguage: string; templateParams: string[]; mediaUrl?: string }`
- `ProviderConfig` = `{ credentials: Record<string, string>; settings?: Record<string, string> }`

### Create: `packages/notification/adapter.ts`

Abstract base class:
```typescript
abstract class NotificationAdapter<TPayload, TResult> {
  protected channel: NotificationChannel;
  protected providerName: string;

  constructor(channel: NotificationChannel, providerName: string);

  abstract send(payload: TPayload): Promise<TResult>;
  abstract sendBulk(payloads: TPayload[]): Promise<TResult[]>;
  abstract validateRecipient(recipient: string): boolean;
  abstract healthCheck(): Promise<boolean>;

  getChannel(): NotificationChannel;
  getProviderName(): string;
}
```

### Run: `pnpm install` from monorepo root to link the new workspace package.

---

## Step 7.2 - Email Channel (MVP: Resend + SMTP)
**Status: PENDING**

### Create: `packages/notification/channels/email/types.ts`
Re-export `EmailPayload` from `../../types`. Define provider-specific config shapes if needed.

### Create: `packages/notification/channels/email/providers/resend.ts`
- Class `ResendEmailAdapter extends NotificationAdapter<EmailPayload, NotificationResult>`
- Install `resend` package: `pnpm --filter @repo/notification add resend`
- Constructor takes `{ apiKey: string }`
- `send()`: call `resend.emails.send()`
- `validateRecipient()`: basic email regex
- `healthCheck()`: try listing domains or sending a test
- `sendBulk()`: map over payloads, call send() for each (Resend batch API optional)

### Create: `packages/notification/channels/email/providers/smtp.ts`
- Class `SmtpEmailAdapter extends NotificationAdapter<EmailPayload, NotificationResult>`
- Install `nodemailer` + `@types/nodemailer`: `pnpm --filter @repo/notification add nodemailer` + devDep for types
- Constructor takes `{ host, port, secure, user, pass, from }`
- `send()`: create transporter, call `transporter.sendMail()`
- `validateRecipient()`: email regex
- `healthCheck()`: `transporter.verify()`

### Create: `packages/notification/channels/email/providers/sendgrid.ts`
- Stub implementation: throws "SendGrid adapter not configured — install @sendgrid/mail and configure"
- Implements the interface but all methods throw with a helpful message
- Can be fully implemented later by installing `@sendgrid/mail`

### Create: `packages/notification/channels/email/providers/aws-ses.ts`
- Stub implementation (same pattern as SendGrid stub)

### Create: `packages/notification/channels/email/factory.ts`
```typescript
class EmailNotificationFactory {
  static createAdapter(provider: string, config: ProviderConfig): NotificationAdapter<EmailPayload, NotificationResult> {
    switch (provider) {
      case "resend": return new ResendEmailAdapter(config);
      case "smtp": return new SmtpEmailAdapter(config);
      case "sendgrid": return new SendGridEmailAdapter(config);
      case "aws_ses": return new AwsSesEmailAdapter(config);
      default: throw new Error(`Unknown email provider: ${provider}`);
    }
  }
}
```

---

## Step 7.3 - SMS Channel (MVP: MSG91 + Twilio stub)
**Status: PENDING**

### Create: `packages/notification/channels/sms/types.ts`
Re-export `SmsPayload`.

### Create: `packages/notification/channels/sms/providers/msg91.ts`
- Class `Msg91SmsAdapter extends NotificationAdapter<SmsPayload, NotificationResult>`
- Uses HTTP fetch (no npm package needed) — MSG91 REST API
- Constructor takes `{ authKey, senderId, dltTemplateId }`
- `send()`: POST to `https://control.msg91.com/api/v5/flow/` with template
- `validateRecipient()`: Indian phone number format check (+91...)
- `healthCheck()`: check API key validity

### Create: `packages/notification/channels/sms/providers/twilio.ts`
- Stub implementation (throws helpful message about installing `twilio`)

### Create: `packages/notification/channels/sms/providers/aws-sns.ts`
- Stub implementation

### Create: `packages/notification/channels/sms/providers/textlocal.ts`
- Stub implementation

### Create: `packages/notification/channels/sms/factory.ts`
```typescript
class SmsNotificationFactory {
  static createAdapter(provider: string, config: ProviderConfig): NotificationAdapter<SmsPayload, NotificationResult>
}
```
Switch on: `"msg91"`, `"twilio"`, `"aws_sns"`, `"textlocal"`.

---

## Step 7.4 - WhatsApp Channel (MVP: Gupshup)
**Status: PENDING**

### Create: `packages/notification/channels/whatsapp/types.ts`
Re-export `WhatsAppPayload`.

### Create: `packages/notification/channels/whatsapp/providers/gupshup.ts`
- Class `GupshupWhatsAppAdapter extends NotificationAdapter<WhatsAppPayload, NotificationResult>`
- Uses HTTP fetch — Gupshup API
- Constructor takes `{ apiKey, appName, sourceNumber }`
- `send()`: POST to Gupshup messaging endpoint with template params
- `validateRecipient()`: phone number format check
- `healthCheck()`: check API key

### Create: `packages/notification/channels/whatsapp/providers/twilio.ts`
- Stub implementation

### Create: `packages/notification/channels/whatsapp/providers/meta.ts`
- Stub implementation

### Create: `packages/notification/channels/whatsapp/factory.ts`
```typescript
class WhatsAppNotificationFactory {
  static createAdapter(provider: string, config: ProviderConfig): NotificationAdapter<WhatsAppPayload, NotificationResult>
}
```
Switch on: `"gupshup"`, `"twilio"`, `"meta"`.

---

## Step 7.5 - Notification Templates
**Status: PENDING**

Templates are pure functions that take shipment/event data and return channel-specific payloads.

### Create: `packages/notification/templates/shipment-booked.ts`
- `getShipmentBookedEmail(data)` -> `EmailPayload` with HTML body (tracking number, route, amount, tracking link)
- `getShipmentBookedSms(data)` -> `SmsPayload` with concise text message
- `getShipmentBookedWhatsApp(data)` -> `WhatsAppPayload` with template params

Input shape:
```typescript
{
  trackingNumber: string;
  senderName: string;
  receiverName: string;
  originCity: string;
  destinationCity: string;
  weight: number;
  totalAmount: number;
  trackingUrl: string;
}
```

### Create: `packages/notification/templates/status-update.ts`
- `getStatusUpdateEmail(data)` -> `EmailPayload`
- `getStatusUpdateSms(data)` -> `SmsPayload`
- `getStatusUpdateWhatsApp(data)` -> `WhatsAppPayload`

Input: `{ trackingNumber, status, location, remarks, trackingUrl }`

### Create: `packages/notification/templates/delivery-confirmation.ts`
- `getDeliveryConfirmationEmail(data)` -> `EmailPayload`
- `getDeliveryConfirmationSms(data)` -> `SmsPayload`
- `getDeliveryConfirmationWhatsApp(data)` -> `WhatsAppPayload`

Input: `{ trackingNumber, deliveredAt, receiverName, trackingUrl }`

---

## Step 7.6 - NotificationService Orchestrator
**Status: PENDING**

### Create: `packages/notification/service.ts`

```typescript
class NotificationService {
  // Load active configs from DB, create adapters via factories
  private async getActiveAdapters(): Promise<Map<NotificationChannel, NotificationAdapter>>

  // Log results to notification_events table
  private async logEvent(event: InsertNotificationEvent): Promise<void>

  // Public methods — called from shipment lifecycle
  async sendShipmentBooked(data: ShipmentBookedData): Promise<NotificationResult[]>
  async sendStatusUpdate(data: StatusUpdateData): Promise<NotificationResult[]>
  async sendDeliveryConfirmation(data: DeliveryConfirmationData): Promise<NotificationResult[]>
}
```

**Behavior:**
1. Query `notification_configs` for rows where `isActive = true`
2. For each active config, use the appropriate factory to create an adapter
3. Build payloads using the templates from Step 7.5
4. Call `adapter.send()` on all active channels concurrently via `Promise.allSettled()`
5. Log each result (success or failure) to `notification_events`
6. Return all results

### Create: `packages/notification/index.ts`
Barrel export: `NotificationService`, all types, all factories, abstract adapter.

---

## Step 7.7 - Notification Config Service & tRPC Routes
**Status: PENDING**

### Create: `packages/services/notification/model.ts`

Zod schemas:
- `updateNotificationConfigInputSchema` — `{ channel: z.enum(["email", "sms", "whatsapp"]), provider: z.string(), isActive: z.boolean(), credentials: z.record(z.string()), settings: z.record(z.string()).optional() }`
- `notificationConfigOutputSchema` — matches SelectNotificationConfig (id, channel, provider, isActive, credentials masked for output, settings, timestamps)
- `notificationEventListInputSchema` — `{ channel?: string, status?: string, dateFrom?: string, dateTo?: string, page?: z.number().default(1), limit?: z.number().default(50) }`
- `testChannelInputSchema` — `{ channel: z.enum(["email", "sms", "whatsapp"]), testRecipient: z.string() }`

### Create: `packages/services/notification/index.ts`

Class `NotificationConfigService`:
- `getAll()` — SELECT * FROM notification_configs, return list (mask credential values in output)
- `update(input)` — upsert: if config exists for channel, update; else insert. Returns updated row.
- `testChannel(input)` — loads config for channel, creates adapter via factory, calls `send()` with a test payload, returns result
- `getEventLog(input)` — paginated query on notification_events with optional filters (channel, status, date range). Returns `{ items, total, page, limit }`.

### Create: `packages/trpc/server/routes/notification/route.ts`

All procedures use `adminProcedure`:
| Procedure | Method | Path | Description |
|-----------|--------|------|-------------|
| getConfigs | GET | /notifications/configs | List all notification configs |
| updateConfig | PUT | /notifications/configs | Upsert config for a channel |
| testChannel | POST | /notifications/test | Send test notification |
| getEventLog | GET | /notifications/events | Paginated event log |

### Update: `packages/trpc/server/services/index.ts`
Add `import NotificationConfigService` and `export const notificationConfigService`.

### Update: `packages/trpc/server/index.ts`
Add `import { notificationRouter }` and `notifications: notificationRouter`.

---

## Step 7.8 - Shipment Lifecycle Integration
**Status: PENDING**

### Update: `packages/services/shipment/index.ts`

Import `NotificationService` from `@repo/notification`.

**In `create()` method** — after successful shipment insert:
```typescript
// Fire-and-forget: don't block shipment creation on notification
try {
  const notificationService = new NotificationService();
  const trackingUrl = `${process.env.PUBLIC_URL ?? "https://tpcindia.com"}/track/${trackingNumber}`;
  notificationService.sendShipmentBooked({
    trackingNumber,
    senderName: senderCustomer.name,
    receiverName: receiverCustomer.name,
    originCity: senderAddress.city,
    destinationCity: receiverAddress.city,
    weight: input.weight,
    totalAmount: totalAmount,
    trackingUrl,
  }).catch(() => {}); // fire-and-forget
} catch {}
```

**In `updateStatus()` method** — after successful status update:
```typescript
try {
  const notificationService = new NotificationService();
  const trackingUrl = `${process.env.PUBLIC_URL ?? "https://tpcindia.com"}/track/${shipment.trackingNumber}`;

  if (input.status === "DELIVERED") {
    notificationService.sendDeliveryConfirmation({
      trackingNumber: shipment.trackingNumber,
      deliveredAt: new Date(),
      receiverName: shipment.receiverAddress.name ?? "Customer",
      trackingUrl,
    }).catch(() => {});
  } else {
    notificationService.sendStatusUpdate({
      trackingNumber: shipment.trackingNumber,
      status: input.status,
      location: input.location ?? "",
      remarks: input.remarks ?? "",
      trackingUrl,
    }).catch(() => {});
  }
} catch {}
```

Notifications must NEVER block or fail shipment operations. All notification calls are wrapped in try/catch with `.catch(() => {})`.

---

## Step 7.9 - Admin Notification Settings Page
**Status: PENDING**

### Create: `apps/web/app/(admin)/settings/notifications/page.tsx`

Page layout:
- **Header**: "Notification Settings" title
- **Three channel cards** (Email, SMS, WhatsApp), each containing:
  - Channel icon (Mail, MessageSquare, Phone) + channel name
  - Active/Inactive toggle (Switch component)
  - Provider dropdown (Select):
    - Email: Resend, SendGrid, AWS SES, SMTP
    - SMS: Twilio, MSG91, AWS SNS, Textlocal
    - WhatsApp: Twilio, Gupshup, Meta Business API
  - Dynamic credential fields based on selected provider (all masked `type="password"`):
    - Resend: API Key
    - SendGrid: API Key
    - AWS SES: Access Key ID, Secret Access Key, Region
    - SMTP: Host, Port, Username, Password, From Address
    - Twilio (SMS): Account SID, Auth Token, Phone Number
    - Twilio (WhatsApp): Account SID, Auth Token, Phone Number
    - MSG91: Auth Key, Sender ID, DLT Template ID
    - AWS SNS: Access Key ID, Secret Access Key, Region
    - Textlocal: API Key, Sender
    - Gupshup: API Key, App Name, Source Number
    - Meta: Access Token, Phone Number ID, Business Account ID
  - "Test" button — prompts for test recipient, calls `testChannel` mutation, shows toast
  - "Save" button — calls `updateConfig` mutation

### Create: `apps/web/app/(admin)/settings/notifications/_components/channel-card.tsx`
Reusable card component for a single channel. Props: channel name, provider options, credential field definitions. Uses react-hook-form for the credential fields.

### Create: `apps/web/app/(admin)/settings/notifications/_components/event-log-table.tsx`
Table component below the channel cards:
- Columns: Timestamp | Channel | Provider | Recipient | Event Type | Status (Badge) | Error
- Filters: channel dropdown, status dropdown, date range (optional)
- Pagination controls
- Uses `trpc.notifications.getEventLog.useQuery()`

---

## Step 7.10 - Build Verification
**Status: PENDING**

- Run `pnpm install` to link `@repo/notification` workspace
- Run `pnpm turbo build` to verify full compilation
- Verify `@repo/notification` package compiles (types, adapter, factories, service)
- Verify notification tRPC routes are accessible
- Verify shipment create/updateStatus still works (notifications are fire-and-forget, no blocking)
- Verify admin notification settings page renders
- Verify event log table renders (empty initially)

---

## Implementation Notes

### MVP Provider Strategy
For the initial implementation, **fully implement one provider per channel** and stub the rest:
- **Email**: Resend (primary) + SMTP (fallback) — both fully implemented
- **SMS**: MSG91 (India-focused) — fully implemented; Twilio/SNS/Textlocal stubbed
- **WhatsApp**: Gupshup (India-focused) — fully implemented; Twilio/Meta stubbed

Stubs implement the abstract interface but throw a descriptive error ("Provider not configured"). This keeps the architecture extensible without requiring all 11 SDKs upfront.

### Credential Security
- Credentials stored as JSONB in `notification_configs.credentials`
- On read (getConfigs), credential values are masked (show only last 4 chars)
- Full credentials only used server-side when creating adapters
- No credentials sent to the frontend in cleartext

### Fire-and-Forget Pattern
All notification calls from shipment lifecycle are:
1. Wrapped in `try/catch`
2. Use `.catch(() => {})` to prevent unhandled rejections
3. Never awaited (don't block the shipment response)
4. Failures logged to `notification_events` table for admin visibility

---

## Deliverables Checklist

| # | Item | Status |
|---|------|--------|
| 1 | `@repo/notification` package initialized (package.json, tsconfig) | PENDING |
| 2 | Core types (NotificationChannel, payloads, result, ProviderConfig) | PENDING |
| 3 | Abstract `NotificationAdapter` base class | PENDING |
| 4 | Email channel: ResendEmailAdapter (full implementation) | PENDING |
| 5 | Email channel: SmtpEmailAdapter (full implementation) | PENDING |
| 6 | Email channel: SendGrid + AWS SES stubs | PENDING |
| 7 | EmailNotificationFactory | PENDING |
| 8 | SMS channel: Msg91SmsAdapter (full implementation) | PENDING |
| 9 | SMS channel: Twilio, SNS, Textlocal stubs | PENDING |
| 10 | SmsNotificationFactory | PENDING |
| 11 | WhatsApp channel: GupshupWhatsAppAdapter (full implementation) | PENDING |
| 12 | WhatsApp channel: Twilio, Meta stubs | PENDING |
| 13 | WhatsAppNotificationFactory | PENDING |
| 14 | Notification templates: shipment-booked (email/sms/whatsapp) | PENDING |
| 15 | Notification templates: status-update (email/sms/whatsapp) | PENDING |
| 16 | Notification templates: delivery-confirmation (email/sms/whatsapp) | PENDING |
| 17 | NotificationService orchestrator (DB config, concurrent send, event logging) | PENDING |
| 18 | `@repo/notification/index.ts` barrel export | PENDING |
| 19 | NotificationConfigService (packages/services/notification/) | PENDING |
| 20 | Notification tRPC routes (getConfigs, updateConfig, testChannel, getEventLog) | PENDING |
| 21 | Router registered in serverRouter + services index | PENDING |
| 22 | Shipment `create()` integration (fire-and-forget sendShipmentBooked) | PENDING |
| 23 | Shipment `updateStatus()` integration (fire-and-forget status/delivery) | PENDING |
| 24 | Admin notification settings page with 3 channel cards | PENDING |
| 25 | Channel card component with dynamic credential fields | PENDING |
| 26 | Event log table with filters and pagination | PENDING |
| 27 | Full build passes | PENDING |
