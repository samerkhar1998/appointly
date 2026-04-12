# Appointly

Multi-tenant SaaS salon booking platform for the Israeli market.  
Salon owners get a full management dashboard; their customers book appointments through a public, mobile-first booking page with phone OTP verification and WhatsApp/SMS confirmations.

---

## Table of contents

1. [What it does](#what-it-does)
2. [Tech stack](#tech-stack)
3. [Repository layout](#repository-layout)
4. [Getting started](#getting-started)
5. [Environment variables](#environment-variables)
6. [How to test and verify everything](#how-to-test-and-verify-everything)
7. [Architecture notes](#architecture-notes)
8. [API reference](#api-reference)
9. [Pricing plans](#pricing-plans)
10. [Build status](#build-status)
11. [Development commands](#development-commands)

---

## What it does

| Who | What they do |
|-----|-------------|
| **Customer** | Opens `/book/[salon-slug]` → picks a service → picks a staff member (optional) → picks a date & time → fills in details → verifies phone via OTP → receives a WhatsApp/SMS confirmation with a one-click magic-link to cancel |
| **Salon owner** | Logs into `/dashboard` → manages appointments (calendar + list), staff, services, clients, shop, promo codes, analytics, and all salon settings including WhatsApp templates |
| **Platform admin** | Manages plans, billing, and global settings |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Web app | Next.js 14 App Router (TypeScript strict mode) |
| API | tRPC v11 — end-to-end type safety, no REST |
| Database | PostgreSQL via Prisma 5 |
| Auth | JWT in httpOnly cookie (`jose`) + Google OAuth; phone OTP for customers |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack Query (server), Zustand (client) |
| i18n | next-intl — Hebrew (primary, RTL), Arabic, English |
| Email | Resend |
| WhatsApp / SMS | Twilio |
| File storage | Cloudinary |
| Job queue | BullMQ + ioredis (Upstash Redis) |
| Calendar UI | FullCalendar |
| Charts | Recharts |
| Payments (V2) | Tranzila (Israel-native) |
| Mobile (future) | React Native + Expo |

---

## Repository layout

```
appointly/
├── apps/
│   ├── web/                        # Next.js 14 App Router
│   │   ├── src/app/
│   │   │   ├── (auth)/             # /login, /register
│   │   │   ├── (dashboard)/        # /dashboard/* — salon owner only
│   │   │   │   └── dashboard/
│   │   │   │       ├── page.tsx          # Overview / home
│   │   │   │       ├── calendar/         # FullCalendar view
│   │   │   │       ├── services/         # Services CRUD
│   │   │   │       ├── staff/            # Staff management
│   │   │   │       ├── clients/          # Client CRM
│   │   │   │       ├── shop/             # Products + orders
│   │   │   │       ├── promos/           # Promo codes
│   │   │   │       ├── analytics/        # Charts + KPIs
│   │   │   │       ├── settings/         # Salon settings + WhatsApp template
│   │   │   │       └── plan/             # Subscription plan
│   │   │   ├── (public)/           # No auth required
│   │   │   │   ├── book/[slug]/    # Customer booking flow
│   │   │   │   └── cancel/[token]/ # Appointment cancellation
│   │   │   └── api/
│   │   │       ├── trpc/[trpc]/    # tRPC HTTP handler
│   │   │       ├── auth/google/    # Google OAuth callback
│   │   │       └── upload/         # Cloudinary signed upload
│   │   ├── src/features/
│   │   │   ├── booking/            # Public booking flow + cancel page
│   │   │   │   ├── BookingFlow.tsx
│   │   │   │   ├── CancelPage.tsx
│   │   │   │   └── steps/
│   │   │   │       ├── StepServices.tsx
│   │   │   │       ├── StepStaff.tsx
│   │   │   │       ├── StepDateTime.tsx
│   │   │   │       ├── StepDetails.tsx
│   │   │   │       ├── StepOTP.tsx
│   │   │   │       └── StepConfirmation.tsx
│   │   │   └── dashboard/          # All dashboard page components
│   │   ├── src/components/ui/      # shadcn/ui component library
│   │   ├── src/lib/                # tRPC client, utils, hooks
│   │   └── messages/               # i18n files: he.json, ar.json, en.json
│   └── mobile/                     # React Native + Expo (future)
│
├── packages/
│   ├── api/                        # All tRPC routers + business logic
│   │   └── src/
│   │       ├── routers/            # One file per domain
│   │       ├── lib/
│   │       │   ├── notifications.ts  # Twilio + Resend service
│   │       │   └── queue.ts          # BullMQ reminder jobs
│   │       └── trpc.ts             # Procedure types + context
│   ├── db/                         # Prisma schema, migrations, seed
│   │   └── prisma/
│   │       ├── schema.prisma       # 20 models, 10 enums
│   │       └── seed.ts             # Demo salon, owner, staff, services
│   ├── shared/                     # Zod schemas shared across all packages
│   └── ui/                         # Shared component library (future)
│
├── docker-compose.yml              # Postgres 16 + Redis 7 for local dev
├── .env.example                    # All required environment variables
└── docs/blueprint.md               # Product decisions — source of truth
```

---

## Getting started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Docker (for local Postgres + Redis)

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

Fill in the values described in [Environment variables](#environment-variables).  
At minimum for local dev you need: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`.  
Everything else (Twilio, Resend, Cloudinary, Redis) degrades gracefully with console logging when absent.

### 3. Start Postgres and Redis

```bash
docker compose up -d
```

This starts Postgres 16 on port 5432 and Redis 7 on port 6379.

### 4. Run migrations and seed the database

```bash
# Always use the project-local Prisma (v5), not any globally installed version
packages/db/node_modules/.bin/prisma migrate dev \
  --schema=packages/db/prisma/schema.prisma \
  --name init

packages/db/node_modules/.bin/prisma db seed \
  --schema=packages/db/prisma/schema.prisma
```

The seed creates:
- A demo salon: **"סלון דמו"** with slug `demo-salon`
- Owner: `owner@demo.com` / `password123`
- 3 staff members with weekly schedules
- 5 services across 2 categories

### 5. Start the dev server

```bash
pnpm dev
```

App runs at `http://localhost:3000`.

---

## Environment variables

```env
# ── Database ──────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appointly

# ── Auth ──────────────────────────────────────────────────
JWT_SECRET=your-secret-here-min-32-chars
JWT_EXPIRES_IN=7d

# Google OAuth (optional — login still works without it)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ── Twilio WhatsApp + SMS ─────────────────────────────────
# Leave blank in dev — OTPs and notifications print to console
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=+14155238886   # Twilio sandbox number
TWILIO_SMS_FROM=

# ── Cloudinary (image uploads) ────────────────────────────
# Leave blank in dev — upload button will be non-functional
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ── Resend (email) ────────────────────────────────────────
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@yourdomain.com

# ── Redis / Upstash (reminder queue) ─────────────────────
# Leave blank in dev — reminders are logged, not enqueued
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ── App ───────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ── Testing (optional — dev / CI only) ───────────────────
# When set, every OTP uses this fixed code instead of a random 6-digit number.
# NEVER set this in production.
# TEST_OTP_CODE=000000
```

**Dev shortcuts:** Twilio, Cloudinary, Resend, and Redis are all optional.  
When their env vars are absent the app stubs them out and logs to the console instead.

`TEST_OTP_CODE` is also optional. When set (e.g. `TEST_OTP_CODE=000000`), every OTP sent to any phone number will use that fixed code — eliminating the need to read the terminal during local development or automated testing. **Never set this in production.**

---

## How to test and verify everything

### Type safety (run after every change)

```bash
# Type-check the web app
npx tsc --noEmit -p apps/web/tsconfig.json

# Type-check the API package
npx tsc --noEmit -p packages/api/tsconfig.json

# Type-check both with Turborepo
pnpm typecheck
```

Expected output: no errors.

---

### Database

```bash
# Open Prisma Studio — browse every table with a GUI
packages/db/node_modules/.bin/prisma studio \
  --schema=packages/db/prisma/schema.prisma

# Validate schema without migrating
packages/db/node_modules/.bin/prisma validate \
  --schema=packages/db/prisma/schema.prisma

# Reset to a clean state and re-seed
packages/db/node_modules/.bin/prisma migrate reset \
  --schema=packages/db/prisma/schema.prisma
```

**Important:** The project uses Prisma 5. If you have a global Prisma installation it may be a different major version and will reject the schema. Always use the binary at `packages/db/node_modules/.bin/prisma`.

---

### Auth — email + password

1. Go to `http://localhost:3000/login`
2. Enter `owner@demo-salon.co.il` / `password123`
3. You should be redirected to `/dashboard`
4. Check the browser dev tools → Application → Cookies → `appointly_token` should be set (httpOnly)
5. Reload — you should stay logged in
6. Click the avatar / logout button — cookie is cleared, redirected to `/login`

**Registration:**

1. Go to `/register`
2. Fill in name, email, password (min 8 chars), salon name
3. Submit — creates a User + Salon + SalonMember(OWNER) in one transaction
4. Should redirect to `/dashboard`

**Google OAuth (requires env vars):**

1. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
2. Add `http://localhost:3000/api/auth/google/callback` as an authorised redirect URI in Google Cloud Console
3. Go to `/login`, click "המשך עם Google"
4. Complete Google sign-in — redirected to `/dashboard` with `appointly_token` cookie set

---

### Customer booking flow

Open `http://localhost:3000/book/demo-salon` in a mobile-sized browser window.

**Step 1 — Services**
- Should see a list of services grouped by category
- Click any service to advance

**Step 2 — Staff**
- Should see all bookable staff members + "No preference" option
- If only 1 bookable staff exists, this step is skipped automatically
- Select a staff member or "No preference"

**Step 3 — Date & time**
- A 14-day date strip appears; scroll or use arrow buttons to navigate
- Select a date — available time slots load below
- If no slots appear, verify staff have schedules set in the Dashboard → Staff page
- Select a slot to advance

**Step 4 — Details**
- Fill in name, phone (Israeli format: 05x-xxxxxxx is accepted and normalised to E.164), email (optional)
- Booking summary is shown on the right/bottom
- Click "המשך"

**Step 5 — OTP**
- In dev mode (no Twilio): check the terminal — the OTP code is printed there:
  ```
  [DEV] OTP → +9725xxxxxxxx:
  שלום! קוד האימות שלך ל... הוא: 123456
  ```
- **Faster alternative:** set `TEST_OTP_CODE=000000` in `.env.local` — every OTP will be `000000` so you never need to check the terminal
- Enter the 6 digits — inputs auto-advance on each digit
- Auto-verifies when the 6th digit is entered
- Resend is available after a 60-second cooldown

**Step 6 — Confirmation**
- "Appointment confirmed" card appears with booking details
- In dev mode (no Twilio): confirmation WhatsApp message is logged to the terminal

**Client pre-fill (skip OTP):**

When a salon sends a customer their `client_token` link, the details and OTP step are skipped:
```
http://localhost:3000/book/demo-salon?client=<client_token>
```
Find a `client_token` in Prisma Studio → SalonClient table.

---

### Cancellation page

After booking, the confirmation step shows a `cancel_token`. You can also find one in Prisma Studio → Appointment table.

Open `http://localhost:3000/cancel/<cancel_token>`.

**What you should see:**
- Appointment details card: service name, date/time (in salon timezone), staff name, cancellation window policy
- Two options: "כן, בטל את התור" (magic-link, one click) and "ביטול עם קוד SMS" (OTP flow)

**Magic-link cancellation:**
- Click "כן, בטל את התור"
- Should show a spinner then success screen
- In Prisma Studio: Appointment status changes to `CANCELLED`

**OTP cancellation:**
- Click "ביטול עם קוד SMS"
- In dev mode: OTP is printed to the terminal
- Enter the 6 digits — auto-submits when complete
- Should show success screen

---

### Dashboard — overview

Go to `http://localhost:3000/dashboard`.

- Should see today's appointment count, revenue, client count, cancellation rate
- Today's appointments list (empty if no appointments exist — create one via the booking flow first)
- Monthly performance bar chart (Recharts)

---

### Dashboard — calendar

Go to `/dashboard/calendar`.

- FullCalendar week view renders existing appointments
- Switch between day / week / month with the buttons in the header
- Click an appointment card → side panel opens with details and action buttons (Confirm, Decline, Cancel)
- Use "Add appointment" button to create a manual booking (opens a form dialog)

To verify appointments appear:
1. Complete a booking via `/book/demo-salon`
2. Return to the calendar — the new appointment should appear in the correct time slot

---

### Dashboard — services

Go to `/dashboard/services`.

- Table lists all services with name, category, duration, price, and active toggle
- Click "הוסף שירות" → dialog opens
- Fill name, category (optional), duration (minutes), price (₪) → Save
- New service appears in the table
- Toggle the active switch — disabled services won't show in the booking flow
- Click the edit icon → pre-populated dialog → update → Save

---

### Dashboard — staff

Go to `/dashboard/staff`.

- Cards for each staff member
- Click "הוסף איש צוות" → dialog: display name, email, bio (optional), avatar URL (optional), bookable toggle
- After creation, click "ערוך שעות" on a staff card to open the weekly schedule editor
- Set working hours for each day of the week
- Click "חופשות" on a staff card to manage days off:
  - **Date range** — block a continuous period (e.g. a full week's holiday)
  - **Specific days** — click individual dates on the mini-calendar to toggle them
  - In both modes, toggle "כל היום" off to set specific hours (e.g. block only the morning)
  - All upcoming blocked periods are listed below the form with a remove button
- Deactivate a staff member — they disappear from the booking flow

**To verify schedule and days off affect availability:**
1. Set staff working hours for today
2. Open the booking flow → Date/time step → today's date → slots should appear
3. Add a days-off block covering today → slots for that staff member should disappear

---

### Dashboard — clients

Go to `/dashboard/clients`.

- Paginated table with search (by name or phone)
- Click a client row → opens detail panel: contact info, visit history, notes, block toggle
- Add a note — saves immediately via tRPC
- Block a client — they are flagged; you can filter by "Blocked" using the toggle

---

### Dashboard — shop (products)

Go to `/dashboard/shop`.

- Products table with image thumbnail, name, price, stock
- Click "הוסף מוצר" → fill in name, price, description, stock (optional)
- If Cloudinary is configured: upload a product photo via drag-and-drop or file picker
- Edit/delete products via the row action buttons

---

### Dashboard — promo codes

Go to `/dashboard/promos`.

- Table of promo codes with type badge (PERCENTAGE / FIXED / FREE_SERVICE / FREE_PRODUCT)
- Click "הוסף קוד הנחה" → form changes based on type selected:
  - PERCENTAGE/FIXED: shows discount value field
  - FREE_SERVICE: shows service selector
  - FREE_PRODUCT: shows product selector
- Copy promo code to clipboard with the copy button
- Expiry date and usage limit are optional

---

### Dashboard — analytics

Go to `/dashboard/analytics`.

- Switch between time periods: this month / last month / 3m / 6m / 12m
- KPI cards: total appointments, revenue, new clients, cancellation rate
- Appointment distribution pie chart (Recharts)
- Top clients list with avatar and visit count
- Promo performance bar chart

To see non-empty charts: complete several bookings and set their status to COMPLETED via the calendar.

---

### Dashboard — settings

Go to `/dashboard/settings`.

**Salon info section:**
- Edit name, slug, phone, address, description
- Upload logo and cover image (requires Cloudinary)
- Save — changes visible immediately in the booking flow header

**Booking settings section:**
- Slot interval (15 / 30 / 60 minutes) — affects how many time slots appear
- Buffer after appointment (minutes)
- Max advance booking days
- Confirmation mode (AUTO vs MANUAL)
- Cancellation window (hours)

**Opening hours section:**
- Toggle closed/open per day
- Set open and close times
- Save — affects availability engine immediately

**WhatsApp template section:**
- Edit the message template using `{{variable}}` tokens
- Live preview on the right updates as you type with sample Hebrew values
- Available tokens: `{{customer_name}}`, `{{salon_name}}`, `{{service_name}}`, `{{staff_name}}`, `{{date}}`, `{{time}}`, `{{cancel_link}}`, `{{rebook_link}}`

---

### Dashboard — plan

Go to `/dashboard/plan`.

- Shows current plan with usage limits
- Full feature comparison table across FREE / BASIC / PRO / ENTERPRISE
- Upgrade CTA buttons (Tranzila payment integration is V2)

---

### Notifications (dev mode without Twilio)

All Twilio messages are logged to the terminal when `TWILIO_ACCOUNT_SID` is not set.  
Look for lines starting with `[DEV]`:

```
[DEV] OTP → +972501234567:
שלום! קוד האימות שלך לסלון דמו הוא: 482916
(תקף ל-10 דקות)

[DEV] Confirmation → +972501234567:
שלום ישראל ישראלי! ✨
התור שלך לתספורת גברים בסלון דמו אושר:
📅 יום שני, 14 באפריל בשעה 10:00
👤 עם דני כהן
לביטול: http://localhost:3000/cancel/...
```

**To test with real Twilio (WhatsApp sandbox):**
1. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM=+14155238886`
2. Send `join <sandbox-keyword>` to the sandbox number from your WhatsApp
3. Run the booking flow with your real phone number
4. OTP and confirmation arrive as WhatsApp messages

---

### Image uploads (dev mode without Cloudinary)

Without Cloudinary env vars, the `ImageUpload` component renders but upload requests return an error.  
To enable: set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

The upload endpoint is at `/api/upload` — it generates a signed upload URL that the client posts to directly. Files never pass through the Next.js server.

---

### Reminder jobs (dev mode without Redis)

BullMQ is configured with ioredis. Without `UPSTASH_REDIS_REST_URL` the queue gracefully fails and logs to the console:

```
[queue] scheduleReminders failed: ...
```

**To test with Redis:**
1. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (or point to local Redis)
2. Complete a booking — two jobs are enqueued: one 24h before, one 1h before the appointment
3. Inspect the queue with `bull-board` or Upstash dashboard

---

### Mobile app (React Native + Expo)

#### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy and fill in the env file
cp apps/mobile/.env.example apps/mobile/.env.local
```

Edit `apps/mobile/.env.local`:

```env
# Use your machine's LAN IP (not localhost) when testing on a physical device.
# On macOS: run `ipconfig getifaddr en0` to find it.
# For Expo Go on the same Wi-Fi network:
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000

# For the iOS Simulator (localhost works fine):
EXPO_PUBLIC_API_URL=http://localhost:3000
```

#### Running

```bash
# Start the Expo dev server
cd apps/mobile
npx expo start

# Then press:
#   i  — open in iOS Simulator
#   a  — open in Android Emulator
#   s  — switch to Expo Go (scan QR on physical device)
```

The web API (`pnpm dev` from the repo root) must be running at the same time.

#### Screen-by-screen walkthrough

**Home screen (`/`)**
- Enter a salon slug (e.g. `demo-salon`) and tap "המשך"
- Navigates to the booking flow for that salon

**Step 1 — Services**
- Services load grouped by category
- Tap any service card to advance

**Step 2 — Staff**
- All bookable staff appear plus a "No preference" option
- If only 1 bookable staff exists the step is automatically skipped
- Tap a card to advance

**Step 3 — Date & Time**
- RTL horizontal date strip shows 14 days
- Tap a date → available slots load in a 3-column grid below
- Tap a slot to advance
- Slots come from the same availability engine as the web — they respect staff schedules, existing appointments, and blocked times

**Step 4 — Details**
- Form: full name (required), phone (required, normalised to E.164), email (optional)
- Booking summary card shows the selected service, date/time, and staff
- Validates with Zod before advancing

**Step 5 — OTP**
- OTP is sent automatically on screen load
- In dev mode (no Twilio): check the terminal running `pnpm dev` for the `[DEV] OTP →` log line
- **Faster alternative:** set `TEST_OTP_CODE=000000` in the web app's `.env.local` — the code will always be `000000`
- Enter the 6 digits — inputs auto-advance; auto-submits when the 6th digit is entered
- Resend available after a 60-second cooldown

**Step 6 — Confirmation**
- `appointments.create` is called once on mount
- Shows a loading spinner, then a success card with booking details
- "קבע תור נוסף" button resets the flow to Step 1

**Cancel screen (`/cancel/[token]`)**
- Deep-link from the WhatsApp confirmation message: `appointly://cancel/<token>`
- Loads appointment details (service, date/time, staff, cancellation window) before any action
- Two cancel methods: one-tap magic-link or SMS OTP (6-digit entry)
- Shows success or error state after cancellation

#### Deep-link testing

```bash
# Trigger the cancel screen directly in the Simulator
npx uri-scheme open "appointly://cancel/<cancel_token>" --ios

# Or via Expo CLI
npx expo open "appointly://cancel/<cancel_token>"
```

Replace `<cancel_token>` with a real UUID from Prisma Studio → Appointment table.

---

## Architecture notes

### tRPC procedures

Three types enforce access control at the middleware level:

| Type | Who can call | Used for |
|------|-------------|---------|
| `publicProcedure` | Anyone | Booking, OTP, availability, cancel by token |
| `protectedProcedure` | Authenticated users | Future: customer account features |
| `salonOwnerProcedure` | Salon owners + admins | All dashboard mutations |

### Availability engine

Slots are **never pre-generated**. On every request:

1. Load service duration + slot interval from salon settings
2. Check salon is open on the requested day (from `SalonHours`)
3. For each bookable staff member:
   - Check they are working that day (from `StaffSchedule`)
   - Compute working window = intersection of staff hours and salon hours
   - Load all `PENDING`/`CONFIRMED` appointments and `StaffBlockedTime` for that day
   - Walk the window in `slot_interval_mins` increments
   - A slot is valid if `slotStart + duration + buffer` fits the window AND has no overlap with any busy period (`aStart < bEnd && bStart < aEnd`)
4. Deduplicate by `(start, staff_id)`, sort chronologically
5. Return ISO UTC timestamps — client renders them in the salon's IANA timezone via `Intl.DateTimeFormat`

### Authentication flow

```
POST /trpc/auth.login
  → bcrypt verify password
  → sign JWT { sub, email, role, salon_id }
  → set httpOnly cookie "appointly_token"
  → return { user }

GET /trpc/auth.me
  → read cookie
  → verify JWT with jose
  → return user from DB

salonOwnerProcedure middleware:
  → verify JWT
  → check user.global_role === 'OWNER' or 'ADMIN'
  → attach { user, salon_id } to context
```

### Booking and OTP flow

```
POST /trpc/verification.sendOTP { phone, salon_id }
  → expire previous active codes for this phone
  → generate 6-digit code
  → hash with HMAC-SHA256(JWT_SECRET, phone:code)
  → store hash + expiry in PhoneVerification
  → send via Twilio (or log in dev)

POST /trpc/verification.verifyOTP { phone, code }
  → find active PhoneVerification record
  → verify HMAC hash
  → mark verified = true
  → return verification_token (UUID v4)

POST /trpc/appointments.create { ..., verification_token }
  → validate verification_token is unused and verified
  → check slot is still free (double-check conflict)
  → upsert SalonClient
  → create Appointment
  → mark token used
  → if AUTO mode: set CONFIRMED, send WhatsApp confirmation, enqueue reminders
```

### RTL & internationalisation

The app is Hebrew-first:

- Root `<html>` has `dir="rtl" lang="he"`
- All Tailwind spacing uses logical properties: `ps-`/`pe-` (padding), `ms-`/`me-` (margin), `start-`/`end-` (positioning) — never `pl-`/`pr-`/`left-`/`right-`
- Font: **Heebo** (Google Fonts) — designed for Hebrew and works well for Latin
- Money: `Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' })`
- Dates: `Intl.DateTimeFormat('he-IL')` always with the salon's IANA timezone
- Locale routing: `next-intl` middleware; translation files at `apps/web/messages/{he,ar,en}.json`

### Database schema (20 models)

```
Salon ──< SalonMember >── User
      ──< SalonSettings
      ──< SalonHours (7 rows, one per weekday)
      ──< Staff ──< StaffSchedule (7 rows per staff)
               └── StaffBlockedTime
      ──< Service ──< ServiceCategory
      ──< Appointment ──> SalonClient
                      ──> Staff
                      ──> Service
      ──< SalonClient ──< Appointment
                      ──< Order ──< OrderItem ──> Product
                      ──< PromoUsage
      ──< Product
      ──< PromoCode ──< PromoUsage
      ──< PhoneVerification
      ──< AppointmentReminder (BullMQ job tracking)

Plan ──< Subscription ──< Salon
```

All appointment queries scope by `salon_id`. No cross-salon data leakage is possible at the query level.

---

## API reference

| Router | Key procedures |
|--------|---------------|
| `auth` | `login`, `logout`, `me`, `register`, `changePassword` |
| `salons` | `create`, `getBySlug`, `update`, `updateHours` |
| `salonSettings` | `get`, `update` |
| `staff` | `list` (public), `listAll`, `createSimple`, `update`, `deactivate`, `setSchedule`, `addBlockedTime`, `listBlockedTimes`, `removeBlockedTime` |
| `services` | `list` (public), `listAll`, `create`, `update`, `toggle` |
| `availability` | `getSlots` (public) |
| `appointments` | `create` (public), `getByToken` (public), `list`, `listForCalendar`, `confirm`, `decline`, `cancelByToken` (public), `requestOTP` (public), `cancelByOTP` (public), `updateStatus` |
| `salonClients` | `getByToken` (public), `list`, `get`, `addNote`, `block`, `unblock` |
| `verification` | `sendOTP` (public), `verifyOTP` (public) |
| `products` | `list`, `create`, `update`, `delete` |
| `orders` | `list`, `create` |
| `promoCodes` | `list`, `create`, `deactivate`, `validate` (public) |
| `analytics` | `overview`, `topClients`, `promoPerformance` |

---

## Pricing plans

| Feature | FREE | BASIC | PRO | ENTERPRISE |
|---------|:----:|:-----:|:---:|:----------:|
| Staff | 1 | 3 | 10 | Unlimited |
| Services | 5 | 20 | 50 | Unlimited |
| Monthly bookings | 50 | 200 | 500 | Unlimited |
| Products / Shop | — | — | ✓ | ✓ |
| Promo codes | — | — | ✓ | ✓ |
| Analytics | — | Basic | Full | Full |
| Custom WhatsApp templates | — | — | ✓ | ✓ |
| API access | — | — | — | ✓ |

---

## Build status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Monorepo scaffold (Turborepo, Next.js 14, Prisma, tRPC v11) | ✅ Done |
| 2 | Dashboard UI shell — sidebar, calendar, services, staff, clients | ✅ Done |
| 3 | Full Prisma schema (20 models) + all tRPC routers | ✅ Done |
| 4 | 5-step booking flow, cancel page, all dashboard pages wired to tRPC | ✅ Done |
| 5 | Auth — email/password (scrypt), Google OAuth, registration, JWT cookies | ✅ Done |
| 6 | Notification service (Twilio/Resend), auto-confirm, phone OTP | ✅ Done |
| 7 | BullMQ reminder jobs (24h + 1h before appointment) | ✅ Done |
| 8 | Cloudinary image uploads (salon logo, staff avatars, product photos) | ✅ Done |
| 9 | Staff step in booking flow, enhanced cancel page, client token pre-fill | ✅ Done |
| 10 | Mobile app (React Native + Expo) | ✅ Done |

---

## Development commands

```bash
# ── Web + API + worker (all at once) ────────────────────────────────────────
pnpm dev                              # Starts Next.js + any Turborepo tasks

# ── Mobile (run separately from the repo root) ───────────────────────────────
cd apps/mobile
npx expo start                        # Interactive: press i / a / s
npx expo start --ios                  # Open straight in iOS Simulator
npx expo start --android              # Open straight in Android Emulator

# ── Type-checking ────────────────────────────────────────────────────────────
pnpm typecheck                        # All packages via Turborepo
npx tsc --noEmit -p apps/web/tsconfig.json
npx tsc --noEmit -p packages/api/tsconfig.json

# ── Linting ──────────────────────────────────────────────────────────────────
pnpm lint

# ── Prisma (always use the local binary, never global) ───────────────────────
PRISMA=packages/db/node_modules/.bin/prisma
SCHEMA=--schema=packages/db/prisma/schema.prisma

$PRISMA studio        $SCHEMA        # GUI browser for all tables
$PRISMA validate      $SCHEMA        # Validate schema without migrating
$PRISMA generate      $SCHEMA        # Regenerate the Prisma client after schema changes
$PRISMA migrate dev   $SCHEMA        # Apply pending migrations in dev
$PRISMA db seed       $SCHEMA        # Re-seed the demo data
$PRISMA migrate reset $SCHEMA        # Drop + recreate + re-seed (wipes all data)
```
