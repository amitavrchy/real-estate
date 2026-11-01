# Haven

**Frontend:** [https://haven-residence.netlify.app](https://haven-residence.netlify.app)

**Backend API:** [https://haven-api-17km.onrender.com](https://haven-api-17km.onrender.com)

A place to call your own: search Bay Area residences, save the ones you love, and work with an advisor.

## Overview

Haven is a residential marketplace. The public site is a Next.js app on Netlify. Accounts, listings, inquiries, and saved homes are served by a NestJS API on Render, with PostgreSQL and Prisma behind it. Every screen that shows a home, an advisor, or a journal story reads from that API.

Buyers can browse sales and rentals, open a listing, and keep favorites, searches, and private collections. Advisors and admins use a signed-in workspace to publish listings, answer inquiries, and manage the journal. The deployed API exposes `GET /health` when the process and the database are both up.

## Key features

- Home, buy search, rent, neighborhoods, advisor profiles, and a journal, plus a command palette for jumping through the catalog.
- Search with filters, sorting, and pagination. A Leaflet map stays in sync with the list: pins, hover, and map-bound results share the same query.
- Listing galleries, official floor plans, and virtual tours. Tour URLs must be HTTPS on Matterport, YouTube, or Vimeo. Each listing includes an illustrative mortgage estimate.
- Inquiries and private-viewing requests saved to the advisor who owns the listing.
- Registration and sign-in with a bearer JWT (eight hours). Roles are buyer, agent, and admin. New accounts are buyers. Public forms share a database-backed rate limit.
- Favorites, saved searches, and private collections with notes. One review per buyer and advisor.
- An agent workspace for draft and published listings, media, and inquiry status. Admins also edit journal stories and seller leads.
- A seller introduction that stores an illustrative value range, and a newsletter signup stored in the database. Neither sends mail.

## Tech stack

| Layer | Choices |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Client data | Redux Toolkit, TanStack Query, axios, React Hook Form, Zod |
| Interface | Framer Motion, Embla, React Leaflet, Lucide |
| API | NestJS 12, Prisma 6, PostgreSQL 16, Passport JWT, bcrypt, Helmet |
| Quality | ESLint on the client, oxlint on the API, Vitest, Playwright |
| Runtime | Node.js 22 (`.node-version` and both `package.json` `engines` fields) |
| Hosting | Netlify for the client, Render Docker for the API |

## Project structure

```
.
├── Clients/                  Next.js app (Netlify base directory)
│   ├── src/app/              Routes, metadata, sitemap, robots
│   ├── src/components/       Pages, layout, map, listing, dashboard
│   ├── src/lib/              API client, server fetch, shared types
│   ├── src/store/            Auth, favorites, UI, and map state
│   ├── e2e/                  Browser journeys
│   ├── public/               Photography and icons
│   └── Dockerfile            Standalone client image
├── Server/                   NestJS API (Render Docker context)
│   ├── src/marketplace/      Routes, auth, validation
│   ├── src/prisma/           Prisma service
│   ├── prisma/               Schema, migrations, demo seed
│   ├── test/                 API integration tests
│   ├── deploy/               Example Caddy and production env
│   ├── Dockerfile            Multi-stage API image
│   └── Dockerfile.render     API image with Postgres, used by Render
├── netlify.toml              Netlify build. Leave this at the repo root.
├── render.yaml               Render blueprint. Leave this at the repo root.
└── .github/workflows/        Scheduled health ping for the API
```

`render.yaml` describes a Docker web service. Its Dockerfile path and context are relative to the repository root, so Render’s root directory stays empty and the service tracks `main`. `netlify.toml` sets the client base directory to `Clients/`.

## Getting started

Install Node.js 22 or newer and npm. Docker is optional. From a clean checkout, `Server` can boot a development-only Postgres when Docker is not installed. Do not run setup or the demo seed when `NODE_ENV=production`.

### Frontend

```sh
cd Clients
npm ci
npm run dev
```

Copy `Clients/.env.example` to `Clients/.env.local`. Set `NEXT_PUBLIC_API_URL` to the API origin the browser should call, and `NEXT_PUBLIC_SITE_URL` to the site origin used for canonical links. A production server can set `API_URL` when server-side fetches should use a different origin than the browser.

`npm run build` produces the production client. `npm run typecheck` and `npm run lint` check types and ESLint. `npm run test:e2e` runs Playwright against a seeded API (`E2E_BASE_URL`, `E2E_API_URL`, `DEMO_PASSWORD`). `npm start` serves the standalone build.

### Backend

```sh
cd Server
npm install
```

Copy `Server/.env.example` to `Server/.env`. Set `DATABASE_URL`, `JWT_SECRET` (at least 32 random characters), `PORT`, and `CLIENT_ORIGIN` to the exact browser origin allowed by CORS. Set `TRUST_PROXY` only when the API sits behind a proxy you control. `HOST` defaults to all interfaces.

`Server/Dockerfile` and `npm run setup` install with `npm ci`. If that reports a lockfile mismatch on npm 10, use `npm install`, which is what `Server/Dockerfile.render` runs.

With `DATABASE_URL` set:

```sh
npm run db:generate
npm run db:migrate
npm run db:seed
npm run start:dev
```

`npm run build` compiles to `dist/`. `npm run typecheck` and `npm run lint` check the API. `npm test` and `npm run test:e2e` run Vitest. `npm run verify` builds both apps and runs the local checks. `npm run admin:create` provisions an administrator. `DEMO_PASSWORD` overrides the seeded password. Demo seeding stays off in production unless `ALLOW_DEMO_SEED=1`.

### Both apps

From the repository root:

```sh
npm --prefix Server run setup
npm --prefix Server run dev
```

`setup` installs `Clients/` and `Server/`, writes `JWT_SECRET` when `Server/.env` is missing, migrates, and seeds. Existing env files are kept. Stop anything already listening on `PORT` or the client dev port first. `dev` starts the API and the Next.js app and shuts both down on Ctrl+C.

Seeded accounts share one password, `HavenDemo2026!`, unless `DEMO_PASSWORD` is set before seeding.

| Role | Email |
| --- | --- |
| Buyer | `buyer@haven.example` |
| Agent | `alexandra@haven.example` |
| Agent | `james@haven.example` |
| Agent | `sophia@haven.example` |
| Admin | `admin@haven.example` |

The same demo data is loaded when the Render API container boots with `ALLOW_DEMO_SEED=1`. Replace those people, listings, and legal pages before using Haven as a real brokerage.

## Author

Amitav Roy Chowdhury — [github.com/amitavrchy](https://github.com/amitavrchy)
