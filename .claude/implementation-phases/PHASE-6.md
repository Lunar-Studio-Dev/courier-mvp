# Phase 6: Public Pages

## Status: DONE

## Prerequisites
- **Phase 4 must be completed first.** Public tracking uses shipment data. Landing page links to tracking.

## Goal
Build a polished, responsive public-facing experience: an enhanced landing page with all sections (hero, services, how-it-works, coverage stats, inline tracking, footer), a dedicated tracking search page at `/track`, and improvements to the existing public tracking detail page (expected steps, completed checkmarks, mobile-first design). Ensure the public layout has consistent shared navigation.

---

## Current State Analysis

### Already Implemented
- **Landing page** (`(public)/page.tsx`) — Basic hero + 3 service cards + minimal footer
- **Tracking detail page** (`(public)/track/[trackingNumber]/page.tsx`) — Functional with timeline
- **Login page** (`(public)/login/page.tsx`) — Admin login form
- **Public layout** (`(public)/layout.tsx`) — Empty wrapper `<>{children}</>`

### Missing / Needs Enhancement
1. Landing page missing: "How It Works" section, Coverage stats section, inline "Track Your Shipment" section, proper footer with contact info/links
2. No `/track` page exists — nav link to "/track" currently 404s (only `/track/[trackingNumber]` exists)
3. Public layout has no shared navigation — each page duplicates its own header
4. Tracking detail page lacks expected future steps (grayed out) and completed step checkmarks
5. No mobile-responsive hamburger menu on public pages

---

## Step 6.1 - Shared Public Layout with Navigation
**Status: PENDING**

### Update: `apps/web/app/(public)/layout.tsx`

Replace empty wrapper with a shared layout that includes:
- **Header navbar**: TPC India logo + nav links (Home, Track, Admin Portal)
- **Mobile**: Hamburger menu using Sheet component for responsive nav
- **Children**: Main content area
- No footer here (each page controls its own footer, since landing page has a rich footer)

The header should be consistent across all public pages, replacing the per-page header duplication in `page.tsx` and `track/[trackingNumber]/page.tsx`.

---

## Step 6.2 - Tracking Search Page
**Status: PENDING**

### File: `apps/web/app/(public)/track/page.tsx`

Create a dedicated tracking search page at `/track` (currently 404):
- Company branding (inherits from layout header)
- Large centered card with:
  - Heading: "Track Your Shipment"
  - Description: "Enter your tracking number to see real-time status updates"
  - Tracking number input field (large, prominent)
  - "Track" button
  - On submit: navigates to `/track/{trackingNumber}`
- Below the card: brief info about tracking format (e.g., "Your tracking number starts with TPC followed by digits")
- Mobile-first, centered layout

---

## Step 6.3 - Enhanced Landing Page
**Status: PENDING**

### Update: `apps/web/app/(public)/page.tsx`

Enhance the existing landing page with all sections from the analysis. Remove the per-page header (now in shared layout). Keep existing hero and services sections but improve them, and add missing sections.

**Section 1 - Hero (existing, enhance):**
- Keep existing headline and CTAs
- Add subtle CSS gradient background (no external images)
- "Track Shipment" CTA scrolls to the tracking section (anchor link `#track`)

**Section 2 - Services (existing, enhance):**
- Section title: "Our Services"
- Expand to 6 cards: Express, Standard, Same-Day, Next-Day, Economy, Priority
- Each card: lucide icon, title, short description
- Responsive: 3 columns desktop, 2 tablet, 1 mobile

**Section 3 - How It Works (NEW):**
- 3-step horizontal flow: Book → Ship → Deliver
- Each step: number badge (1, 2, 3), icon, title, description
- Connected by a horizontal line/arrow between steps
- Responsive: horizontal on desktop, vertical stack on mobile

**Section 4 - Coverage Stats (NEW):**
- Background: subtle muted section
- 4 stat cards in a row: "500+ Cities", "28 States", "30+ Years", "1M+ Deliveries"
- Large numbers with labels below
- Responsive grid

