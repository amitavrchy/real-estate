# Haven

A luxury residential marketplace built from [PROJECT_SPEC.md](PROJECT_SPEC.md). Next.js App Router, NestJS ESM, Prisma 6, and PostgreSQL 16. The application uses a real API and database for every account, listing, inquiry, collection, review, and seller lead.

## Run locally

Requirements: Node.js 22+ and npm. Docker is optional: the local runner includes a development-only PostgreSQL 16 distribution for Windows, macOS, and Linux.

From this directory:

```sh
npm --prefix Server run setup
npm --prefix Server run dev
```

Open **http://localhost:3001**. The API runs at **http://127.0.0.1:4100**. Keep the terminal open; Ctrl+C stops the processes started by the runner. Setup creates ignored environment files with a random JWT secret, installs dependencies, migrates the database, and seeds the demo. Existing environment files are preserved. Run setup while the application is stopped.

If an existing local Postgres instance already listens on the configured database port, the runner uses it and leaves it running. Embedded Postgres data is persisted under `Server/.local/postgres` and never committed.

### Demo accounts

All demo accounts use **`HavenDemo2026!`**. Set `DEMO_PASSWORD` in `Server/.env` before seeding to override it.

| Role | Email | What to try |
| --- | --- | --- |
| Buyer | `buyer@haven.example` | Save homes, searches, collections, notes, and reviews |
| Agent | `alexandra@haven.example` | Create/edit own listings, add media, manage inquiries |
| Agent | `james@haven.example` | Verify listing and inbox isolation |
| Agent | `sophia@haven.example` | Explore a different agent portfolio |
| Admin | `admin@haven.example` | Manage all listings, journal stories, seller leads, and inquiries |

New registrations always receive the buyer role. To provision a real agent/admin account, explicitly update that account’s role through your controlled database administration process. Public registration cannot grant elevated roles.

## Included

- Responsive home, curated carousel, market snapshot, neighborhoods, advisor profiles, and journal.
- Buy/rent search with URL-persisted filters, sorting, paginated loading, clustered map pins, list/pin hover synchronization, and map-bound search.
- Listing galleries with thumbnails, fullscreen viewer, arrow-key navigation, sharing, official floor-plan and virtual-tour support, and a sticky advisor rail.
- Adjustable mortgage calculator, validated inquiries, and private-viewing requests saved to the owning advisor’s inbox.
- Bearer JWT authentication, bcrypt cost 12, role guards, ownership checks, input validation, and rate limiting of public write forms.
- Persistent favorites, saved searches, private collections, notes, and ordering. One editable review per buyer/advisor pair.
- Agent workspace with draft/published listing CRUD, image/floor-plan/tour URLs, media removal, and inquiry status management. Admins also manage journal content and seller introductions.
- Seller lead form with the specified illustrative valuation formula and persisted newsletter subscriptions.
- Local fonts, minimum 14px text, reduced-motion support, dialog focus trapping, keyboard controls, metadata, structured listing data, sitemap, robots, and useful empty/error states.

The seed includes 12 residences, 3 advisors, 2 neighborhoods, 4 journal stories, and a buyer collection. Listing images are bundled locally, so photography does not depend on a third-party service at runtime. Image sources are recorded in `Clients/scripts/download-assets.mjs`.

## Verification

With the application running:

```sh
npm --prefix Clients run typecheck
npm --prefix Server run test:e2e
npm --prefix Clients exec playwright install chromium
npm --prefix Clients run test:e2e
```

For the production builds and server unit checks:

```sh
npm --prefix Server run build:all
npm --prefix Server test
```

Browser tests cover mobile layouts, typography, command search, filters, map hover, favorites across reloads, collections/notes, inquiry delivery, and agent listing creation/editing. The accessibility test runs axe against Home and Property Detail. API integration tests cover authorization boundaries, validation, public visibility, CRUD, persistence, and inbox isolation. Tests require the demo seed. Override `E2E_BASE_URL`, `E2E_API_URL`, and `DEMO_PASSWORD` if using a different local configuration.

`Clients/test-results` and `Clients/playwright-report` are ignored. The browser suite uses sample buyer/agent accounts and may leave a test inquiry if interrupted. API tests remove their own records in cleanup.

## Docker database / manual setup

Alternatively, copy `Server/.env.example` to `Server/.env`, replace `JWT_SECRET` with a random value of at least 32 characters, and copy `Clients/.env.example` to `Clients/.env.local`. Then:

```sh
npm --prefix Server ci
npm --prefix Clients ci
docker compose -f Server/docker-compose.yml up -d postgres
npm --prefix Server run db:generate
npm --prefix Server run db:migrate
npm --prefix Server run db:seed
```

Run the API (`npm --prefix Server run start:dev`) and client (`npm --prefix Clients run dev`) in separate terminals, or use the root dev command. `prisma migrate deploy` applies the checked-in migrations without resetting existing data.

## Deployment

The retained stack requires a Node.js host for Next/Nest and a PostgreSQL database. Build both apps, apply the migrations, and run `npm --prefix Server run start:prod` and `npm --prefix Clients start -- -p 3001` under a process supervisor. The server container builds from `Server/Dockerfile` and exposes port 4100. Configure:

| Variable | Location | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Server runtime | Managed Postgres connection |
| `JWT_SECRET` | Server runtime | Random signing secret, at least 32 characters |
| `CLIENT_ORIGIN` | Server runtime | Exact browser origin allowed by CORS |
| `PORT` | Server runtime | API listener, default 4100 |
| `HOST` | Server runtime | Listener interface, default `0.0.0.0` |
| `NEXT_PUBLIC_API_URL` | Client build | Browser-reachable HTTPS API URL |
| `API_URL` | Client runtime, optional | Private server-to-server API URL |
| `NEXT_PUBLIC_SITE_URL` | Client build/runtime | Canonical site origin for SEO |

The production image must have its runtime environment set by the host. Demo seeding and embedded Postgres are deliberately disabled when `NODE_ENV=production`. For a fresh real installation, provision the first administrator through the database. Replace demo listings, advisor identities, contact details, and legal copy before public operation.

### Explicit integration boundaries

Valuation uses the spec’s mock MVP formula. Mortgage totals are illustrative. Neighborhood/school data is labeled as placeholder data. Inquiry and viewing requests persist to the inbox; the agent confirms appointments separately. Newsletter signup persists subscriptions without sending mail. Email delivery, search digests, calendar sync, live chat, collaborative presence, and the WebGL development microsite are stretch integrations and are not simulated. Collections use the spec’s owner-only MVP behavior.

Bearer sessions last eight hours and are stored in tab session storage; signing out clears the current tab. Expired tokens must sign in again. Public write rate limits use atomic database-backed buckets shared between API instances. Remote media must use a public HTTPS URL; supported tour hosts are Matterport, YouTube, and Vimeo.
