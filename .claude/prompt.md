Prompt: Mobile-Responsive Web Dashboard + Expo App Fixes
Context
We are working on Appointly — a multi-tenant SaaS for Israeli salons. It is a Turborepo monorepo with:

apps/web — Next.js 14 App Router (dashboard + booking pages)
apps/mobile — React Native + Expo
packages/api — tRPC v11 routers
packages/db — Prisma + PostgreSQL
The stack: Next.js 14, tRPC v11, Prisma, Tailwind CSS, shadcn/ui, Zustand, TanStack Query. RTL Hebrew-first app — always use start/end instead of left/right, dir="rtl" on root.

Part 1 — Mobile-Responsive Web Dashboard (apps/web)
Problem: The dashboard (/dashboard/*) is not responsive at all when opened on a mobile browser. The sidebar is 256px wide and breaks the layout completely. The calendar page is especially broken — text overlaps, columns collapse. The UX is unusable on any screen below 1024px.

Goal: Make the full dashboard mobile-responsive without touching the desktop layout. Desktop (≥ lg / 1024px) stays exactly as-is with the existing sidebar. Below lg, switch to a mobile-native UX pattern.

Mobile Navigation Pattern (below lg)
Implement both of the following:

A — Bottom Tab Bar (fixed at bottom of screen)
Five primary tabs:

סקירה כללית (Overview) — LayoutDashboard icon
לוח שנה (Calendar) — Calendar icon
לקוחות (Clients) — Users icon
צוות (Staff) — UserSquare2 icon
שירותים (Services) — Scissors icon
Active tab uses the existing brand color (brand-600 / #7C3AED purple). Inactive tabs are muted gray. Tab bar has a subtle top border and white/background fill. Safe area aware (for iPhone notch/home indicator).

B — Hamburger Menu (top header bar)
On mobile, replace the sidebar with a top header bar containing:

App name/logo on the right (RTL)
Hamburger icon button on the left
Tapping the hamburger slides in a full-screen drawer from the right (RTL direction) containing:

All navigation items including secondary ones: חנות, קודי הנחה, ניתוח נתונים, הגדרות, תוכנית
User profile section at the bottom (name, email, logout button)
Close button at the top
The drawer overlays content with a dark backdrop. Tapping the backdrop closes it.

Calendar — Mobile Simplified View
On mobile (< lg), replace FullCalendar with a custom simplified day view:

Large date display at the top (e.g., "יום שלישי, 14 באפריל")
Left/right arrows to navigate previous/next day
"היום" (Today) button to jump back to current date
Scrollable vertical timeline of the day showing appointment cards
Each appointment card shows: customer name, service name, staff name, time, status badge (color-coded: PENDING=yellow, CONFIRMED=green, CANCELLED=red, COMPLETED=gray)
If no appointments: empty state with an icon and message
Desktop (≥ lg) keeps FullCalendar exactly as it is today
Priority Order for Implementation
Fix screens in this order:

Layout + navigation — the bottom tab bar + hamburger drawer (this unblocks everything else)
Overview (/dashboard) — stat cards should stack vertically, full width on mobile
Calendar (/dashboard/calendar) — replace with simplified day view on mobile
Clients (/dashboard/clients) — table → card list on mobile, search bar full width
Staff (/dashboard/staff) — staff cards stack vertically
Services (/dashboard/services) — service rows stack into cards
Remaining pages (Shop, Promos, Analytics, Settings, Plan) — apply consistent mobile card/list patterns
General Mobile Rules
All data tables become card lists on mobile (no horizontal scrolling tables)
All modals/dialogs: full-screen on mobile, centered dialog on desktop
All forms: full-width inputs, larger tap targets (min 44px height)
Page padding: p-4 on mobile, p-6 lg:p-8 on desktop
Keep all colors, fonts, and branding identical to desktop
Do not break or change any desktop styles — mobile-only changes via Tailwind responsive prefixes (lg:)
RTL rules apply everywhere: ps-, pe-, ms-, me-, start-, end-
Part 2 — Expo Mobile App (apps/mobile)
This is a separate React Native + Expo app (Expo Router, SDK 51). The mobile app has its own issues to fix — these will be defined in a follow-up session once Part 1 is complete.

For now, to run and test the Expo app:


cd apps/mobile && npx expo start
Then scan the QR code with Expo Go on a physical device (same Wi-Fi), or press i for iOS Simulator (requires Xcode).

Codebase Locations
Dashboard layout: apps/web/src/app/(dashboard)/layout.tsx
Sidebar component: apps/web/src/features/dashboard/DashboardSidebar.tsx
Overview page: apps/web/src/features/dashboard/DashboardOverview.tsx
Calendar page: apps/web/src/features/dashboard/CalendarPage.tsx
Clients page: apps/web/src/features/dashboard/ClientsPage.tsx
Staff page: apps/web/src/features/dashboard/StaffPage.tsx
Services page: apps/web/src/features/dashboard/ServicesPage.tsx
Rules to Follow
Never use left/right — always start/end
Never use any in TypeScript
Run npx tsc --noEmit after every file change
Never call Prisma directly from components — use tRPC
All user-facing strings use t('key') via next-intl