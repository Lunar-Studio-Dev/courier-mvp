# Phase 3: Customers & Destinations

## Status: COMPLETE

## Note on Authentication
All routes in this phase were implemented using `publicProcedure` (no auth). When Phase Auth is implemented, admin routes (`customers.*`, `destinations.*`) will be migrated to `adminProcedure`. The `destinations.checkServiceability` endpoint will remain `publicProcedure` (public pincode check).

## Goal
Implement customer management with OCR-based ID proof auto-fill and the destination serviceability module. Customers are the core entities that shipments reference as sender/receiver. Destinations define the pincode/city/state serviceability map.

---

## Deliverables Checklist

| # | Item | Status |
|---|------|--------|
| 1 | `services/destination/model.ts` | DONE |
| 2 | `services/destination/index.ts` | DONE |
| 3 | `trpc/server/routes/destination/route.ts` | DONE |
| 4 | Destinations UI page + columns | DONE |
| 5 | `database/seed/destinations.ts` + script | DONE |
| 6 | `services/customer/model.ts` | DONE |
| 7 | `services/customer/index.ts` | DONE |
| 8 | `trpc/server/routes/customer/route.ts` | DONE |
| 9 | Services + routes registered (index.ts updates) | DONE |
| 10 | Customers list page + columns | DONE |
| 11 | `tesseract.js` installed | DONE |
| 12 | `lib/ocr/types.ts` | DONE |
| 13 | `lib/ocr/index.ts` (OCR engine) | DONE |
| 14 | `lib/ocr/parsers/aadhaar.ts` | DONE |
| 15 | `lib/ocr/parsers/pan.ts` | DONE |
| 16 | `lib/ocr/parsers/voter-id.ts` | DONE |
| 17 | `lib/ocr/parsers/driving-license.ts` | DONE |
| 18 | `lib/ocr/parsers/passport.ts` | DONE |
| 19 | `lib/ocr/parsers/index.ts` (auto-detect) | DONE |
| 20 | `hooks/use-id-ocr.ts` | DONE |
| 21 | Onboard customer sheet (OCR + form) | DONE |
| 22 | Edit customer sheet | DONE |
| 23 | Customer detail page (profile + edit) | DONE |
| 24 | Full build passes | DONE |
