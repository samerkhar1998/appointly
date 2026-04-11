# Appointly

Multi-tenant SaaS salon booking platform for the Israeli market. Salon owners get a full management dashboard; their customers book appointments through a public, mobile-first booking page with OTP verification and WhatsApp confirmations.

---

## What it does

| Who | What they do |
|-----|-------------|
| **Customer** | Opens `/book/[salon-slug]` → picks a service → picks a date & time → verifies phone via OTP → gets a WhatsApp confirmation with a magic-link to cancel |
| **Salon owner** | Logs into `/dashboard` → manages appointments, staff, services, clients, promos, and analytics |
| **Platform admin** | Manages plans, billing, and global settings |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Web app | Next.js 14 App Router (TypeScript, strict mode) |
| API | tRPC v11 — end-to-end type safety, no REST |
| Database | PostgreSQL via Prisma 5 |
| Auth | JWT in httpOnly cookie (`jose`), phone OTP for customers |
| Styling | Tailwind CSS + shadcn/ui components |
| State | TanStack Query (server), Zustand (client) |
| i18n | next-intl — Hebrew (primary, RTL), Arabic, English |
| Email | Resend |
| WhatsApp / SMS | Twilio |
| File storage | Cloudinary |
| Job queue | BullMQ + Redis (Upstash) |
| Calendar UI | FullCalendar |
| Payments (V2) | Tranzila (Israel-native) |

---

## Repository layout

```
appointly/
├── apps/
│   ├── web/                  # Next.js 14 App Router
│   │   ├── src/app/
│   │   │   ├── (auth)/       # /login
│   │   │   ├── (dashboard)/  # /dashboard/* — salon owner
│   │   │   └── (public)/     # /book/[slug], /cancel/[token]
│   │   ├── src/features/     # Feature components (booking, dashboard)
│   │   ├── src/components/   # shadcn/ui components
│   │   ├── src/lib/          # trpc client, utils, hooks
│   │   └── messages/         # i18n translation files (he, ar, en)
│   └── mobile/               # React Native + Expo (future)
│
├── packages/
│   ├── api/                  # tRPC routers — all business logic lives here
│   ├── db/                   # Prisma schema, seed, generated client
│   ├── shared/               # Zod schemas shared across apps and api
│   └── ui/                   # Shared component library (future)
│
├── docker-compose.yml        # Postgres 16 + Redis 7 for local dev
├── .env.example              # All required environment variables
└── docs/blueprint.md         # Product decisions — source of truth
```

---

## Getting started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Docker (for the local Postgres + Redis)

### 1. Clone and install

```bash
git clone git@github.com:samerkhar1998/appointly.git
cd appointly
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in the required values (see [Environment variables](#environment-variables) below).

### 3. Start the database

```bash
docker compose up -d
```

### 4. Push the schema and seed the database

```bash
pnpm --filter @appointly/db exec prisma migrate dev --name init
pnpm --filter @appointly/db exec prisma db seed
```

### 5. Start the dev server

```bash
pnpm dev
```

The web app runs at `http://localhost:3000`.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in all values.

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appointly

# Auth
JWT_SECRET=
JWT_EXPIRES_IN=7d

# Twilio (WhatsApp + SMS)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
TWILIO_SMS_FROM=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Resend
RESEND_API_KEY=

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Architecture notes

### tRPC API (`packages/api`)

All business logic lives in tRPC routers. Components never call the database directly.

| Router | Procedures |
|--------|-----------|
| `auth` | login, logout, me, changePassword |
| `salons` | create, getBySlug, update, updateHours, getSettings, updateSettings |
| `staff` | list, listAll, createSimple, update, deactivate, setSchedule, addBlockedTime |
| `services` | list, create, update, toggle |
| `availability` | getSlots |
| `appointments` | create, list, listForCalendar, confirm, decline, cancelByToken, updateStatus |
| `salonClients` | list, get, getByToken, addNote, block, unblock |
| `verification` | sendOTP, verifyOTP |
| `orders` | (stub) |
| `products` | (stub) |
| `promoCodes` | (stub) |
| `analytics` | (stub) |

Three procedure types enforce access control:

- `publicProcedure` — booking pages, OTP, availability, cancel by token
- `protectedProcedure` — any authenticated user
- `salonOwnerProcedure` — salon owners and platform admins only

### Availability engine (`availability.router.ts`)

Slots are never pre-generated. On every request the engine:

