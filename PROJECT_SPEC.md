# Real Estate — Project Build Spec (Agent-Ready)

> Stack locked: `Client/` Next.js App Router + TS + Tailwind + Redux Toolkit + React Query + axios + RHF/zod + framer-motion + lucide-react. `Server/` NestJS ESM + Prisma 6 + Postgres 16 (Docker) + JWT/passport + bcrypt. No zustand. Optional adds: `@react-google-maps/api` or `leaflet`+`react-leaflet`, `embla-carousel-react`, `gsap`, `lenis`, `date-fns`, `react-day-picker`, `sharp` (Next), `next-seo` patterns via metadata API.

---

## 1. Vision & Audience

**Vision:** A luxury residential marketplace + editorial brand site that feels like Compass × ERA × 111 West 57th — black/white UI restraint, photography as the only color, immersive listing discovery, collaborative Collections, and agent-grade trust. Not a cluttered Zillow clone; a premium brokerage portal.

**Audience:** Affluent buyers/renters (primary), independent agents & boutique brokerages (secondary), developers marketing new residences (tertiary).

**Brand promise:** “Find a home that feels inevitable.” Calm confidence, museum-grade photography, zero noise.

---

## 2. References (verified inspiration)

| Site | Why steal it | Link |
|------|--------------|------|
| ERA Residence (Vide Infra) | WebGL splash, interactive area map, apartment selector — Awwwards SOTD/SOTM, FWA | https://videinfra.com/work/era · live often via Awwwards “ERA Residence” |
| 111 West 57th / above-the-clouds.nyc | Scroll-driven luxury development microsite, aerial hero, floor selector — Awwwards SOTD May 2025 | https://above-the-clouds.nyc |
| Horizonte Village | Webby 2025 Real Estate Winner | https://winners.webbyawards.com/2025/websites-and-mobile-sites/general-desktop-mobile-sites/real-estate/334817/horizonte-village |
| Compass | B/W-only UI, Collections collaboration, Tiempos/Harmonia typography system | https://www.compass.com |
| Belgrade Arbor / Sobha Privy (Awwwards 2026) | Current SOTD bar for RE | https://www.awwwards.com/websites/real-estate/ |
| Sotheby's International Realty | Lifestyle editorial IA | https://www.sothebysrealty.com |

**Patterns to copy:** Photography-as-color; sticky Contact Agent rail; Collections shared shortlist; map + list dual pane; scroll-locked development stories; private exclusive badges.

---

## 3. Design System

### Color (hex)
| Token | Hex | Use |
|-------|-----|-----|
| `--ink` | `#0A0A0A` | Text, chrome |
| `--paper` | `#FAFAF8` | Background |
| `--mist` | `#F0EEEA` | Cards, chips |
| `--line` | `#E4E1DB` | Borders |
| `--muted` | `#6B6760` | Secondary text |
| `--accent` | `#1C3A2E` | CTAs (deep forest — photography stays colorful) |
| `--accent-hover` | `#143028` | Hover |
| `--warn` | `#B45309` | Price drop / urgency |
| `--success` | `#166534` | Saved / success |
| `--danger` | `#991B1B` | Errors |

Dark mode listing lightbox: `#0A0A0A` bg, white type.

### Typography
- **Display / luxury:** `Instrument Serif` or `Fraunces` (Google) — property titles, hero.
- **UI sans:** `Inter` or `Geist` — body, filters, forms.
- **Mono / data:** `JetBrains Mono` — prices, sqft, MLS IDs.
- Scale: 12 / 14 / 16 / 18 / 24 / 32 / 48 / 72 / 96. Hero H1 clamp(2.5rem, 6vw, 5.5rem).

### Spacing & grid
- Base 4px; section padding `py-24 md:py-32`; content max `1280px`; listing dual-pane `40% list / 60% map` desktop.
- Radius: `2px` (sharp luxury) on cards; `9999` pills for filters.

