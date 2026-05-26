# Real Estates — Project-Wide Agent Instructions

## What This App Is

A real-estate platform with two surfaces:

- **`web/`** — Next.js 16 web app (admin dashboard, agent portal, public listings)
- **`mobile/`** — React Native + Expo 54 mobile app (buyer/renter-facing, mirrors web features)

Both surfaces share the same backend: the Next.js API routes (`web/src/app/api/`) are the single source of truth. The mobile app is a pure client that calls those routes over HTTP.

---

## Monorepo Structure

```
real-estates/
├── web/          Next.js 16 web app + API backend + DB
└── mobile/       React Native + Expo 54 mobile app
```

There is no shared package between `web/` and `mobile/`. Types are duplicated where needed.

---

## Web App (`web/`)

### Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16.2.4, App Router, `src/` directory |
| Language | TypeScript 5 |
| Styling | Tailwind v4 — CSS-first, `@import "tailwindcss"` in CSS, `@tailwindcss/postcss` plugin, **no** `tailwind.config.js` |
| UI icons | lucide-react |
| Toasts | sonner |
| Charts | react-apexcharts + apexcharts |
| Database | Neon serverless PostgreSQL via `@neondatabase/serverless` |
| ORM | Drizzle ORM (`drizzle-orm/neon-http`) |
| Auth | JWT stored as an httpOnly cookie named `token`; signed/verified with `jsonwebtoken` and `jose` |
| File storage | AWS S3 (pre-signed upload URLs via `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`) |
| Password hashing | bcryptjs |

### Key Files

| File | Purpose |
|---|---|
| `src/db/schema.ts` | Single source of truth for all DB tables and enums |
| `src/db/index.ts` | Drizzle client (Neon HTTP driver) |
| `drizzle.config.ts` | Drizzle Kit config |
| `src/lib/jwt.ts` | `signToken` / `verifyToken` helpers |
| `src/proxy.ts` | Next.js middleware (route auth guard) |

### Database Schema (tables)

`users`, `profiles`, `agents`, `agentCandidates`, `agentRatings`,
`properties`, `inquiries`, `pendingListings`,
`propertyVisitings`, `meetings`, `soldProperties`,
`messages`, `feedItems`

Enums: `user_role` (user/admin/agent), `property_type`, `property_category`, `property_status`, `visiting_status`, `pending_listing_status`, `feed_item_type`, `transaction_type`

### API Routes (`src/app/api/`)

| Path | Methods |
|---|---|
| `/api/auth/register` | POST |
| `/api/auth/login` | POST |
| `/api/auth/logout` | POST |
| `/api/user/me` | GET |
| `/api/user/upload-image` | POST |
| `/api/upload/presign` | POST |
| `/api/properties` | GET, POST |
| `/api/properties/my` | GET |
| `/api/properties/[id]` | GET, PUT, DELETE |
| `/api/inquiries` | GET, POST |
| `/api/visitings` | GET, POST |
| `/api/visitings/my` | GET |
| `/api/visitings/busy-slots` | GET |
| `/api/visitings/by-message/[messageId]` | GET |
| `/api/messages` | GET, POST |
| `/api/pending-listings/[id]` | GET, PUT |
| `/api/pending-listings/[id]/approve` | POST |
| `/api/pending-listings/[id]/decline` | POST |
| `/api/pending-listings/by-message/[messageId]` | GET |
| `/api/agents/[id]/rate` | POST |
| `/api/agents/[id]/my-rating` | GET |
| `/api/agents/[id]/comment` | POST |
| `/api/meetings/my` | GET |
| `/api/meetings/sold` | POST |
| `/api/admin/agents` | GET, POST |
| `/api/admin/agents/[id]` | PUT, DELETE |
| `/api/admin/users/search` | GET |
| `/api/admin/stats` | GET |

### Pages

| Route | Description |
|---|---|
| `/` | Home (HeroSearch) |
| `/auth` | Login / register |
| `/listings` | Property listings with SearchFilters |
| `/properties/[id]` | Property detail + InquiryForm |
| `/properties/new` | Create listing (agent/admin) |
| `/agents/new` | Agent application form |
| `/agents/search` | Agent directory |
| `/feed` | Activity feed |
| `/messages` | Inbox |
| `/profile` | User profile |

