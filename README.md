# Real Estates

A full-stack real-estate platform with a Next.js web app and a React Native mobile app sharing a single backend.

## Web
https://realestatedimitarapp.netlify.app/

---

## Table of Contents

1. [Project Description](#1-project-description)
2. [Architecture](#2-architecture)
3. [Database Schema](#3-database-schema)
4. [Local Development Setup](#4-local-development-setup)
5. [Key Folders and Files](#5-key-folders-and-files)

---

## 1. Project Description

Real Estates is a property listing and management platform with three user roles:

| Role | Capabilities |
|---|---|
| **Guest** | Browse listings, search by filters, view property details and agent profiles |
| **User** | All guest actions + register/login, schedule property viewings, send messages, submit agent-candidacy applications, rate and comment on agents, create listing requests (via messaging an agent), view personal feed |
| **Agent** | All user actions + create and manage own property listings, receive and handle viewing requests, manage meetings, mark sales |
| **Admin** | Full platform access — approve/decline pending listings, promote users to agents, manage all agents and users, view platform statistics |

Core features:

- Property listings with rich filtering (type, status, category, price, location)
- Property detail pages with image gallery and inquiry form
- Agent directory with ratings, reviews, and comments
- In-app messaging between users and agents
- Property viewing scheduler with busy-slot detection
- Activity feed (new listings, agent activity, reviews, market updates)
- User profiles with avatar, cover photo, and social links
- Image uploads to AWS S3 via pre-signed URLs
- JWT-based authentication shared by both web and mobile

---

## 2. Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                               │
│                                                              │
│   ┌───────────────────────┐   ┌───────────────────────┐     │
│   │    Web Browser        │   │  iOS / Android App    │     │
│   │  Next.js 16 (SSR/RSC) │   │  React Native 0.81    │     │
│   │  Tailwind v4          │   │  Expo 54 / NativeWind  │     │
│   └──────────┬────────────┘   └──────────┬────────────┘     │
└──────────────┼──────────────────────────┼─────────────────────┘
               │  same-origin             │  EXPO_PUBLIC_API_URL
               │  (cookie auto-sent)      │  credentials: "include"
               ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js API Routes (web/)                    │
│                                                              │
│  /api/auth/*   /api/user/*   /api/properties/*              │
│  /api/agents/* /api/messages /api/visitings/*               │
│  /api/meetings /api/admin/*  /api/upload/presign            │
│                                                              │
│  Auth: httpOnly JWT cookie  •  bcryptjs password hashing    │
│  Middleware: src/proxy.ts (route-level auth guard)          │
└──────────────────────────┬──────────────────────────────────┘
                           │
               ┌───────────┴───────────┐
               │                       │
               ▼                       ▼
┌──────────────────────┐   ┌───────────────────────┐
│  Neon PostgreSQL      │   │  AWS S3               │
│  Drizzle ORM          │   │  Property images      │
│  (drizzle-orm/        │   │  Avatars / covers     │
│   neon-http)          │   │  Pre-signed uploads   │
└──────────────────────┘   └───────────────────────┘
```

### Front-End (Web)

- **Framework:** Next.js 16.2.4 with the App Router and `src/` directory layout
- **Rendering:** Server Components handle data fetching; `"use client"` components are used only for interactivity
- **Styling:** Tailwind v4 — configured entirely in CSS via `@import "tailwindcss"` (no `tailwind.config.js`)
- **Key libraries:** `lucide-react` (icons), `sonner` (toasts), `react-apexcharts` (admin charts), `react-spinners` (loading states)

### Back-End (API)

- **Transport:** Next.js Route Handlers (`app/api/` directory) — all JSON over HTTP
- **Authentication:** On login, the server sets two cookies:
  - `token` — httpOnly JWT (7-day expiry), used for API auth
  - `user-info` — non-httpOnly JSON (id, username, role), read client-side by the Navbar
- **Route protection:** `src/proxy.ts` (Next.js middleware) redirects unauthenticated users away from protected pages and authenticated users away from the auth page
- **File uploads:** API route `/api/upload/presign` generates a pre-signed S3 PUT URL; the client uploads directly to S3

### Database

- **Provider:** [Neon](https://neon.tech) serverless PostgreSQL
- **ORM:** Drizzle ORM with the `neon-http` driver
- **Schema:** `web/src/db/schema.ts` — single source of truth for all tables and enums
- **Migrations:** managed with `drizzle-kit` (`drizzle/` output directory)

### Mobile App

- **Framework:** React Native 0.81.5 with Expo 54 (New Architecture enabled)
- **Navigation:** Expo Router v6 (file-based, mirrors the web route structure)
- **Styling:** NativeWind v4 (Tailwind v3 class names on React Native components)
- **Auth state:** `lib/auth-context.tsx` — `AuthProvider` wraps the entire app; the user object is cached in `expo-secure-store` for instant re-hydration on launch
- **API calls:** `lib/api.ts` — a typed fetch wrapper that sends `credentials: "include"` so the httpOnly cookie is forwarded automatically by React Native's HTTP stack

### Component Communication

```
Mobile AuthProvider
  └─ reads cached user from expo-secure-store on mount
  └─ validates against /api/user/me
  └─ exposes { user, login, register, logout } via useAuth()

Web Navbar
  └─ reads user-info cookie (non-httpOnly) on client
  └─ shows role-based navigation links

API Routes
  └─ extract token from cookies
  └─ call verifyToken() → JwtPayload { id, email, username, role }
  └─ use role to gate admin/agent-only operations
```

---

## 3. Database Schema

### Entity Relationship Diagram

```
users
├── id (PK)
├── username (unique)
├── email (unique)
├── password (hashed)
├── role: user | admin | agent
├── avatarKey, coverKey (S3 keys)
└── location, facebookUrl, linkedinUrl, twitterUrl

profiles (1:1 with users)
├── id (PK)
├── userId (FK → users.id)
└── officePhone, mobilePhone, contactEmail

agents
├── id (PK)
├── userId (FK → users.id, nullable)   ←── links agent record to a user account
├── name, specialty, city, image
├── rating, reviews, experience
└── phone, email (unique), featured

agentCandidates
├── id (PK)
├── userId (FK → users.id)
└── username, personalInfo, education, workExperience, skills, availability

agentRatings
├── id (PK)
├── agentId (FK → agents.id)
├── userId  (FK → users.id)
├── rating (1–5)
└── comment

properties
├── id (PK)
├── title, description, address, city, state, zipCode, country
├── price, squareFeet, lotSize, yearBuilt
├── type: house | apartment | condo | townhouse | land | commercial
├── status: for_sale | for_rent | sold | rented
├── category: standard | luxury | affordable | development
├── bedrooms, bathrooms, garage, pool
├── images (text[])  ←── S3 keys
└── listedByAgentId (FK → agents.id, nullable)

inquiries
├── id (PK)
├── propertyId (FK → properties.id, cascade)
└── name, email, phone, message

propertyVisitings
├── id (PK)
├── userId     (FK → users.id, cascade)
├── propertyId (FK → properties.id, cascade)
├── messageId  (FK → messages.id, nullable)
├── visitDate, hour
└── status: pending | confirmed | cancelled

messages
├── id (PK)
├── senderId   (FK → users.id, cascade)
├── receiverId (FK → users.id, cascade)
├── subject, message
└── sentAt, seenAt

pendingListings
├── id (PK)
├── messageId   (FK → messages.id, nullable)
├── agentId     (FK → agents.id, cascade)
├── submittedBy (FK → users.id, nullable)
├── status: pending | approved | declined
├── propertyData (jsonb)   ←── full property payload before approval
└── createdAt, reviewedAt

meetings
├── id (PK)
├── agentId (FK → agents.id, cascade)
├── meetingDate, propertyTitle, propertyAddress
├── requesterUsername, requesterPhone, requesterEmail
└── markedSoldAt

soldProperties
├── id (PK)
├── propertyName, agent, buyer
├── transactionType: bought | rented
└── dateOfBuying

feedItems
├── id (PK)
├── type: listing | agent_activity | review | market_update
└── content (jsonb)
```

### Key Relationships

```
users ──1:1──► profiles
users ──1:1──► agents (via agents.userId)
users ──1:N──► agentCandidates
users ──1:N──► agentRatings
users ──1:N──► propertyVisitings
users ──1:N──► messages (as sender)
users ──1:N──► messages (as receiver)

agents ──1:N──► properties
agents ──1:N──► agentRatings
agents ──1:N──► pendingListings
agents ──1:N──► meetings

properties ──1:N──► inquiries
properties ──1:N──► propertyVisitings

messages ──1:1──► propertyVisitings (optional link)
messages ──1:1──► pendingListings   (optional link)
```

---

## 4. Local Development Setup

### Prerequisites

- Node.js 20+
- npm 10+
- A [Neon](https://neon.tech) database (free tier is sufficient)
- An AWS S3 bucket with an IAM user that has `s3:PutObject` / `s3:GetObject` permissions
- Expo Go app on a physical device **or** Android/iOS simulator (for mobile development)

### 1. Clone the repository

```bash
git clone <repo-url>
cd real-estates
```

### 2. Set up the Web app

```bash
cd web
npm install
```

Create `web/.env.local`:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require

JWT_SECRET=<long-random-string>

AWS_REGION=<e.g. eu-central-1>
AWS_ACCESS_KEY_ID=<your-key-id>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_S3_BUCKET=<your-bucket-name>
```

Run database migrations:

```bash
npm run db:push        # push schema to Neon (dev)
# or
npm run db:generate    # generate migration files
npm run db:migrate     # apply migration files
```

Start the dev server (listens on all interfaces so the mobile app can reach it):

```bash
npm run dev            # http://0.0.0.0:3001
```

### 3. Set up the Mobile app

In a separate terminal:

```bash
cd mobile
npm install
```

Create `mobile/.env`:

```env
# Use your machine's LAN IP so the device/emulator can reach the web dev server
EXPO_PUBLIC_API_URL=http://192.168.x.x:3001
```

Start the Expo dev server:

```bash
npm start              # scan QR code with Expo Go, or press a/i for emulator
```

### 4. Database GUI (optional)

```bash
cd web
npm run db:studio      # opens Drizzle Studio at https://local.drizzle.studio
```

### 5. Creating the first admin user

Register a normal account through the web UI, then use Drizzle Studio (or a direct SQL query) to set that user's `role` to `'admin'`.

---

## 5. Key Folders and Files

### Repository Root

| Path | Purpose |
|---|---|
| `web/` | Next.js web app and API backend |
| `mobile/` | React Native + Expo mobile app |
| `AGENTS.md` | Agent/AI coding instructions for this repo |
| `README.md` | This file |

### Web (`web/`)

| Path | Purpose |
|---|---|
| `src/app/` | Next.js App Router — pages and API routes |
| `src/app/api/` | All REST API route handlers |
| `src/app/(pages)/` | UI pages (listings, properties, agents, feed, messages, profile) |
| `src/components/` | Reusable React components |
| `src/db/schema.ts` | Drizzle schema — all tables, enums, and inferred TypeScript types |
| `src/db/index.ts` | Drizzle client instance (Neon HTTP driver) |
| `src/lib/jwt.ts` | `signToken` / `verifyToken` helpers |
| `src/proxy.ts` | Next.js middleware for route-level auth guards |
| `src/services/` | Business-logic helpers (property queries, image URL building) |
| `drizzle/` | Auto-generated migration files and snapshots |
| `drizzle.config.ts` | Drizzle Kit configuration |
| `scripts/` | One-off scripts (seeding, migrations, data patches) |
| `.env.local` | Local environment variables (not committed) |

### Mobile (`mobile/`)

| Path | Purpose |
|---|---|
| `app/_layout.tsx` | Root layout — wraps everything in `GestureHandlerRootView` and `AuthProvider` |
| `app/(screens)/` | Main screens group with drawer/tab layout |
| `app/(screens)/_layout.tsx` | Drawer + bottom tab navigation definition |
| `app/property/[id].tsx` | Property detail screen (outside the tab group) |
| `lib/api.ts` | Typed fetch wrapper for all API calls |
| `lib/auth-context.tsx` | `AuthProvider` and `useAuth` hook |
| `lib/types.ts` | Shared TypeScript types mirroring the web schema |
| `components/` | Shared UI components (AdminPanel, Footer, MessagesButton) |
| `app.json` | Expo app configuration (scheme, plugins, permissions) |
| `.env` | Local environment variables (not committed) |