### Motion
- Page enter: 400ms `cubic-bezier(0.22, 1, 0.36, 1)`.
- Image reveal: clip-path or scale 1.08→1 over 800ms ease-out.
- Filter chip: 150ms ease.
- Map pin hover: 200ms spring.
- Prefer `framer-motion` for UI; add `gsap` + `ScrollTrigger` for development landing pages; `lenis` for smooth scroll on marketing pages only (disable on map-heavy views).

---

## 4. Sitemap & Section Specs

### `/` Home
1. **Nav** — logo wordmark, Buy / Rent / Sell / Agents / Journal, Search (cmd-K), Sign in. Transparent → solid on scroll.
2. **Hero** — full-bleed cinematic still or short loop video; serif H1; dual CTA “Browse homes” / “Talk to an agent”; subtle location typeahead overlaid.
3. **Search strip** — location, Buy|Rent, price range, beds; submits to `/search`.
4. **Featured Collections** — horizontal Embla carousel of curated editorial sets (“Waterfront Modern”, “Heritage Townhouses”).
5. **Market pulse** — 3 metric cards (median price, days on market, new this week) with micro charts.
6. **Neighborhood spotlight** — 3 cards with hover image zoom + stats.
7. **Agent strip** — top agents with response-time badges.
8. **Journal teasers** — 3 editorial posts.
9. **Footer** — dense links, newsletter, legal.

**Signature interactions:** Hero image Ken-Burns 12s; Collection cards parallax 8px; cmd-K command palette (listings, neighborhoods, agents).

### `/search` & `/rent`
- Sticky filter bar (price, beds, baths, type, amenities, status).
- Dual pane: infinite list (React Query infinite) + interactive map (Leaflet recommended — free). Sync hover: list↔pin highlight.
- Sort: newest, price, sqft, relevance.
- Save search → requires auth; toast + email preference.

### `/property/[slug]`
1. Gallery: Embla fullscreen + thumb strip; keyboard nav; share.
2. Sticky summary rail: price, status badge, beds/baths/sqft, CTA Contact / Schedule / Save / Share.
3. Overview, Features chips, Floor plan, Virtual tour embed slot, Map, Neighborhood scores, Similar homes, Agent card.
4. Mortgage affordability calculator (client-side).
5. Inquiry form (RHF + zod) → NestJS.

**Signature:** Image lightbox with blur backdrop; scroll progress on long PDP; “Open house” calendar with `react-day-picker`.

### `/neighborhoods/[slug]`
Editorial hero, amenities map, school ratings placeholders, listings teaser, local journal.

### `/agents` · `/agents/[slug]`
Grid + agent profile with listings, Reviews, Contact.

### `/sell` · `/valuation`
Lead form for sellers; estimated range UI (mock formula MVP).

### `/collections` · `/collections/[id]` (auth)
Shared shortlist workspace: notes, heart/rank, invite collaborator by email (MVP: owner-only notes).

### `/journal` · `/journal/[slug]`
MDX-like CMS from API; SEO article layout.

### Auth `/login` `/register` `/account`
Roles: `BUYER`, `AGENT`, `ADMIN`. Account: saved homes, searches, inquiries, Collections.

### Admin (Agent/Admin) `/dashboard/*`
Listings CRUD, inquiry inbox, media upload URLs, analytics counters.

---

## 5. Features (priority)

### MVP
- Auth (JWT access + refresh cookie or Bearer), roles
- Property CRUD (admin/agent) + public search/filter/sort/pagination
- Listing detail with gallery + map + inquiry
- Save favorites + Collections (create/add/remove)
- Agent profiles
- Home + Journal list/detail (seed content)
- Responsive + a11y basics + SEO metadata
- Docker Postgres + Prisma migrate seed

### Stretch
- Live chat / schedule tour calendar sync
- 3D/WebGL building selector (ERA-style) for one “development” microsite route
- AI CMA blurbs (out of scope unless later)
- Saved-search email digests
- Multi-currency / i18n
- Virtual tour (Matterport iframe)
- Collaborative Collection comments + presence