1. Loads the service duration + booking slot interval from salon settings
2. Checks if the salon is open on that day
3. For each bookable staff member: computes their working window, loads existing PENDING/CONFIRMED appointments and blocked times, generates candidate slots at the configured interval, and filters out conflicts using `aStart < bEnd && bStart > aStart`
4. Deduplicates, sorts, and returns ISO UTC timestamps
5. The client converts UTC → salon timezone via `Intl.DateTimeFormat`

### Authentication

Salon owners authenticate with email + password. A signed JWT is issued and stored in an httpOnly cookie (`appointly_token`). The JWT payload includes `sub` (user id), `email`, `role`, and `salon_id`.

Customers are never asked to create an account. They verify ownership of a phone number with a 6-digit OTP. After verification, a `verification_token` (UUID v4) is issued for the duration of the booking session.

### RTL & internationalisation

The app is built Hebrew-first:

- Root `<html>` has `dir="rtl" lang="he"`
- All Tailwind spacing uses `ps-`/`pe-`/`ms-`/`me-` (logical properties) — never `pl-`/`pr-`
- Font: **Heebo** (Google Fonts) — designed for Hebrew and Latin
- Translation files: `apps/web/messages/{he,ar,en}.json`
- Locale routing handled by `next-intl` middleware

### Database schema (20 models)

Key models and relationships:

```
Salon ──< SalonMember >── User
      ──< Staff ──< StaffSchedule
                └── StaffBlockedTime
      ──< Service ──< ServiceCategory
      ──< Appointment ──< SalonClient
      ──< SalonSettings
      ──< Product ──< Order ──< OrderItem
      ──< PromoCode ──< PromoUsage
      ──< PhoneVerification
      ──< AppointmentReminder

Plan ──< Subscription ──< Salon
```

All appointment queries scope by `salon_id`. No cross-salon data leakage is possible at the query level.

---

## Pricing plans

| Feature | FREE | BASIC | PRO | ENTERPRISE |
|---------|------|-------|-----|------------|
| Staff | 1 | 3 | 10 | Unlimited |
| Services | 5 | 20 | 50 | Unlimited |
| Monthly bookings | 50 | 200 | 500 | Unlimited |
| Products / Shop | — | — | ✓ | ✓ |
| Promo codes | — | — | ✓ | ✓ |
| Analytics | — | Basic | Full | Full |
| Custom WhatsApp templates | — | — | ✓ | ✓ |
| API access | — | — | — | ✓ |

---

## What's built vs. what's next

### Built

- [x] Full monorepo scaffold (Turborepo + pnpm)
- [x] Prisma schema — 20 models, 10 enums
- [x] All Zod schemas (`packages/shared`)
- [x] tRPC API — 13 routers, fully-implemented availability engine
- [x] Next.js 14 App Router — RTL, Hebrew i18n, Tailwind brand tokens
- [x] Login page (react-hook-form + Zod)
- [x] Dashboard layout — sidebar, navigation, user avatar
- [x] Dashboard overview — stat cards, today's schedule, monthly performance
- [x] Customer booking flow — 5-step wizard (service → date/time → details → OTP → confirmation)
- [x] Cancellation page — magic-link token flow
- [x] Dashboard: Services CRUD (list, create, edit, toggle active)
- [x] Dashboard: Staff management (cards, create, bookable toggle, deactivate)
- [x] Dashboard: Clients CRM (paginated search, block/unblock, notes)
- [x] Dashboard: Calendar (FullCalendar week/day/month, appointment actions)

### Roadmap

- [ ] bcrypt password hashing (currently stubbed)
- [ ] WhatsApp / Twilio integration
- [ ] BullMQ reminder jobs (24h + 1h before appointment)
- [ ] Products + shop + order management
- [ ] Promo codes engine
- [ ] Analytics dashboard (Recharts)
- [ ] Salon settings page (WhatsApp templates, cancellation policy)
- [ ] `apps/mobile` — React Native + Expo scaffold
- [ ] Tranzila payment integration

---

## Development commands

```bash
# Run all apps and packages in dev mode
pnpm dev

# Type-check everything
pnpm typecheck

# Lint
pnpm lint

# Prisma
pnpm --filter @appointly/db exec prisma studio        # Open Prisma Studio
pnpm --filter @appointly/db exec prisma migrate dev   # Run a new migration
pnpm --filter @appointly/db exec prisma generate      # Regenerate client after schema change
pnpm --filter @appointly/db exec prisma db seed       # Re-seed the database
```
