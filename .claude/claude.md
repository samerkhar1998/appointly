---

# FULL-STACK APP RULES (Salon Booking Platform)

## Build Phases — Completion Status

| Phase | Description | Status |
|---|---|---|
| 1 | Monorepo scaffold (Turborepo, Next.js 14, Prisma, tRPC v11) | ✅ Done |
| 2 | Dashboard UI shell — sidebar, calendar, services, staff, clients | ✅ Done |
| 3 | Full Prisma schema + all tRPC routers | ✅ Done |
| 4 | Booking flow (5-step), cancel page, all dashboard pages wired to tRPC | ✅ Done |
| 5 | Auth — email/password (scrypt), Google OAuth, registration page, JWT cookies | ✅ Done |
| 6 | Notification service (Twilio/Resend), auto-confirm, phone OTP cancellation | ✅ Done |
| 7 | BullMQ reminder jobs (24h + 1h before appointment) | ✅ Done |
| 8 | Cloudinary image uploads (salon logo, staff avatars, product photos) | ✅ Done |
| 9 | Mobile app (React Native + Expo) | ✅ Done |
| 9b | Public/private business discovery — search homepage, invite links, My Salons page | ✅ Done |
| 9c | Mobile auth — customer login (OTP), owner login/register, role-based tab layout | ✅ Done |
| 9d | CustomerProfile — persistent customer identity; name stored after first OTP; pre-fill booking details; OTP skip for known customers | ✅ Done |
| 9e | In-app appointment cancellation — cancel from My Appointments tab; owner-configured window; cancellation policy on salon profile | ✅ Done |
| 10 | Test suite — happy-path tests for every tRPC procedure | 🔜 Next |
| 11 | Tranzila payment integration — subscription billing + plan enforcement | 🔜 Next |
| 12 | Expo Push Notifications — booking confirmations + reminders on mobile | 🔜 Next |
| 13 | Production deployment — Vercel + Supabase + Upstash + EAS Build | 🔜 Next |
| 14 | App Store + Play Store submission via EAS | 🔜 Next |

## Immediate Gaps (known issues to fix before shipping)

| Gap | Location | Notes |
|-----|----------|-------|
| OTP rate limit missing | `verification.router.ts`, `appointments.router.ts` | Requires 3 sends/hour per phone; currently only attempt-count limit exists |
| No test coverage | All tRPC routers | Every procedure needs at least one happy-path test |
| Tranzila not wired | `plan/page.tsx` upgrade CTAs → nowhere | `Subscription` model exists in schema; no payment flow implemented |
| Mobile push notifications | `apps/mobile` | Expo Notifications not set up; customers get no native push alerts |
| `?client=TOKEN` not handled on mobile | `apps/mobile/app/book/[slug]/index.tsx` | Web supports pre-fill + OTP skip; mobile ignores the param |
| Reviews router/UI missing | Schema has `Review` model | No router, no dashboard UI, no post-appointment prompt |
| Owner cancellation approval flow missing | `appointments.router.ts` | Cancellations outside the window should require owner approval; currently not implemented |

## Concurrency & Race Condition Rules

### Booking — per-staff mutex (`appointments.create`)
- The `create` procedure holds a `SELECT ... FOR UPDATE` row-level lock on the `Staff` row for the duration of the booking transaction
- This serialises concurrent booking requests for the same staff member at the database level — no two bookings for the same staff member can run the conflict check simultaneously
- The conflict check, verification-token invalidation, client upsert, and `appointment.create` all happen inside that single locked transaction
- **Never move the conflict check outside the transaction** — doing so re-introduces the TOCTOU race

### Cancellation — atomic conditional update
- All cancel procedures (`cancelByToken`, `cancelByPhone`, `cancelByOTP`) use `updateMany` with `status: { not: 'CANCELLED' }` in the WHERE clause instead of a separate read + update
- If `result.count === 0` after the update, the appointment was already cancelled by a concurrent request → throw `BAD_REQUEST`
- **Never use `findFirst` then `update` for cancellation** — the gap between them allows double-cancellation