---

## 6. Frontend Architecture

```
Client/src/
  app/                    # App Router pages as above
  components/
    layout/ (Header, Footer, CommandPalette)
    search/ (FilterBar, ListingCard, MapPane, SortSelect)
    property/ (Gallery, SummaryRail, MortgageCalc, InquiryForm)
    collections/
    agents/
    ui/ (Button, Input, Dialog, Badge — shadcn-like with cva)
  features/
    auth/ authSlice.ts
    favorites/ favoritesSlice.ts
    search/ searchUiSlice.ts   # filters UI state only
  lib/ (api axios client, cn, formatters)
  hooks/ (useProperties, useProperty, useInfiniteListings)
  styles/ globals.css
  store/ index.ts
```

**Redux slices:** `auth`, `ui` (drawer, theme), `favorites` (optimistic ids), `searchUi` (draft filters before apply).
**React Query:** all server reads/writes for properties, agents, journal, collections, inquiries. Keys: `['properties', filters]`, `['property', slug]`, etc. Mutations invalidate.
**Forms:** RHF + zod schemas mirrored with NestJS DTOs.

**Recommended adds:** `embla-carousel-react`, `leaflet` + `react-leaflet`, `gsap`, `lenis`, `date-fns`, `react-day-picker`, `cmdk`, `class-variance-authority`.

---

## 7. Backend

### Prisma schema (authoritative)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role { BUYER AGENT ADMIN }
enum ListingStatus { DRAFT ACTIVE PENDING SOLD RENTED OFF_MARKET }
enum ListingType { SALE RENT }
enum PropertyType { HOUSE APT CONDO TOWNHOUSE LAND COMMERCIAL }
enum InquiryStatus { NEW CONTACTED CLOSED }

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  phone        String?
  role         Role     @default(BUYER)
  avatarUrl    String?
  bio          String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  listings     Property[] @relation("AgentListings")
  favorites    Favorite[]
  collections  Collection[]
  inquiries    Inquiry[]
  savedSearches SavedSearch[]
}

model Neighborhood {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  city        String
  state       String?
  country     String   @default("US")
  description String?
  heroImage   String?
  lat         Float?
  lng         Float?
  statsJson   Json?
  properties  Property[]
  posts       JournalPost[]
}

model Property {
  id             String        @id @default(cuid())
  slug           String        @unique
  title          String
  description    String
  status         ListingStatus @default(DRAFT)
  listingType    ListingType
  propertyType   PropertyType
  price          Decimal       @db.Decimal(14, 2)
  currency       String        @default("USD")
  beds           Int?
  baths          Float?
  sqft           Int?
  lotSqft        Int?
  yearBuilt      Int?
  addressLine1   String
  addressLine2   String?
  city           String
  state          String?
  postalCode     String?
  country        String        @default("US")
  lat            Float
  lng            Float
  amenities      String[]
  features       String[]
  isPrivateExclusive Boolean   @default(false)
  publishedAt    DateTime?
  neighborhoodId String?
  neighborhood   Neighborhood? @relation(fields: [neighborhoodId], references: [id])
  agentId        String
  agent          User          @relation("AgentListings", fields: [agentId], references: [id])
  media          Media[]
  favorites      Favorite[]
  collectionItems CollectionItem[]
  inquiries      Inquiry[]
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([city, listingType, status])
  @@index([price])
  @@index([lat, lng])
}

model Media {
  id         String   @id @default(cuid())
  propertyId String
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  url        String
  alt        String?
  sortOrder  Int      @default(0)
  kind       String   @default("image") // image | floorplan | video
}

model Favorite {
  id         String   @id @default(cuid())
  userId     String
  propertyId String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  @@unique([userId, propertyId])
}