**Section 5 - Track Your Shipment (NEW):**
- `id="track"` anchor for scroll-to
- Section title: "Track Your Shipment"
- Large input field + "Track" button (centered)
- On submit: navigates to `/track/{trackingNumber}`
- This is a client component island within the server-rendered page

**Section 6 - Footer (enhance existing):**
- 3-column layout:
  - Column 1: Company name, brief description
  - Column 2: Quick Links (Home, Track Shipment, Admin Portal)
  - Column 3: Contact (phone, email, address placeholder)
- Bottom bar: copyright text
- Responsive: stack on mobile

### File: `apps/web/app/(public)/_components/track-section.tsx`
Client component for the tracking input section (needs `useState` + `useRouter` for form handling).

---

## Step 6.4 - Enhanced Public Tracking Detail Page
**Status: PENDING**

### Update: `apps/web/app/(public)/track/[trackingNumber]/page.tsx`

Improve the existing tracking page:

1. **Remove per-page header** — now provided by shared layout
2. **Shipment summary card** — add more details:
   - Product type, service type, mode (requires adding these fields to the track endpoint or using a new public-facing query)
3. **Enhanced status timeline:**
   - Show ALL expected statuses as steps: BOOKED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
   - Completed steps: green checkmark icon, full opacity
   - Current step: primary color dot (pulsing), highlighted
   - Future steps: grayed out with dotted connector
   - Each step shows timestamp + location + remarks (from tracking history) for completed steps
   - Future steps show just the label, grayed
4. **Mobile-first design:**
   - Full-width card layouts on mobile
   - Touch-friendly tap targets
   - Comfortable font sizes for phone screens (QR code target)
5. **"Track another shipment" link** at the bottom → navigates to `/track`

### Note on track endpoint
The current `shipments.track` endpoint returns: trackingNumber, status, bookedAt, deliveredAt, senderCity, senderState, receiverCity, receiverState, history[].

For the enhanced page, this is sufficient. No new endpoints needed — product/service/mode info is nice-to-have but not essential for the public tracking view.

---

## Step 6.5 - Remove Duplicate Headers
**Status: PENDING**

After the shared layout is in place, update these pages to remove their duplicated headers:

### Update: `apps/web/app/(public)/page.tsx`
- Remove the `<header>` element (now in layout)

### Update: `apps/web/app/(public)/track/[trackingNumber]/page.tsx`
- Remove the `<header>` element (now in layout)
- Remove the outer `<div className="min-h-screen bg-muted/30">` wrapper (layout handles this)

### Verify: `apps/web/app/(public)/login/page.tsx`
- Login page is a full-screen centered card with no header — check it still looks correct with the shared layout header above it

---

## Step 6.6 - Build Verification
**Status: PENDING**

- Run `pnpm turbo build` to verify full compilation
- Test landing page renders all 6 sections
- Test `/track` page shows search form
- Test `/track` form navigates to `/track/{trackingNumber}` correctly
- Test tracking detail page shows enhanced timeline with expected steps
- Test mobile responsiveness on all public pages
- Test `/login` page still works with shared layout

---

## Deliverables Checklist

| # | Item | Status |
|---|------|--------|
| 1 | Shared public layout with responsive navigation + mobile hamburger | PENDING |
| 2 | `/track` search page (tracking number input + navigate) | PENDING |
| 3 | Enhanced landing page: How It Works section | PENDING |
| 4 | Enhanced landing page: Coverage Stats section | PENDING |
| 5 | Enhanced landing page: Track Your Shipment inline section | PENDING |
| 6 | Enhanced landing page: Rich footer with columns | PENDING |
| 7 | Enhanced landing page: Services section expanded to 6 cards | PENDING |
| 8 | Track section client component (`_components/track-section.tsx`) | PENDING |
| 9 | Enhanced tracking detail page: expected steps timeline | PENDING |
| 10 | Enhanced tracking detail page: completed checkmarks | PENDING |
| 11 | Enhanced tracking detail page: mobile-first improvements | PENDING |
| 12 | Remove duplicate headers from landing + tracking pages | PENDING |
| 13 | Login page verified with shared layout | PENDING |
| 14 | Full build passes | PENDING |