### Client-side CONFLICT handling
- When `appointments.create` returns `CONFLICT`, the booking flow must navigate the user back to the datetime step and show a toast — never show a generic error screen for this code
- Web: `StepConfirmation` calls `onSlotTaken()` on `err.data?.code === 'CONFLICT'`; `BookingFlow.handleSlotTaken` clears `start_datetime`/`staff_id` and sets step to `'datetime'`
- Mobile: `confirmation.tsx` navigates to `/book/[slug]/datetime` on `CONFLICT`
- i18n keys for the "slot taken" message: `slot_taken_title`, `slot_taken_body`, `slot_taken_cta` (present in he/en/ar)

## Mobile Auth — Architecture & Rules

### Roles
- `GUEST` — chose "continue without account"; sees Discover tab by default
- `CUSTOMER` — verified via phone OTP; sees Home/Discover/Appointments/Profile tabs
- `SALON_OWNER` — email/password JWT; sees Calendar/Clients/Services/Profile tabs

### Auth Store (`apps/mobile/src/store/auth.ts`)
- Zustand store persisted via AsyncStorage
- Always use `loginAsCustomer(phone, name)`, `loginAsOwner(user, token)`, `loginAsGuest()` — never write to AsyncStorage directly
- `hydrate()` is called once on app mount in `_layout.tsx` — do not call it elsewhere
- `loginAsCustomer` also saves the phone to `@appointly/customer_phone` so the Home tab can load appointments without a prompt

### JWT on Mobile
- The server sets an httpOnly cookie AND returns `token` in the response body
- Mobile stores the JWT token in AsyncStorage (`@appointly/auth_token`) and sends it via `Authorization: Bearer TOKEN` header
- The `context.ts` `getUserFromRequest` supports both cookie (web) and Bearer token (mobile) — no changes needed there
- **Never pass `token: ''` to `loginAsOwner`** — always use `result.token` from the `auth.login` / `auth.register` response