model Collection {
  id        String   @id @default(cuid())
  name      String
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CollectionItem[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CollectionItem {
  id           String     @id @default(cuid())
  collectionId String
  propertyId   String
  note         String?
  rank         Int        @default(0)
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  property     Property   @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  @@unique([collectionId, propertyId])
}

model Inquiry {
  id         String        @id @default(cuid())
  propertyId String
  userId     String?
  name       String
  email      String
  phone      String?
  message    String
  status     InquiryStatus @default(NEW)
  property   Property      @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  user       User?         @relation(fields: [userId], references: [id])
  createdAt  DateTime      @default(now())
}

model SavedSearch {
  id        String   @id @default(cuid())
  userId    String
  name      String
  filters   Json
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

model JournalPost {
  id             String        @id @default(cuid())
  slug           String        @unique
  title          String
  excerpt        String
  body           String
  coverImage     String?
  publishedAt    DateTime?
  neighborhoodId String?
  neighborhood   Neighborhood? @relation(fields: [neighborhoodId], references: [id])
  createdAt      DateTime      @default(now())
}
```

### NestJS modules & endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/auth/register` | public | role BUYER default |
| POST | `/auth/login` | public | returns accessToken |
| GET | `/auth/me` | JWT | |
| GET | `/properties` | public | query: q,city,type,status,minPrice,maxPrice,beds,page,limit,bbox |
| GET | `/properties/:slug` | public | |
| POST | `/properties` | AGENT/ADMIN | |
| PATCH | `/properties/:id` | AGENT owner/ADMIN | |
| DELETE | `/properties/:id` | ADMIN | |
| POST | `/properties/:id/media` | AGENT | |
| GET | `/neighborhoods` | public | |
| GET | `/neighborhoods/:slug` | public | |
| GET | `/agents` | public | |
| GET | `/agents/:id` | public | |
| GET/POST/DELETE | `/favorites` | JWT | |
| CRUD | `/collections` + items | JWT | |
| POST | `/inquiries` | public/JWT | |
| GET | `/inquiries` | AGENT/ADMIN | |
| CRUD | `/journal` | public read; ADMIN write |
| POST | `/saved-searches` | JWT | |

**Auth:** `@nestjs/jwt` + `passport-jwt`; bcrypt cost 12; Guards `JwtAuthGuard`, `RolesGuard`.

---

## 8. Performance / A11y / SEO / Responsive

- Lighthouse: Perf ≥ 90 marketing pages; ≥ 70 search (map cost). LCP hero via `next/image` priority + AVIF/WebP.
- Map: lazy-load Leaflet only on `/search` and PDP; cluster pins.
- A11y: keyboard gallery, focus traps in dialogs, map alternatives as list, contrast AA.
- SEO: `generateMetadata` per property (Open Graph image = first media); JSON-LD `RealEstateListing` / `Residence`; sitemap.xml + robots.
- Breakpoints: mobile list-first; tablet stacked; desktop dual-pane.

---

## 9. Build Order

1. Prisma schema + seed (12 properties, 3 agents, 2 neighborhoods, 4 posts)
2. Nest auth + properties CRUD + public list
3. Client design tokens, layout, home static
4. Search dual-pane + filters wired to API
5. PDP + inquiry
6. Favorites + Collections
7. Agents + Journal + Sell form
8. Dashboard agent
9. Motion polish, SEO, a11y pass
10. Stretch: development microsite route

## 10. Acceptance Checklist

- [ ] Public can browse/search/filter without login
- [ ] Map and list stay in sync on hover/select
- [ ] Authenticated user can favorite and create Collections
- [ ] Agent can create/edit own listings with media URLs
- [ ] Inquiry creates DB row and shows in agent inbox
- [ ] Lighthouse a11y ≥ 90 on Home and PDP
- [ ] No zustand; Redux only for client UI/auth/favorites cache
- [ ] Docker compose brings up Postgres; `prisma migrate` succeeds
- [ ] Seed demo looks premium (real Unsplash architectural photos)
