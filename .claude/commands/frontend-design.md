# Frontend Design Preflight

Run this checklist silently before writing any UI code. Do not print the checklist — just apply it.

## 1 — Brand Assets

Check `brand_assets/` in the project root right now.

- If a logo exists → use it. Never use a placeholder where the real logo is available.
- If a color palette file exists → extract the exact hex values and use them. Do not invent brand colors.
- If a style guide exists → read it fully before touching any component.

If `brand_assets/` is empty or absent, proceed with the design tokens defined in `apps/web/tailwind.config.ts`:

| Token | Value |
|---|---|
| Primary | `#7C3AED` (brand-600) |
| Background | `#F9FAFB` |
| Foreground | `#111827` |
| Muted | `#6B7280` |
| Border | `#E5E7EB` |

## 2 — RTL / Hebrew First

- Root `<html>` must have `dir="rtl"` and `lang="he"` — already set in `apps/web/src/app/layout.tsx`
- Use `ps-`/`pe-` (padding-start/end) and `ms-`/`me-` (margin-start/end) — never `pl-`/`pr-`/`ml-`/`mr-`
- Use `start-`/`end-` for positioning — never `left-`/`right-`
- All user-facing strings must use `t('key')` via next-intl — never hardcode Hebrew or English text
- Font: **Heebo** (already loaded via Google Fonts in layout.tsx)

## 3 — Typography Rules

- Headings: tight tracking (`-0.03em`), bold weight — use `tracking-tighter font-bold`
- Body text: generous line-height (`1.7`) — use `leading-relaxed`
- Never use the same visual weight for headings and body
- Large display numbers (stats, prices): `tabular-nums` for alignment

## 4 — Color Rules (Anti-Generic Guardrails)

- **Never** use default Tailwind indigo/blue/slate as primary — use `brand-600` (`#7C3AED`)
- Derive all interactive states from `brand-*` scale in tailwind.config.ts
- Backgrounds: use surface layering — `surface-base` → `surface-elevated` → `surface-floating`
- Text hierarchy: `foreground` for primary, `muted` for secondary, `muted-foreground` for hints

## 5 — Shadow System

Use the three shadow tokens — never raw `shadow-md` or `shadow-lg`:

| Token | Use Case |
|---|---|
| `shadow-card` | Cards at rest, table rows |
| `shadow-elevated` | Modals, dropdowns, hover states |
| `shadow-floating` | Tooltips, date pickers, command palette |

## 6 — Animation Rules

- Only animate `transform` and `opacity` — never `transition-all` (causes jank)
- Use spring-style easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` for entrances
- Use `tailwindcss-animate` classes (`animate-in`, `fade-in`, `slide-in-from-bottom-2`)
- Duration: 150ms for micro-interactions, 250ms for panel transitions, 350ms for page-level

## 7 — Interactive States

Every clickable element needs all three states — no exceptions:

```
hover:   brightness or scale shift + color tint
focus-visible: ring-2 ring-brand-600 ring-offset-2
active:  scale-95 or brightness-90
```

Disabled: `opacity-50 cursor-not-allowed` — never just remove click handler.

## 8 — Component Sourcing

1. Check `packages/ui/src/` first — use shared components if they exist
2. Check `components/ui/` in the web app — shadcn components
3. Only build a new component if neither above has what you need
4. Never use `<button>` without the Button component from shadcn
5. Never use raw `<input>` — always wrap in shadcn's Input + FormField pattern

## 9 — Form Rules

Every form must follow this exact pattern — no exceptions:

```tsx
const form = useForm({ resolver: zodResolver(schemaFromPackagesShared) })
// All fields inside <FormField> → <FormControl> → <Input>
// Submit via trpc.mutation inside form.handleSubmit()
```

Never use uncontrolled inputs. Never call tRPC outside `useForm`'s submit handler.

## 10 — Loading & Error States

- Page-level loads: skeleton screens only — never a spinner for a full-page load
- Inline loads (button submit): `<Button disabled><Loader2 className="animate-spin" /></Button>`
- Every tRPC query: handle `isLoading`, `isError`, and empty states explicitly
- Error: render `<ErrorBoundary>` fallback — never silently swallow errors

## 11 — Mobile First

- Start with mobile layout, scale up with `md:` and `lg:` breakpoints
- Touch targets: minimum `h-11` (44px) for anything tappable
- The booking page (`/book/[slug]`) is primarily mobile — design it phone-first

## 12 — Depth / Layering

Surfaces must not all sit at the same z-plane. Use this system:

| Layer | bg | shadow |
|---|---|---|
| Base | `bg-background` | none |
| Card | `bg-white` | `shadow-card` |
| Elevated | `bg-surface-elevated` | `shadow-elevated` |
| Floating | `bg-white` | `shadow-floating` |

## 13 — Monetary & Date Display

- Money: always `Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' })`
  → helper exists in `apps/web/src/lib/utils.ts` as `formatPrice()`
- Dates: always `Intl.DateTimeFormat('he-IL')` with the salon's timezone
  → helper exists as `formatDate()` and `formatTime()` in the same file
- Never hardcode `₪` — use the formatter

## Confirmation Before Proceeding

After reading this checklist, confirm with a single sentence what you are about to build, then write the code. Do not print this checklist back to the user.
