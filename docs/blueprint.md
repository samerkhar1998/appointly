# Appointly — Product Blueprint

> Source of truth for all product decisions. Paste full blueprint content here.

## Platform Overview

**Appointly** is a multi-tenant SaaS salon booking platform for the Israeli market.

- **Customers** book appointments via a public URL (`/book/[salon-slug]`)
- **Salon owners** manage everything via a dashboard (`/dashboard/*`)
- **Platform admins** manage plans, billing, and global settings

## Key Flows

### Customer Booking Flow
1. Visit `/book/[slug]` → see salon info, services, staff
2. Select service → optional staff → date → time slot
3. Enter name + phone → receive OTP → verify → confirm booking
4. Receive WhatsApp confirmation with magic-link cancellation option

### Cancellation
- **Magic link**: `CANCEL_TOKEN` in confirmation message → `/cancel/[token]`
- **Phone OTP**: customer requests OTP, enters it on cancellation page
- Configurable cancellation window (e.g. no cancellations within 24h of appointment)

### Salon Dashboard
- Calendar view of appointments (day/week/month)
- Confirm/decline/complete/no-show status management
- Staff management with per-day schedules + blocked times
- Service catalog with categories, pricing, duration
- Client CRM (visit history, notes, block/unblock)
- Product shop with inventory + order management
- Promo codes (%, fixed, free service/product, personal codes)
- Analytics (revenue, retention, top clients, promo performance)
- Settings (WhatsApp templates, confirmation mode, cancellation policy)

## Technical Architecture

### Monorepo
- **Turborepo** + **pnpm workspaces**
- `apps/web` — Next.js 14 App Router (RTL, Hebrew-first)
- `apps/mobile` — (future) React Native
- `packages/db` — Prisma ORM + PostgreSQL
- `packages/api` — tRPC v11 routers
- `packages/shared` — Zod validation schemas
- `packages/ui` — Shared UI components

### Stack
- **Database**: PostgreSQL via Prisma 5
- **API**: tRPC v11 with type-safe end-to-end types
- **Auth**: JWT in httpOnly cookie, phone OTP for customers
- **Frontend**: Next.js 14 App Router, TanStack Query, Zustand, shadcn/ui
- **Internationalization**: next-intl, he/ar/en, RTL-first
- **WhatsApp**: Twilio (stub — integrate later)
- **Job queue**: BullMQ + Redis (stub — integrate later)

## Availability Engine

The core scheduling algorithm (`availabilityRouter.getSlots`):

1. Load service duration + buffer from settings
2. Load salon hours for the requested day (return [] if closed)
3. Load relevant staff (specific or all bookable staff)
4. For each staff member:
   - Get their working window for that day
   - Load existing PENDING/CONFIRMED appointments
   - Load StaffBlockedTime overlapping that day
   - Generate candidate slots every `slot_interval_mins` minutes
   - Filter out conflicts
5. Deduplicate + sort + return ISO UTC timestamps
6. Client converts UTC → salon timezone using `Salon.timezone`

## Pricing Plans

| Feature | FREE | BASIC | PRO | ENTERPRISE |
|---|---|---|---|---|
| Staff | 1 | 3 | 10 | Unlimited |
| Services | 5 | 20 | 50 | Unlimited |
| Monthly bookings | 50 | 200 | 500 | Unlimited |
| Products/Shop | — | — | ✓ | ✓ |
| Promo codes | — | — | ✓ | ✓ |
| Analytics | — | Basic | Full | Full |
| Custom WA templates | — | — | ✓ | ✓ |
| API access | — | — | — | ✓ |