### Coding Rules — Web

- **Always use the Drizzle query builder.** Never write raw SQL strings.
- **Tailwind v4** uses the CSS `@import "tailwindcss"` syntax. Do not add a `tailwind.config.js` or use `theme.extend` — customise via CSS variables in the global stylesheet.
- **App Router conventions:** route params are `Promise`-wrapped in Next.js 16 (`const { id } = await params`). Use server components for data fetching; keep `"use client"` minimal.
- **Auth in API routes:** read the cookie with `req.cookies.get("token")`, verify with `verifyToken()` from `src/lib/jwt.ts`. Never trust `Authorization` headers.
- **Protected routes** are enforced in middleware (`src/proxy.ts`). Keep `config.matcher` in sync when adding new protected pages.
- **Images** are stored in S3. Keys (not full URLs) are persisted in the DB. Use the presign endpoint to generate upload URLs; construct the final URL with the public bucket base when rendering.
- Read `node_modules/next/dist/docs/` before using any Next.js API — this version has breaking changes from earlier releases.

---

## Mobile App (`mobile/`)

### Tech Stack

| Concern | Choice |
|---|---|
| Framework | React Native 0.81.5 + Expo ~54.0.33 |
| Navigation | Expo Router v6 (file-based, `app/` directory) |
| Language | TypeScript 5.9 |
| Styling | NativeWind v4 (Tailwind v3 class names on RN components) |
| Icons | lucide-react-native |
| Gestures | react-native-gesture-handler |
| Animation | react-native-reanimated v4 |
| Auth state | React context (`lib/auth-context.tsx`), JWT persisted as an httpOnly cookie |
| Image picking | expo-image-picker |
| Secure storage | expo-secure-store |

### File Structure

```
mobile/
├── app/
│   ├── _layout.tsx              Root layout (GestureHandlerRootView, AuthProvider, Stack)
│   ├── property/[id].tsx        Property detail screen
│   └── (screens)/
│       ├── _layout.tsx          Drawer layout with bottom tabs
│       ├── index.tsx            Home
│       ├── listings/index.tsx   Property listings
│       ├── agents/index.tsx     Agent directory
│       ├── feed.tsx             Activity feed
│       ├── messages.tsx         Inbox
│       ├── profile.tsx          User profile
│       ├── properties/new.tsx   Create listing
│       └── auth.tsx             Login / register
├── lib/
│   ├── api.ts                   Typed fetch wrapper; reads EXPO_PUBLIC_API_URL
│   ├── auth-context.tsx         AuthProvider + useAuth hook
│   └── types.ts                 Shared TypeScript types
└── components/
    ├── AdminPanel.tsx
    ├── Footer.tsx
    └── MessagesButton.tsx
```

### API Communication

The mobile app calls the web API at the base URL in `EXPO_PUBLIC_API_URL` (defaults to `http://localhost:3000`). All requests use `credentials: "include"` so the httpOnly `token` cookie is forwarded automatically by React Native's HTTP stack. **Do not manage tokens manually in the mobile app.**

### Coding Rules — Mobile

- Read the exact versioned Expo docs at **https://docs.expo.dev/versions/v54.0.0/** before using any Expo API.
- NativeWind v4 requires `className` props; do **not** mix with `StyleSheet.create` on the same component unless there is no alternative.
- Navigation is file-based (Expo Router). Add new screens by creating files in `app/`; do not wire up a `NavigationContainer` manually.
- The `(screens)` group uses a drawer/tab layout defined in `app/(screens)/_layout.tsx`. Add new tabs or drawer items there.
- Never store the JWT token in JS memory or `expo-secure-store` — rely on the cookie.

---

## Cross-Cutting Concerns

- **No mock data.** All data comes from the Neon database. Do not seed or fake data in application code.
- **No extra features.** Implement exactly what is asked. Do not add helpers, abstractions, or UI affordances beyond the stated requirement.
- **Environment variables:** `web/` uses `.env.local`; `mobile/` uses `.env` with `EXPO_PUBLIC_` prefix.
- **Dependency management:** `web/` and `mobile/` each have their own `node_modules`. Install packages inside the respective subdirectory.