### Tab Layout (`apps/mobile/app/(tabs)/_layout.tsx`)
- Dynamically switches between `CUSTOMER_TABS` and `OWNER_TABS` based on `user.role`
- Hidden tabs (not in the active role's list) are registered with `tabBarButton: () => null` to prevent Expo Router 404s
- Customer tabs (RTL order): profile → my-appointments → discover → index
- Owner tabs (RTL order): profile → owner-services → owner-clients → owner-calendar
- After customer login: navigate to `/(tabs)/profile`
- After owner login: navigate to `/(tabs)/owner-calendar`

### RootRedirect (`apps/mobile/app/_layout.tsx`)
- Handles cold-start routing only (app launch)
- Routes: no onboarding → `/onboarding`; no user → `/auth`; GUEST → `/(tabs)/discover`; OWNER → `/(tabs)/owner-calendar`; CUSTOMER → `/(tabs)/profile`
- Do NOT add continuous redirect logic here — it competes with in-app navigation calls

### OTP Bypass (development only)
- Set `TEST_OTP_CODE=000000` in `.env` — every OTP will accept `000000`; NEVER set in production
- Server uses `TEST_OTP_CODE ?? '000000'` in non-production; value is blocked entirely in production
- Mobile client reads `EXPO_PUBLIC_TEST_OTP_CODE` for the hint banner; web reads `NEXT_PUBLIC_TEST_OTP_CODE`
- Mobile shows a yellow dev hint banner (`__DEV__`) displaying the bypass code on the OTP step
- Web booking flow shows the same hint when `NODE_ENV !== 'production'`

### Icon Component (`apps/mobile/src/components/ui/Icon.tsx`)
- Backed by `lucide-react-native` — NOT Ionicons
- Map new icon names in `ICON_MAP` before using them; unknown names log a warning and render nothing
- Add filled variants to `FILLED_VARIANTS` set for thicker stroke weight

### Home Tab & Auth State
- The Home tab reads the customer's phone from the auth store first (`user.phone`), falling back to AsyncStorage
- When a user enters their phone in the Home tab prompt, `loginAsCustomer` is called — this syncs the auth store so Profile reflects the correct state
- Never write `@appointly/customer_phone` directly from UI — always go through `loginAsCustomer`

### CustomerProfile — Persistent Customer Identity
- Model: `CustomerProfile` (keyed by `phone`, unique index)
- Created/updated after first successful OTP verification via `verification.setCustomerName`
- `verification.verifyOTP` returns `customer_name: string | null` — if non-null, skip the name step
- `verification.issueTokenForKnownCustomer` — issues a pre-verified `PhoneVerification` token for customers with an existing `CustomerProfile`; used by the booking flow to skip OTP entirely
- Never re-prompt for name if `CustomerProfile` exists — check on every OTP login

### Booking Flow — Logged-In Customer
- When `user.role === 'CUSTOMER'` and `user.phone` is set, the Details step pre-fills name and phone from the auth store
- Phone field is non-editable for logged-in customers
- `onSubmit` calls `issueTokenForKnownCustomer` → stores `verification_token` → navigates directly to Confirmation (skips OTP screen)
- If `issueTokenForKnownCustomer` fails (network error etc.), fall back to the standard OTP screen

### In-App Appointment Cancellation
- `appointments.cancelByPhone` — public procedure; validates `CustomerProfile` exists for phone, appointment belongs to that phone, enforces `cancellation_window_hours`, then cancels
- `appointments.getByPhone` returns `cancel_token` (null if already used) and `cancellation_window_hours` per appointment
- `salons.getPublicProfile` returns `cancellation_window_hours` from `SalonSettings` (default 24)
- My Appointments tab: cancel button calls `cancelByPhone` for logged-in customers; navigates to `/cancel/[token]` for guests
- Cancellation policy section shown on salon profile page using `cancel_policy_label` / `cancel_policy_value` / `cancel_policy_free` i18n keys
- `SalonSettings.cancellation_window_hours = 0` means free cancellation at any time

### Private Invite Flow
- `SalonInvite` model: `token` (UUID), `salon_id`, `expires_at`
- `salons.getInvites` — list all active invites for a salon (owner only)
- `salons.revokeInvite` — delete an invite by ID (owner only)
- Invite landing screen (`/invite/[token]`): two CTAs — "View Business" → `/salon/[slug]?invite=[token]`, "Book Appointment" → `/book/[slug]?invite=[token]`
- Web settings page has an invite management panel showing active links with revoke buttons

## Stack — Always Use These, No Exceptions
- **Framework:** Next.js 14 App Router (TypeScript, strict mode)
- **API:** tRPC v11 + Zod (end-to-end type safety — no REST endpoints)
- **ORM:** Prisma → PostgreSQL (Supabase)
- **Auth (web):** Salon owners only — JWT via jose, stored in httpOnly cookies
- **Auth (mobile):** JWT returned in response body, stored in AsyncStorage, sent via Bearer header
- **Styling:** Tailwind CSS + shadcn/ui (via 21st.dev where applicable)
- **State:** Zustand for client state, TanStack Query via tRPC for server state
- **Email:** Resend
- **WhatsApp/SMS:** Twilio
- **File Storage:** Cloudinary
- **Job Queue:** BullMQ + Redis (Upstash)
- **Payments (V2):** Tranzila (Israel-native)
- **Mobile:** React Native + Expo (separate workspace — do not mix with web)

## Project Structure — Always Follow This
/apps
/web          ← Next.js app (dashboard + booking pages)
/mobile       ← React Native + Expo
/packages
/api          ← tRPC router definitions
/db           ← Prisma schema + migrations + seed
/shared       ← Zod schemas, types, constants shared across apps
/ui           ← Shared shadcn/ui component library

- Monorepo managed with **Turborepo**
- Never mix web and mobile code
- Never put business logic in components — it belongs in tRPC procedures
- Never import from `apps/` inside `packages/` — only the reverse

## File & Naming Conventions
- Components: PascalCase — `BookingCard.tsx`
- tRPC routers: camelCase — `appointmentsRouter.ts`
- Utilities: camelCase — `formatSlot.ts`
- Prisma models: PascalCase singular — `Appointment`, `SalonClient`
- Database columns: snake_case — `start_datetime`, `cancel_token`
- Env vars: SCREAMING_SNAKE_CASE — `TWILIO_AUTH_TOKEN`
- Always co-locate: `ComponentName/index.tsx` + `ComponentName.test.tsx`

## RTL & Internationalisation — Critical for This Project
- The app serves Israeli salons — Hebrew is the primary language
- **Always add `dir="rtl"` to the root `<html>` element**
- Use `start`/`end` instead of `left`/`right` in Tailwind: `ps-4` not `pl-4`, `me-2` not `mr-2`
- Use `ms-auto` not `ml-auto` for RTL-safe alignment
- All shadcn/ui components must be verified RTL-compatible before use
- Use `next-intl` for i18n — support Hebrew (he), Arabic (ar), English (en)
- Translation files live in `/apps/web/messages/[locale].json`
- Mobile i18n: string catalogues in `apps/mobile/src/lib/i18n/` (he.ts is the master locale; en.ts and ar.ts must have the same keys)
- Never hardcode user-facing strings — always use `t('key')`
- Font for Hebrew/Arabic: **Heebo** (Google Fonts) — clean, widely used, great RTL support
- Font for English display: pair with a distinctive Latin display font

## tRPC Rules
- All procedures must have a Zod input schema — never use `z.any()`
- Use `protectedProcedure` for any route that requires salon owner auth
- Use `publicProcedure` for booking pages, OTP, availability, cancel by token
- Never call Prisma directly from components — always through tRPC
- Error messages must be user-facing safe (no raw DB errors leaked)
- `salon_id` on `sendOTPSchema` is optional — customer-only flows (e.g. mobile login) omit it
- Routers: `auth`, `salons`, `salonSettings`, `staff`, `services`, `availability`,
  `appointments`, `salonClients`, `orders`, `products`, `promoCodes`, `analytics`, `verification`

## Prisma / Database Rules
- Always run `prisma generate` after schema changes
- Never use raw SQL unless absolutely necessary — use Prisma query API
- All tables must have: `id` (cuid), `created_at`, `updated_at`
- Soft deletes preferred — add `deleted_at` rather than hard deleting client data
- Every query that touches appointments must scope by `salon_id` — never query globally
- Use Prisma transactions for any operation that touches 2+ tables atomically
- For mutations with a read-then-write pattern on the same row, use `SELECT ... FOR UPDATE` (via `tx.$queryRaw`) inside the transaction to prevent TOCTOU races
- Prefer `updateMany` with a conditional WHERE over `findFirst` + `update` when atomicity matters (e.g. status-guarded cancellations)

## Availability Engine — Core Algorithm Rules
- Never pre-generate slots — calculate dynamically from intervals
- A slot is valid if: within staff working hours AND within salon hours AND
  no overlap with existing appointments (including buffer) AND not in a blocked period
- Always query in the salon's timezone (stored on Salon table)
- Return slots in 15-minute increments minimum
- A slot's end = start + service.duration_mins + buffer_after_mins
- Conflicts: start < existing.end AND end > existing.start

## Component Architecture Rules
- **Page components:** Data fetching only — no JSX logic, no styling decisions
- **Feature components:** Business logic + layout — lives in `/features/[domain]/`
- **UI components:** Pure presentational — lives in `/packages/ui/`
- Never fetch data inside a UI component
- Loading states: always use skeleton screens — never spinners for page-level loads
- Error states: always render an error boundary fallback — never silent failures
- Every form must use `react-hook-form` + Zod resolver — no uncontrolled inputs

## Booking Page Rules (`/book/[slug]`)
- This is a public page — no auth required
- Must work perfectly on mobile (most customers will use phones)
- OTP verification flow: verify → lock phone field → issue token → submit with token
- Phone field: always validate E.164 format with `libphonenumber-js`
- If `?client=TOKEN` query param exists: pre-fill form, skip OTP
- After slot selected: hold it optimistically — show "held for 10 min" countdown
- Booking confirmation page: show WhatsApp-style message preview of what they'll receive

## Dashboard Rules (`/dashboard/*`)
- Salon owner only — redirect to `/login` if no valid session
- Calendar: use `@fullcalendar/react` with day/week views
- All monetary values: display in ILS (₪) — format with `Intl.NumberFormat('he-IL')`
- All dates: display in Israeli locale — `Intl.DateTimeFormat('he-IL')`
- Tables: use TanStack Table (via shadcn DataTable pattern)
- Charts: use Recharts — match the dashboard color palette

## WhatsApp Template Rules
- Templates have variables: `{{customer_name}}`, `{{salon_name}}`, `{{service_name}}`,
  `{{staff_name}}`, `{{date}}`, `{{time}}`, `{{cancel_link}}`, `{{rebook_link}}`
- Always render a live preview as the owner types — update in real time
- Validate that all `{{variable}}` tokens are from the allowed list before saving
- Never send a message without a validated, Twilio-registered template ID

## Security Rules
- Never expose internal IDs in URLs — use slugs or opaque tokens
- `cancel_token` and `client_token`: always UUID v4, single-use, checked server-side
- OTP codes: HMAC-SHA256 hashed in DB — never stored in plain text
- Rate limit: OTP send = 3/hour per phone, OTP verify = 5 attempts then expire
- All Prisma queries in public procedures must explicitly scope to `salon_id`
- Never return password hashes, tokens, or internal metadata to the client
- JWT returned in auth response body is safe — it is the same token set as the cookie

## Environment Variables — Always Required

```
# Database
DATABASE_URL=

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

# Resend (email)
RESEND_API_KEY=

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_APP_URL=

# Mobile (Expo)
EXPO_PUBLIC_API_URL=              ← set to your local machine IP for device/emulator testing (e.g. http://192.168.1.x:3000)

# Testing (optional — dev/test only)
TEST_OTP_CODE=                    ← when set, every OTP accepts this fixed code (e.g. "000000"); NEVER set in production
EXPO_PUBLIC_TEST_OTP_CODE=        ← mirrors TEST_OTP_CODE for mobile OTP hint display only
NEXT_PUBLIC_TEST_OTP_CODE=        ← mirrors TEST_OTP_CODE for web OTP hint display only
```

## What Claude Should Always Do
- Read the `frontend-design` skill before any UI work
- Run `npx tsc --noEmit` after every file change — fix all type errors before moving on
- Run `npx prisma validate` after every schema change
- Never leave a `TODO` in committed code — implement it or open a clearly named issue
- After creating any tRPC procedure, write at least one happy-path test
- When in doubt about a product decision, refer to `/docs/blueprint.md`
  (this is the system design document — the source of truth)

## What Claude Must Never Do
- Never use `any` in TypeScript — use `unknown` and narrow properly
- Never call `console.log` in production code — use a proper logger
- Never hardcode phone numbers, API keys, or URLs — always use env vars
- Never skip Zod validation on tRPC inputs
- Never write a raw `fetch()` to the backend from a component — use tRPC client
- Never use `left`/`right` CSS properties — use `start`/`end` for RTL safety
- Never create a new UI component when a shadcn/ui equivalent exists
- Never write directly to `@appointly/customer_phone` AsyncStorage key — always use `loginAsCustomer()`
- Never pass `token: ''` to `loginAsOwner` — always use the token returned from `auth.login` / `auth.register`
